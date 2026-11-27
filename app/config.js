// Supabase 대시보드 > Project Settings > API 에서 복사해 붙여넣으세요.
// anon(public) 키는 공개되어도 괜찮은 키예요. service_role 키는 절대 여기에 넣지 마세요.
window.APP_CONFIG = {
  SUPABASE_URL: "https://여기에-프로젝트주소.supabase.co",
  SUPABASE_ANON_KEY: "여기에-anon-public-키",
  SERVICE_NAME: "치과 운영 관리",   // 로그인 화면에 보이는 서비스 이름

  // 기공 의뢰서 글자 인식 (Claude API, 사용한 만큼 비용 발생)
  // 쓰려면 README의 9단계를 마친 뒤 true 로 바꾸세요. false 면 사진 저장만 돼요.
  OCR_ENABLED: false, // 🔒 기공물 글자 인식: 잠김 (README 8단계). COMING_SOON에 "lab"이 있으면 true로 바꿔도 꺼져 있어요

  // 휴대폰 알림 (무료). README의 10단계를 마친 뒤 true 로 바꾸고,
  // 운영자 화면(admin.html)에서 만든 "공개 키"를 아래에 붙여넣으세요.
  PUSH_ENABLED: false,
  VAPID_PUBLIC_KEY: "",

  // "준비 중"으로 표시할 메뉴. 다시 쓰려면 목록에서 빼세요. (lab: 기공물, ster: 멸균·소독)
  COMING_SOON: ["lab", "ster"]
};
