import { chromium } from '@playwright/test'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const directory = dirname(fileURLToPath(import.meta.url))
const appUrl = process.env.CODEMATCH_BASE_URL ?? 'http://127.0.0.1:5175'
const apiUrl = process.env.CODEMATCH_VISUAL_API_ORIGIN ?? 'http://127.0.0.1:18080'
const referenceBoardUrl = process.env.BORDFUL_REFERENCE_URL ?? 'https://bordful.com/jobs'
const viewports = [
  ['desktop-1440x900', 1440, 900],
  ['laptop-1280x800', 1280, 800],
  ['tablet-768x1024', 768, 1024],
  ['mobile-390x844', 390, 844],
]

const list = await fetch(`${apiUrl}/api/v1/learning-requests?size=20`).then(async (response) => {
  if (!response.ok) throw new Error(`Visual-test API returned ${response.status}.`)
  return response.json()
})
if (list.totalElements !== 15) throw new Error(`Expected exactly 15 isolated synthetic requests; found ${list.totalElements}.`)
const requestId = list.content[0]?.id
if (!requestId) throw new Error('The isolated visual-test database has no request to capture.')

await mkdir(directory, { recursive: true })
const browser = await chromium.launch({ headless: true })
const audit = { generatedAt: new Date().toISOString(), fixtureLabel: 'SYNTHETIC VISUAL TEST DATA ONLY', requestId, referenceUrl: null, viewports: [] }
const styleSelectors = {
  breadcrumb: '[aria-label="Breadcrumb"]',
  title: '[data-testid="job-title"]',
  facts: '[data-testid="job-facts"]',
  factCell: '[data-testid="job-facts"] dl > div',
  description: '[data-testid="job-description"]',
  stickyAction: '[data-testid="job-sticky-apply"]',
}
const appStyleSelectors = {
  breadcrumb: '.request-detail-breadcrumb',
  title: '.request-detail-header h1',
  facts: '.request-detail-facts',
  factCell: '.request-detail-facts .detail-fact',
  sectionHeading: '.request-detail-document .detail-section h2',
  sectionBody: '.request-detail-document .detail-section p',
  actionBar: '.request-detail-actionbar',
}

const referenceBrowserPage = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await referenceBrowserPage.goto(referenceBoardUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })
const referenceHref = await referenceBrowserPage.locator('[data-testid="job-row-link"]').first().getAttribute('href', { timeout: 30000 })
if (!referenceHref) throw new Error('Could not get a real selected-job route from Bordful.')
const referenceDetailUrl = new URL(referenceHref, referenceBoardUrl).href
audit.referenceUrl = referenceDetailUrl
await referenceBrowserPage.close()

const extractStyles = async (page, selectors) => page.evaluate((entries) => Object.fromEntries(entries.map(([key, selector]) => {
  const element = document.querySelector(selector)
  if (!element) return [key, null]
  const style = getComputedStyle(element)
  const bounds = element.getBoundingClientRect()
  return [key, {
    x: Math.round(bounds.x), y: Math.round(bounds.y), width: Math.round(bounds.width), height: Math.round(bounds.height),
    fontFamily: style.fontFamily, fontSize: style.fontSize, fontWeight: style.fontWeight, lineHeight: style.lineHeight,
    letterSpacing: style.letterSpacing, padding: style.padding, margin: style.margin, gap: style.gap,
    border: style.border, borderRadius: style.borderRadius, boxShadow: style.boxShadow,
    position: style.position, bottom: style.bottom, backgroundColor: style.backgroundColor, color: style.color,
  }]
})), Object.entries(selectors))

