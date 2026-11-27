// 기공 의뢰서 글자 인식 (선택 기능)
// Supabase > Edge Functions 에 이름 "lab-ocr" 로 배포하세요.
// 🔒 잠김: Secrets 에 OCR_UNLOCK=yes 와 ANTHROPIC_API_KEY 를 둘 다 넣어야 동작해요. (README 8단계)
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const prompt = (today: string) => `이 사진은 치과 기공 의뢰서입니다. 오늘은 ${today}입니다. 사진에서 읽은 내용으로 아래 형식의 JSON 객체 하나만 답하세요. 다른 말은 쓰지 마세요.
{"chart":"차트번호. 차트번호가 없으면 환자 이름의 초성만(예: ㄱㅁㅅ). 환자 이름 전체는 절대 쓰지 말 것","item":"크라운, 브릿지, 인레이·온레이, 임플란트 보철, 틀니, 교정장치, 기타 중 하나","tooth":"치아번호(FDI, 예: #36. 여러 개면 쉼표)","shade":"쉐이드(예: A2)","labname":"기공소 이름","sent":"의뢰일 YYYY-MM-DD","due":"완성·도착 희망일 YYYY-MM-DD","appt":"환자 장착(셋팅) 예약일 YYYY-MM-DD","note":"재료·디자인 등 기타 지시사항 60자 이내 요약"}
읽을 수 없거나 없는 칸은 빈 문자열로 두세요. 날짜에 연도가 없으면 오늘과 가장 가까운 날짜의 연도를 쓰세요.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    // 승인된 직원만 사용 (병원 API 비용 보호)
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: approved } = await sb.rpc("is_approved");
    if (!approved) return json({ error: "승인된 직원만 사용할 수 있어요." }, 403);

    // 잠금: 운영자가 일부러 열기 전에는 API를 부르지 않아요 (요금 0원)
    if (Deno.env.get("OCR_UNLOCK") !== "yes") return json({ error: "글자 인식은 아직 잠겨 있어요." }, 403);

    const key = Deno.env.get("ANTHROPIC_API_KEY");
    if (!key) return json({ error: "ANTHROPIC_API_KEY 가 설정되지 않았어요." }, 500);

    const { image, media_type, today } = await req.json();
    if (typeof image !== "string" || !image || image.length > 8_000_000) return json({ error: "사진이 없거나 너무 커요." }, 400);
    const day = /^\d{4}-\d{2}-\d{2}$/.test(String(today)) ? String(today) : new Date().toISOString().slice(0, 10);

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: Deno.env.get("OCR_MODEL") ?? "claude-sonnet-5-5",
        max_tokens: 800,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: media_type === "image/png" ? "image/png" : "image/jpeg", data: image } },
            { type: "text", text: prompt(day) },
          ],
        }],
      }),
    });
    const out = await r.json();
    if (!r.ok) return json({ error: out?.error?.message ?? "글자 인식 서버 오류" }, 502);
    const text = (out.content ?? []).map((c: { text?: string }) => c.text ?? "").join("");
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return json({});
    try { return json(JSON.parse(m[0])); } catch { return json({}); }
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
