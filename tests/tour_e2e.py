# 체험판 가이드 투어를 처음부터 끝까지 눌러 보는 테스트
# 준비: cd demo && python3 -m http.server 8770  (다른 터미널)
# 실행: python3 tests/tour_e2e.py 1280 800 d full   또는  390 800 m quick
# executable_path 줄은 내 PC의 크롬 경로에 맞게 바꾸거나 지우세요.
import asyncio,sys
from playwright.async_api import async_playwright
W=int(sys.argv[1]);H=int(sys.argv[2]);tag=sys.argv[3];mode=sys.argv[4]
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome')
    ctx=await b.new_context(viewport={'width':W,'height':H})
    await ctx.grant_permissions(['clipboard-read','clipboard-write'])
    pg=await ctx.new_page()
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.on('dialog',lambda d:asyncio.ensure_future(d.accept()))
    await pg.goto('http://localhost:8770/');await pg.wait_for_timeout(1200)
    await pg.screenshot(path=f'/tmp/f_{tag}_intro.png')
    await pg.click('[data-tvoice]')
    await pg.click(f'[data-tgo={mode}]');await pg.wait_for_timeout(2500)
    seen=[]
    for i in range(80):
      if await pg.locator('#tour-end').count(): print('END');break
      st=await pg.evaluate("sessionStorage.getItem('tour-step')")
      h=await pg.locator('#tour-bub h4').inner_text() if await pg.locator('#tour-bub h4').count() else '?'
      seen.append((st,h))
      await pg.screenshot(path=f'/tmp/f_{tag}_{i:02d}.png')
      if await pg.locator('#tour-bub [data-tn]').count():
        await pg.click('#tour-bub [data-tn]')
      else:
        await pg.wait_for_timeout(500)
        box=await pg.evaluate("(()=>{const h=document.getElementById('tour-hole');if(!h)return null;const r=h.getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]})()")
        if box: await pg.mouse.click(box[0],box[1])
      await pg.wait_for_timeout(1300)
    import itertools
    print([f'{s}:{h}' for s,h in seen])
    await pg.screenshot(path=f'/tmp/f_{tag}_end.png')
    print('errs',errs)
    await b.close()
asyncio.run(main())
