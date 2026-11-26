import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { chromium } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const baseURL = process.env.CODEMATCH_E2E_BASE_URL ?? 'http://127.0.0.1:5174'
const output = 'docs/ui-refactor/ui-2/ui-2.2/screenshots'
const viewports = [
  ['desktop-1440x900', 1440, 900],
  ['laptop-1280x800', 1280, 800],
  ['tablet-768x1024', 768, 1024],
  ['mobile-390x844', 390, 844],
]

await mkdir(output, { recursive: true })
const browser = await chromium.launch()
const context = await browser.newContext()
const page = await context.newPage()
const overflow = []

// Populate only the isolated UI-2.2 Compose database with one clearly synthetic request.
const existing = await page.request.get(`${baseURL}/api/v1/learning-requests?page=0&size=3&sort=NEWEST`)
const existingRequests = existing.ok() ? await existing.json() : { totalElements: 0 }
if (!existingRequests.totalElements) {
  const email = `ui22-visual-${crypto.randomUUID()}@example.test`
  const password = `Ui22-${crypto.randomUUID()}-Aa1!`
  await page.goto(`${baseURL}/register`)
  await page.getByLabel('Tên hiển thị').fill('Synthetic UI-2.2 Learner')
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Mật khẩu', { exact: true }).fill(password)
  await page.getByLabel('Xác nhận mật khẩu').fill(password)
  await page.getByRole('button', { name: 'Tạo tài khoản' }).click()
  await page.waitForURL(/\/account$/)
  await page.goto(`${baseURL}/learning-requests/new`)
  await page.getByLabel('Tiêu đề yêu cầu').fill('Synthetic UI-2.2: học React với PostgreSQL')
  await page.getByLabel('Mô tả ngắn').fill('Synthetic visual verification request. Không phải nội dung người dùng thật.')
  await page.getByLabel('Mục tiêu học tập').fill('Thực hành giao diện React và kết nối API trong môi trường kiểm thử cô lập.')
  await page.getByLabel('Lịch học mong muốn').fill('Buổi tối trong tuần')
  await page.getByLabel('Thời lượng dự kiến').fill('Bốn tuần')
  await page.getByLabel('Cách hướng dẫn phù hợp').fill('Giải thích và thực hành theo từng bước.')
  await page.getByLabel('React', { exact: true }).check()
  await page.getByRole('button', { name: 'Đăng yêu cầu' }).click()
  await page.waitForURL(/\/learning-requests\/[0-9a-f-]+$/)
}

await page.route('**/api/v1/auth/me', (route) => route.fulfill({
  status: 401,
  contentType: 'application/problem+json',
  body: JSON.stringify({ code: 'unauthorized', detail: 'Đăng nhập để tiếp tục.' }),
}))

for (const [label, width, height] of viewports) {
  await page.setViewportSize({ width, height })
  await page.goto(`${baseURL}/__preview/landing`)
  await page.getByRole('heading', { level: 1 }).waitFor()
  await page.locator('.landing-request-preview').waitFor()
  await page.waitForFunction(() => document.querySelector('.landing-request-preview')?.getAttribute('aria-busy') === 'false')
  await page.screenshot({ path: `${output}/integrated-${label}-fold.png` })
  await page.screenshot({ path: `${output}/integrated-${label}-full.png`, fullPage: true })
  overflow.push({ viewport: label, innerWidth: width, documentWidth: await page.evaluate(() => document.documentElement.scrollWidth) })
  if (label === 'mobile-390x844') {
    await page.getByRole('button', { name: 'Mở menu' }).click()
    await page.screenshot({ path: `${output}/integrated-mobile-navigation-390x844.png`, fullPage: true })
  }
}

await page.setViewportSize({ width: 1440, height: 900 })
await page.route('**/api/v1/learning-requests*', (route) => route.fulfill({
  status: 503,
  contentType: 'application/problem+json',
  body: JSON.stringify({ code: 'unavailable', detail: 'Thử lại sau.' }),
}))
await page.goto(`${baseURL}/__preview/landing`)
await page.getByRole('alert').waitFor()
await page.screenshot({ path: `${output}/integrated-marketplace-error-1440x900.png`, fullPage: true })

await page.unroute('**/api/v1/learning-requests*')
await page.route('**/api/v1/learning-requests*', (route) => route.fulfill({
  status: 200,
  json: { content: [], page: 0, size: 3, totalElements: 0, totalPages: 0 },
}))
await page.goto(`${baseURL}/__preview/landing`)
await page.getByText('Chưa có yêu cầu học đang mở').waitFor()
await page.screenshot({ path: `${output}/integrated-marketplace-empty-1440x900.png`, fullPage: true })

const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
await writeFile(`${output}/responsive-a11y-report.json`, JSON.stringify({
  viewports: overflow.map((result) => ({ ...result, noHorizontalOverflow: result.documentWidth <= result.innerWidth })),
  axeViolations: axe.violations.map(({ id, impact, description, nodes }) => ({ id, impact, description, nodes: nodes.map(({ html }) => html) })),
}, null, 2))

for (const [label, prototypeImage, integratedImage, width, height] of [
  ['desktop-1440x900', 'concept-a-after-desktop-1440x900-fold.png', 'integrated-desktop-1440x900-fold.png', 2880, 900],
  ['mobile-390x844', 'concept-a-after-mobile-390x844-fold.png', 'integrated-mobile-390x844-fold.png', 820, 844],
]) {
  const prototype = (await readFile(`${output}/${prototypeImage}`)).toString('base64')
  const integrated = (await readFile(`${output}/${integratedImage}`)).toString('base64')
  await page.setViewportSize({ width, height })
  await page.setContent(`<style>*{box-sizing:border-box}body{margin:0;display:grid;grid-template-columns:1fr 1fr;font:14px system-ui;background:#e9edf3}.panel{min-width:0;text-align:center}.panel h1{height:42px;margin:0;padding:10px;font-size:14px;background:#fff}.panel img{display:block;width:100%;height:auto}</style><section class="panel"><h1>Concept A prototype</h1><img src="data:image/png;base64,${prototype}"></section><section class="panel"><h1>CodeMatch integration</h1><img src="data:image/png;base64,${integrated}"></section>`)
  await page.screenshot({ path: `${output}/side-by-side-${label}.png`, fullPage: true })
}

await browser.close()

if (overflow.some(({ documentWidth, innerWidth }) => documentWidth > innerWidth)) process.exitCode = 1
if (axe.violations.length) process.exitCode = 1
