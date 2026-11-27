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
i = s.rindex('</body>'); s = s[:i] + '<script src="tour.js"></script>\n' + s[i:]
for d in ('vendor',):
    import shutil
    src, dst = root / 'app' / d, root / 'demo' / d
    if src.exists():
        shutil.copytree(src, dst, dirs_exist_ok=True)
(root / 'demo' / 'index.html').write_text(s, encoding='utf-8')
print('demo/index.html 만들었어요')
