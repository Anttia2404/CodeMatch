import { chromium } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const baseUrl = process.env.CODEMATCH_BASE_URL ?? 'http://127.0.0.1:5174'
const output = dirname(fileURLToPath(import.meta.url))
await mkdir(output, { recursive: true })

const sizes = [
  ['desktop-1440x900', 1440, 900],
  ['laptop-1280x800', 1280, 800],
  ['tablet-768x1024', 768, 1024],
  ['mobile-390x844', 390, 844],
]
const browser = await chromium.launch({ headless: true })
const audit = []
for (const [name, width, height] of sizes) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 })
  const errors = []
  const apiResponses = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('response', (response) => {
    if (response.url().includes('/api/')) apiResponses.push({ url: response.url(), status: response.status() })
  })
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.getByText('Chưa có yêu cầu phù hợp').waitFor({ timeout: 15_000 })
  await page.screenshot({ path: join(output, `after-${name}.png`) })
  audit.push(await page.evaluate(({ name, width, height, errors, apiResponses }) => ({
    name, viewport: { width, height }, document: { width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight },
    horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
    railVisible: getComputedStyle(document.querySelector('.board-rail')).display !== 'none',
    detailPanelVisible: getComputedStyle(document.querySelector('.board-detail')).display !== 'none',
    elements: Object.fromEntries(['.topbar', '.board-filterbar', '.board-rail', '.board-center', '.board-detail', '.request-empty'].map((selector) => {
      const element = document.querySelector(selector)
      const rect = element.getBoundingClientRect()
      return [selector, { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) }]
    })),
    bodyStyle: { font: getComputedStyle(document.querySelector('.bordful-shell')).fontFamily, background: getComputedStyle(document.querySelector('.bordful-shell')).backgroundColor, geistLoaded: document.fonts.check('12px Geist') },
    realApiResponses: apiResponses, browserErrors: errors,
  }), { name, width, height, errors, apiResponses }))
  await page.close()
}

await browser.close()
const connectivityBrowser = await chromium.launch({ headless: true })
const connectivityPage = await connectivityBrowser.newPage({ viewport: { width: 1440, height: 900 } })
await connectivityPage.goto(baseUrl, { waitUntil: 'networkidle' })
const searchResponsePromise = connectivityPage.waitForResponse((response) => response.url().includes('/api/v1/learning-requests') && response.url().includes('q=React'))
await connectivityPage.getByRole('textbox', { name: 'Tìm yêu cầu học' }).fill('React')
const searchResponse = await searchResponsePromise
const apiSearch = { status: searchResponse.status(), url: searchResponse.url(), payload: await searchResponse.json() }
await connectivityPage.setViewportSize({ width: 390, height: 844 })
const missingResponses = []
connectivityPage.on('response', (response) => {
  if (response.url().includes('/api/v1/learning-requests/00000000-0000-4000-8000-000000000001')) missingResponses.push({ status: response.status(), url: response.url() })
})
await connectivityPage.goto(`${baseUrl}/learning-requests/00000000-0000-4000-8000-000000000001`, { waitUntil: 'networkidle' })
await connectivityPage.getByRole('alert').waitFor({ timeout: 15_000 })
await connectivityPage.screenshot({ path: join(output, 'after-mobile-detail-error-390x844.png') })
const detailError = await connectivityPage.evaluate(() => ({
  viewport: { width: innerWidth, height: innerHeight }, horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
  detailPanelDisplay: getComputedStyle(document.querySelector('.board-detail')).display,
  detailPanelClass: document.querySelector('.bordful-detail-content')?.className ?? null,
  document: { width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight },
}))
detailError.realApiResponses = missingResponses
await connectivityBrowser.close()
const { writeFile } = await import('node:fs/promises')
await writeFile(join(output, 'after-capture-audit.json'), `${JSON.stringify({ viewports: audit, apiSearch, detailError }, null, 2)}\n`)
console.log(JSON.stringify({ viewports: audit, apiSearch, detailError }, null, 2))
