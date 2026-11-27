// @ts-nocheck  (웹 푸시 부분은 일반 JavaScript로 작성돼 있어요)
// 휴대폰 알림 발송
// Supabase > Edge Functions 에 이름 "notify" 로 배포하세요. (README 10단계)
// Secrets: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT(mailto:주소), CRON_SECRET
//
//  - 앱에서 저장할 때: { event, module, id, extra } 를 로그인 토큰과 함께 보내요.
//    누구에게 무슨 문구로 보낼지는 데이터베이스(notify_targets)가 정해요. 앱이 문구를 정할 수 없어요.
//  - 매일 아침: 헤더 x-cron-secret 을 붙여 { daily: true } 로 호출해요.
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const EVENTS = ["notice_new", "alert_new", "task_new", "task_done", "repair_new", "repair_done", "inv_low", "shift_change", "test"];
const URGENT = ["alert_new", "repair_new"];

// ---- webpush start (README: 이 파일 하나만 붙여넣으면 돼요) ----
// 웹 푸시 발송 (외부 라이브러리 없이 WebCrypto 로 직접 구현)
//   RFC 8291 메시지 암호화 (aes128gcm) + RFC 8292 VAPID 서명
//   Deno(Supabase Edge Functions)와 Node 18+ 에서 그대로 동작해요.

const enc = new TextEncoder();

export function b64u(buf) {
  const b = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
export function unb64u(str) {
  const s = String(str).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(s + "===".slice((s.length + 3) % 4));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function concat(...parts) {
  const n = parts.reduce((a, p) => a + p.length, 0), out = new Uint8Array(n);
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}
async function hkdf(salt, ikm, info, len) {
  const key = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info }, key, len * 8));
}

// VAPID 개인키(base64url 32바이트) + 공개키(base64url 65바이트) → 서명용 키
async function vapidKey(publicKey, privateKey) {
  const pub = unb64u(publicKey);
  if (pub.length !== 65 || pub[0] !== 4) throw new Error("VAPID_PUBLIC_KEY 형식이 올바르지 않아요");
  const jwk = { kty: "EC", crv: "P-256", d: privateKey, x: b64u(pub.slice(1, 33)), y: b64u(pub.slice(33, 65)), ext: true };
  return crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
}

export async function vapidHeader(endpoint, vapid) {
  const aud = new URL(endpoint).origin;
  const head = b64u(enc.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const body = b64u(enc.encode(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: vapid.subject })));
  const key = await vapidKey(vapid.publicKey, vapid.privateKey);
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, enc.encode(head + "." + body));
  return `vapid t=${head}.${body}.${b64u(sig)}, k=${vapid.publicKey}`;
}

// 구독(p256dh, auth)에 맞춰 내용을 암호화 (RFC 8291)
export async function encrypt(payload, p256dh, authSecret, _test) {
  const ua = unb64u(p256dh), auth = unb64u(authSecret);
  if (ua.length !== 65 || auth.length !== 16) throw new Error("구독 키 형식이 올바르지 않아요");
  const eph = _test?.eph ?? await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const asPub = new Uint8Array(await crypto.subtle.exportKey("raw", eph.publicKey));
  const uaKey = await crypto.subtle.importKey("raw", ua, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: uaKey }, eph.privateKey, 256));
  const ikm = await hkdf(auth, shared, concat(enc.encode("WebPush: info\0"), ua, asPub), 32);
  const salt = _test?.salt ?? crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, enc.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, ikm, enc.encode("Content-Encoding: nonce\0"), 12);
  const data = typeof payload === "string" ? enc.encode(payload) : payload;
  if (data.length > 3800) throw new Error("알림 내용이 너무 길어요");
  const key = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, key, concat(data, new Uint8Array([2]))));
  const rs = new Uint8Array([0, 0, 16, 0]); // 4096
  return concat(salt, rs, new Uint8Array([asPub.length]), asPub, ct);
}

// 한 기기로 발송. 결과: { ok, status, gone }
export async function sendPush(sub, message, vapid, opts = {}) {
  const body = await encrypt(JSON.stringify(message), sub.p256dh, sub.auth);
  const res = await (opts.fetch ?? fetch)(sub.endpoint, {
    method: "POST",
    headers: {
      Authorization: await vapidHeader(sub.endpoint, vapid),
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      TTL: String(opts.ttl ?? 86400),
      Urgency: opts.urgency ?? "normal",
    },
    body,
  });
  return { ok: res.status >= 200 && res.status < 300, status: res.status, gone: res.status === 404 || res.status === 410 };
}
// ---- webpush end ----

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const vapid = {
      publicKey: Deno.env.get("VAPID_PUBLIC_KEY") ?? "",
      privateKey: Deno.env.get("VAPID_PRIVATE_KEY") ?? "",
      subject: Deno.env.get("VAPID_SUBJECT") ?? "mailto:admin@example.com",
    };
    if (!vapid.publicKey || !vapid.privateKey) return json({ error: "VAPID 키가 설정되지 않았어요." }, 500);
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false },
    });
    const body = await req.json().catch(() => ({}));

    let targets: any[] = [], urgency = "normal";
    const cron = Deno.env.get("CRON_SECRET");
    if (body.daily) {
      if (!cron || req.headers.get("x-cron-secret") !== cron) return json({ error: "권한이 없어요." }, 403);
      const { data, error } = await admin.rpc(body.leave ? "leave_targets" : "daily_targets");
      if (error) throw error;
      targets = data ?? [];
    } else {
      const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
      const { data: u } = await admin.auth.getUser(jwt);
      if (!u?.user) return json({ error: "로그인이 필요해요." }, 401);
      const event = String(body.event ?? "");
      if (!EVENTS.includes(event)) return json({ error: "알 수 없는 알림이에요." }, 400);
      const { data, error } = await admin.rpc("notify_targets", {
        p_caller: u.user.id,
        p_module: body.module == null ? null : String(body.module).slice(0, 40),
        p_id: body.id == null ? null : String(body.id).slice(0, 80),
        p_event: event,
        p_extra: body.extra && typeof body.extra === "object" ? body.extra : {},
      });
      if (error) throw error;
      targets = data ?? [];
      if (URGENT.includes(event)) urgency = "high";
    }

    let sent = 0, dropped = 0, failed = 0;
    await Promise.all(targets.map(async (t) => {
      try {
        const r = await sendPush(t, { title: t.title, body: t.body, url: t.url, tag: t.tag }, vapid, { urgency });
        if (r.ok) sent++;
        else if (r.gone) { dropped++; await admin.rpc("drop_push_sub", { p_endpoint: t.endpoint }); }
        else failed++;
      } catch (_) { failed++; }
    }));
    return json({ sent, dropped, failed });
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
