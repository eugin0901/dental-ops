"""app/index.html 을 바탕으로 체험판 demo/index.html 을 만들어요.
실행: python3 tools/build_demo.py  (dental-ops 폴더에서)
- supabase CDN 스크립트와 manifest 링크를 빼고, 제목 앞에 '체험판 · '을 붙이고, tour.js 를 넣어요.
- 체험판 가짜 서버(로그인·데이터)는 demo/config.js 에 있어요."""
import re, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
s = (root / 'app' / 'index.html').read_text(encoding='utf-8')
s = re.sub(r'<script[^>]*supabase[^>]*></script>\s*', '', s, count=1)
s = re.sub(r'<link rel="manifest"[^>]*>\s*', '', s, count=1)
s = s.replace('<title>', '<title>체험판 · ', 1)
# 카카오톡·문자 등으로 링크를 보낼 때 뜨는 미리보기 카드 (이미지: demo/og.jpg, 1200x630)
SITE = 'https://eugin0901.github.io/dental-ops/'
OG = f'''<meta name="description" content="가입 없이 바로 써보는 치과 운영 관리. 공지·업무 전달, 근무표·연차, 재고·주문, 장비 점검을 한 화면에서.">
<meta property="og:type" content="website">
<meta property="og:site_name" content="치과 운영 관리">
<meta property="og:title" content="치과 운영 관리 체험판">
<meta property="og:description" content="가입 없이 바로 써보세요. 단톡방·종이 체크리스트·엑셀 대신 직원 업무를 한 화면에서.">
<meta property="og:url" content="{SITE}">
<meta property="og:image" content="{SITE}og.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
'''
s = s.replace('</title>\n', '</title>\n' + OG, 1)
i = s.rindex('</body>'); s = s[:i] + '<script src="tour.js"></script>\n' + s[i:]
for d in ('vendor',):
    import shutil
    src, dst = root / 'app' / d, root / 'demo' / d
    if src.exists():
        shutil.copytree(src, dst, dirs_exist_ok=True)
(root / 'demo' / 'index.html').write_text(s, encoding='utf-8')
print('demo/index.html 만들었어요')
