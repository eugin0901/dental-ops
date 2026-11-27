// 출퇴근 찍기 (치과 와이파이 확인)
// Supabase > Edge Functions 에 이름 "punch" 로 배포하세요. (README 10단계)
//  - 휴대폰이 접속한 인터넷 주소(공인 IP)를 서버가 직접 보고, 치과로 등록된 주소일 때만 기록해요.
//  - { kind: "in" | "out", auto: true|false }  출근/퇴근 (auto: 앱을 열 때 자동 출근)
//  - { register: true } / { clear: true }        관리자: 지금 와이파이를 치과로 등록 / 모두 지우기
//  - { whoami: true }                            지금 주소가 치과 와이파이인지 확인만
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for") ?? "";
  const first = xff.split(",")[0].trim();
  return first || req.headers.get("x-real-ip") || req.headers.get("cf-connecting-ip") || "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false },
    });
    const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const { data: u } = await admin.auth.getUser(jwt);
    if (!u?.user) return json({ status: "login" }, 401);
    const ip = clientIp(req);
    if (!ip) return json({ status: "noip" });
    const body = await req.json().catch(() => ({}));

    if (body.register || body.clear) {
      const { data, error } = await admin.rpc("wifi_register", { p_caller: u.user.id, p_ip: ip, p_clear: !!body.clear });
      if (error) throw error;
      return json(data);
    }
    if (body.whoami) {
      const { data, error } = await admin.rpc("punch_record", { p_caller: u.user.id, p_ip: ip, p_kind: "check", p_auto: false });
      if (error) throw error;
      return json({ status: data?.status === "not_wifi" ? "not_wifi" : "wifi" });
    }
    const kind = body.kind === "out" ? "out" : "in";
    const { data, error } = await admin.rpc("punch_record", { p_caller: u.user.id, p_ip: ip, p_kind: kind, p_auto: !!body.auto });
    if (error) throw error;
    return json(data);
  } catch (e) {
    return json({ status: "error", error: String((e as Error)?.message ?? e) }, 500);
  }
});
