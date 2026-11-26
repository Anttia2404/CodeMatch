import { chromium } from 'playwright';
import fs from 'node:fs/promises';
const out = 'docs/ui-refactor/ui-2';
await fs.mkdir(out, { recursive: true });
const candidates = [
  ['shadcn-bjorn', 'https://shadcn-landing-page.bjornleonhenry.com/'],
  ['convertly', 'https://convertly.meku.app/'],
  ['landy', 'https://landy-web.netlify.app/'],
];
const browser = await chromium.launch({ headless: true });
for (const [name, url] of candidates) {
  for (const [label, width, height] of [['desktop', 1440, 900], ['mobile', 390, 844]]) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1, isMobile: label === 'mobile', hasTouch: label === 'mobile' });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch(async e => { errors.push(e.message); return null; });
    await page.screenshot({ path: `${out}/${name}-${label}.png`, fullPage: true, animations: 'disabled', timeout: 60000 }).catch(e => errors.push(`screenshot: ${e.message}`));
    console.log(JSON.stringify({ name, label, requestedUrl: url, finalUrl: page.url(), status: response?.status() ?? null, title: await page.title().catch(() => ''), screenshot: `${out}/${name}-${label}.png`, errors }));
    await page.close();
  }
}
await browser.close();