for (const [name, width, height] of viewports) {
  const reference = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 })
  await reference.goto(referenceDetailUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await reference.getByTestId('job-title').waitFor({ timeout: 30000 })
  await reference.evaluate(() => document.fonts.ready)
  await reference.screenshot({ path: join(directory, `ui-1-3-reference-detail-${name}.png`) })
  const referenceStyles = await extractStyles(reference, styleSelectors)
  await reference.close()

  const app = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 })
  const pageErrors = []
  app.on('pageerror', (error) => pageErrors.push(error.message))
  await app.goto(`${appUrl}/learning-requests/${requestId}`, { waitUntil: 'networkidle' })
  await app.locator('.request-detail-document').getByRole('heading', { level: 1 }).waitFor({ timeout: 20000 })
  await app.evaluate(() => document.fonts.ready)
  await app.screenshot({ path: join(directory, `ui-1-3-codematch-detail-${name}.png`) })
  const appStyles = await extractStyles(app, appStyleSelectors)
  const checks = await app.evaluate(() => {
    const action = document.querySelector('.request-detail-actionbar')
    const nav = document.querySelector('.mobile-bottom-nav')
    const title = document.querySelector('.request-detail-header h1')
    const breadcrumb = document.querySelector('.request-detail-breadcrumb')
    const actionRect = action?.getBoundingClientRect()
    return {
      viewport: { width: innerWidth, height: innerHeight },
      documentWidth: document.documentElement.scrollWidth,
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
      breadcrumbVisible: Boolean(breadcrumb && getComputedStyle(breadcrumb).display !== 'none'),
      titleVisible: Boolean(title && title.getBoundingClientRect().width > 0),
      detailHasOuterCardOnMobile: innerWidth <= 680 ? getComputedStyle(document.querySelector('.request-detail-document')).boxShadow !== 'none' || getComputedStyle(document.querySelector('.request-detail-document')).borderTopWidth !== '0px' : null,
      searchVisible: Boolean(document.querySelector('.header-search') && getComputedStyle(document.querySelector('.header-search')).display !== 'none'),
      mobileBottomNavigation: nav ? getComputedStyle(nav).display : null,
      actionPosition: action ? getComputedStyle(action).position : null,
      actionAtViewportBottom: actionRect ? Math.abs(actionRect.bottom - innerHeight) < 2 : null,
      actionBottom: actionRect ? Math.round(actionRect.bottom) : null,
    }
  })
  checks.browserErrors = pageErrors
  const loginCta = app.getByRole('link', { name: 'Đăng nhập để gửi đề xuất' })
  const anonymousProposalLogin = await loginCta.count() === 1 && await loginCta.getAttribute('href') === '/login'
  const anonymousSaveLogin = await app.getByRole('link', { name: 'Đăng nhập để lưu' }).count() === 1

  const left = (await readFile(join(directory, `ui-1-3-reference-detail-${name}.png`))).toString('base64')
  const right = (await readFile(join(directory, `ui-1-3-codematch-detail-${name}.png`))).toString('base64')
  const comparison = await browser.newPage({ viewport: { width: width * 2, height }, deviceScaleFactor: 1 })
  await comparison.setContent(`<style>*{box-sizing:border-box}body{margin:0;background:#fff;font:600 14px Arial,sans-serif}.labels{height:28px;display:grid;grid-template-columns:1fr 1fr;align-items:center;text-align:center}.shots{height:calc(100vh - 28px);display:grid;grid-template-columns:1fr 1fr}.shots img{display:block;width:100%;height:100%;object-fit:fill}</style><div class="labels"><span>Bordful — ${name} — selected job</span><span>CodeMatch — ${name} — selected request</span></div><div class="shots"><img src="data:image/png;base64,${left}"><img src="data:image/png;base64,${right}"></div>`)
  await comparison.screenshot({ path: join(directory, `ui-1-3-comparison-detail-${name}.png`) })
  await comparison.close()
  await app.close()
  audit.viewports.push({ name, width, height, referenceStyles, appStyles, checks, anonymousProposalLogin, anonymousSaveLogin })
}

await browser.close()
await writeFile(join(directory, 'ui-1-3-computed-styles.json'), `${JSON.stringify(audit, null, 2)}\n`)
console.log(JSON.stringify(audit, null, 2))
