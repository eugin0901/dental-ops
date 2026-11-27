"""brochure/index.html → docs/시범치과_모집_안내.pdf (A4). 필요: pip install playwright && playwright install chromium"""
import asyncio, pathlib
from playwright.async_api import async_playwright
root = pathlib.Path(__file__).resolve().parent.parent
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page()
        await pg.goto((root / 'brochure' / 'index.html').as_uri()); await pg.wait_for_timeout(800)
        await pg.pdf(path=str(root / 'docs' / '시범치과_모집_안내.pdf'), prefer_css_page_size=True, print_background=True)
        await b.close()
asyncio.run(main()); print('PDF 만들었어요')
