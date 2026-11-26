import { chromium } from '@playwright/test'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = dirname(fileURLToPath(import.meta.url))
const baseUrl = process.env.CODEMATCH_BASE_URL ?? 'http://127.0.0.1:5175'
const referenceUrl = process.env.BORDFUL_REFERENCE_URL ?? 'https://bordful.com/jobs'
const sizes = [
  ['desktop-1440x900', 1440, 900],
  ['laptop-1280x800', 1280, 800],
  ['tablet-768x1024', 768, 1024],
  ['mobile-390x844', 390, 844],
]
await mkdir(dir, { recursive: true })
const browser = await chromium.launch({ headless: true })
const report = { generatedAt: new Date().toISOString(), dataset: 'Synthetic visual testing data only; isolated codematch_e2e PostgreSQL', viewports: [] }

for (const [name, width, height] of sizes) {
  const ref = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 })
  await ref.goto(referenceUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await ref.waitForTimeout(3000)
  await ref.screenshot({ path: join(dir, `reference-populated-${name}.png`), fullPage: false })
  const referenceInfo = await ref.evaluate(() => ({ title: document.title, url: location.href, width: document.documentElement.scrollWidth, jobs: document.querySelectorAll('a[href*="/jobs/"]').length }))
  let referenceDetail = null
  const firstJob = ref.locator('[data-testid="job-row-link"]').first()
  if (await firstJob.count()) {
    try {
      await firstJob.click({ timeout: 5000 })
      await ref.waitForTimeout(800)
      await ref.screenshot({ path: join(dir, `reference-selected-detail-${name}.png`), fullPage: false })
      referenceDetail = { url: ref.url(), selected: true }
    } catch (error) {
      referenceDetail = { selected: false, reason: String(error).split('\n')[0] }
      await ref.screenshot({ path: join(dir, `reference-selected-detail-${name}.png`), fullPage: false })
    }
  }
  await ref.close()

  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 })
  const errors = []
  const apiResponses = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('response', (response) => { if (response.url().includes('/api/')) apiResponses.push({ url: response.url(), status: response.status() }) })
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.getByRole('article').first().waitFor({ timeout: 20000 })
  const requestUrl = await page.locator('.request-title').first().getAttribute('href')
  const requestCount = await page.locator('.request-card').count()
  await page.screenshot({ path: join(dir, `populated-marketplace-${name}.png`), fullPage: false })
  const metrics = await page.evaluate(() => ({
    viewport: { width: innerWidth, height: innerHeight }, documentWidth: document.documentElement.scrollWidth,
    horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
    fontFamily: getComputedStyle(document.querySelector('.bordful-shell')).fontFamily,
    geistLoaded: document.fonts.check('12px Geist'),
    requestCount: document.querySelectorAll('.request-card').length,
    layout: Object.fromEntries(['.topbar', '.board-filterbar', '.board-rail', '.board-center', '.board-detail', '.request-card'].map((selector) => {
      const element = document.querySelector(selector)
      if (!element) return [selector, null]
      const rect = element.getBoundingClientRect()
      return [selector, { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height), display: getComputedStyle(element).display,
        border: getComputedStyle(element).border, borderRadius: getComputedStyle(element).borderRadius }]
    })),
  }))

  await page.goto(new URL(requestUrl, baseUrl).href, { waitUntil: 'networkidle' })
  await page.locator('.bordful-detail-content').waitFor({ timeout: 15000 })
  await page.screenshot({ path: join(dir, `populated-selected-detail-${name}.png`), fullPage: false })
  const detailVisible = await page.locator('.bordful-detail-content').isVisible()
  const selectedMetrics = await page.evaluate(() => ({
    horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
    layout: Object.fromEntries(['.board-rail', '.board-center', '.board-detail', '.bordful-detail-content'].map((selector) => {
      const element = document.querySelector(selector)
      if (!element) return [selector, null]
      const rect = element.getBoundingClientRect()
      return [selector, { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height), display: getComputedStyle(element).display }]
    })),
  }))

  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  const searchResponsePromise = page.waitForResponse((response) => response.url().includes('/api/v1/learning-requests') && response.url().includes('q=Spring+Boot'))
  await page.getByRole('textbox', { name: 'Tìm yêu cầu học' }).fill('Spring Boot')
  const searchResponse = await searchResponsePromise
  if (searchResponse.status() !== 200) throw new Error(`Search returned ${searchResponse.status()} at ${name}`)
  await page.waitForFunction(() => document.querySelectorAll('.request-card').length === 1, null, { timeout: 15000 })
  await page.screenshot({ path: join(dir, `populated-search-results-${name}.png`), fullPage: false })
  const searchCount = await page.locator('.request-card').count()

  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  const filterResponsePromise = page.waitForResponse((response) => response.url().includes('/api/v1/learning-requests') && response.url().includes('level=BEGINNER'))
  await page.getByRole('combobox', { name: 'Mức hiện tại' }).selectOption('BEGINNER')
  const filterResponse = await filterResponsePromise
  if (filterResponse.status() !== 200) throw new Error(`Filter returned ${filterResponse.status()} at ${name}`)
  await page.waitForFunction(() => document.querySelectorAll('.request-card').length === 5, null, { timeout: 15000 })
  await page.screenshot({ path: join(dir, `populated-active-filter-${name}.png`), fullPage: false })
  const filterCount = await page.locator('.request-card').count()

  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.getByRole('textbox', { name: 'Tìm yêu cầu học' }).fill('khong-co-ket-qua-ui-1-1')
  await page.waitForTimeout(600)
  await page.getByText('Chưa có yêu cầu phù hợp').waitFor({ timeout: 10000 })
  await page.screenshot({ path: join(dir, `populated-empty-results-${name}.png`), fullPage: false })
  const emptyShown = await page.getByText('Chưa có yêu cầu phù hợp').isVisible()

  let mobile = null
  if (width <= 640) {
    await page.goto(baseUrl, { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Mở menu' }).click()
    await page.screenshot({ path: join(dir, `populated-mobile-navigation-${name}.png`), fullPage: false })
    const menuExpanded = await page.getByRole('button', { name: 'Mở menu' }).getAttribute('aria-expanded')
    await page.getByRole('button', { name: 'Mở menu' }).click()
    await page.getByRole('combobox', { name: 'Mức hiện tại' }).selectOption('INTERMEDIATE')
    await page.waitForTimeout(500)
    await page.screenshot({ path: join(dir, `populated-mobile-filters-${name}.png`), fullPage: false })
    const filterCount = await page.locator('.request-card').count()
    await page.getByRole('button', { name: 'Xóa lọc Trình độ' }).click()
    await page.waitForFunction(() => document.querySelectorAll('.request-card').length === 15, null, { timeout: 15000 })
    mobile = { menuExpanded, filterCount, filterClearWorks: await page.locator('.request-card').count() === 15 }
  }

  report.viewports.push({ name, reference: referenceInfo, referenceDetail, requestCount, selectedDetailVisible: detailVisible, selectedMetrics, searchCount, activeFilterCount: filterCount, emptyStateVisible: emptyShown, mobile, metrics, apiResponses, browserErrors: errors })
  await page.close()
}

// Produce labelled screenshots with Bordful on the left and CodeMatch on the right.
for (const [name, width, height] of sizes) {
  for (const state of ['marketplace', 'selected-detail']) {
    const referenceState = state === 'marketplace' ? 'populated' : 'selected-detail'
    const left = (await readFile(join(dir, `reference-${referenceState}-${name}.png`))).toString('base64')
    const right = (await readFile(join(dir, `populated-${state === 'marketplace' ? 'marketplace' : 'selected-detail'}-${name}.png`))).toString('base64')
    const page = await browser.newPage({ viewport: { width: width * 2, height }, deviceScaleFactor: 1 })
    await page.setContent(`<style>*{box-sizing:border-box}body{margin:0;background:#fff;font:600 14px Arial,sans-serif}.labels{height:28px;display:grid;grid-template-columns:1fr 1fr;align-items:center;text-align:center;background:#fff}.shots{height:calc(100vh - 28px);display:grid;grid-template-columns:1fr 1fr}.shots img{display:block;width:100%;height:100%;object-fit:fill}</style><div class="labels"><span>Bordful — ${name} — ${state}</span><span>CodeMatch — ${name} — ${state}</span></div><div class="shots"><img src="data:image/png;base64,${left}"><img src="data:image/png;base64,${right}"></div>`)
    await page.screenshot({ path: join(dir, `comparison-${state}-${name}.png`) })
    await page.close()
  }
}
await browser.close()
await writeFile(join(dir, 'ui-1-1-capture-audit.json'), `${JSON.stringify(report, null, 2)}\n`)
console.log(JSON.stringify(report, null, 2))
