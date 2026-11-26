import { chromium } from '@playwright/test'
import { writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = dirname(fileURLToPath(import.meta.url))
const localUrl = process.env.CODEMATCH_BASE_URL ?? 'http://127.0.0.1:5175'
const referenceUrl = process.env.BORDFUL_REFERENCE_URL ?? 'https://bordful.com/jobs'
const viewports = [['desktop-1440x900', 1440, 900], ['mobile-390x844', 390, 844]]
const browser = await chromium.launch({ headless: true })

async function inspect(page, reference) {
  return page.evaluate((isReference) => {
    const style = (element) => {
      if (!element) return null
      const css = getComputedStyle(element)
      const rect = element.getBoundingClientRect()
      return {
        rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
        font: `${css.fontSize} / ${css.fontWeight} / ${css.lineHeight} / ${css.letterSpacing}`,
        padding: css.padding,
        gap: css.gap,
        border: css.border,
        radius: css.borderRadius,
        shadow: css.boxShadow,
        color: css.color,
        background: css.backgroundColor,
      }
    }
    if (isReference) {
      const listItem = document.querySelector('[data-testid="job-row"]')
      const row = listItem?.querySelector(':scope > article')
      const parts = row ? [...row.querySelectorAll(':scope > *')] : []
      const part = (area) => parts.find((element) => getComputedStyle(element).gridArea === area)
      const filter = [...document.querySelectorAll('button, summary')].find((element) => {
        const box = element.getBoundingClientRect()
        return (element.innerText ?? '').trim().startsWith('Category') && box.width > 0 && box.height > 0
      })
      const previewHeading = [...document.querySelectorAll('h1,h2,h3')].find((element) => element.textContent?.includes('Pick a role'))
      let preview = previewHeading
      while (preview && preview !== document.body) {
        const css = getComputedStyle(preview)
        if (css.borderRadius.startsWith('14px') && preview.getBoundingClientRect().width > 300) break
        preview = preview.parentElement
      }
      const fixedNav = [...document.querySelectorAll('nav')].find((element) => getComputedStyle(element).position === 'fixed')
      const title = row?.querySelector('h2')
      const logo = row?.querySelector('[data-testid="job-row-logo"]')
      return {
        header: style(document.querySelector('header')),
        row: style(row), mark: style(logo), title: style(title), metadata: style(part('meta')),
        budget: style(part('salary')), time: style(part('time')), filterPill: style(filter),
        placeholder: innerWidth <= 680 ? null : style(preview), bottomNavigation: style(fixedNav),
        bottomNavigationItems: [...(fixedNav?.querySelectorAll('a') ?? [])].map((item) => ({ text: item.innerText.trim(), ...style(item) })),
      }
    }
    const row = document.querySelector('.bordful-request-row')
    const title = row?.querySelector('.request-title')
    const metadata = row?.querySelector('.request-description')
    const budget = row?.querySelector('.request-price strong')
    const time = row?.querySelector('.request-price span')
    const filter = document.querySelector('.filter-chip')
    const placeholder = document.querySelector('.detail-placeholder')
    const bottomNav = document.querySelector('.mobile-bottom-nav')
    return {
      header: style(document.querySelector('.bordful-topbar')),
      row: style(row), mark: style(row?.querySelector('.request-mark')), title: style(title),
      metadata: style(metadata), budget: style(budget), time: style(time), filterPill: style(filter),
      placeholder: style(placeholder), bottomNavigation: style(bottomNav),
      bottomNavigationItems: [...(bottomNav?.querySelectorAll('a') ?? [])].map((item) => ({ text: item.innerText.trim(), ...style(item) })),
    }
  }, reference)
}

const report = { generatedAt: new Date().toISOString(), source: referenceUrl, implementation: localUrl, viewports: {} }
for (const [name, width, height] of viewports) {
  const reference = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 })
  await reference.goto(referenceUrl, { waitUntil: 'domcontentloaded', timeout: 90000 })
  await reference.waitForTimeout(1800)
  const referenceStyles = await inspect(reference, true)
  const local = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 })
  await local.goto(localUrl, { waitUntil: 'networkidle', timeout: 30000 })
  await local.locator('.request-card').first().waitFor({ timeout: 15000 })
  const localStyles = await inspect(local, false)
  report.viewports[name] = { bordful: referenceStyles, codematch: localStyles }
  await reference.close()
  await local.close()
}
await browser.close()
await writeFile(join(dir, 'ui-1-2-computed-styles.json'), `${JSON.stringify(report, null, 2)}\n`)

const rows = []
for (const name of Object.keys(report.viewports)) {
  const viewport = report.viewports[name]
  for (const component of ['row', 'mark', 'title', 'metadata', 'budget', 'time', 'filterPill', 'placeholder', 'bottomNavigation']) {
    const ref = viewport.bordful[component]
    const local = viewport.codematch[component]
    if (!ref || !local) continue
    rows.push(`| ${name} | ${component} | ${ref.rect.width}×${ref.rect.height}; ${ref.font}; ${ref.padding}; ${ref.gap}; ${ref.radius} | ${local.rect.width}×${local.rect.height}; ${local.font}; ${local.padding}; ${local.gap}; ${local.radius} |`)
  }
}
const markdown = `# UI-1.2 Computed Style Comparison\n\nCaptured from the live Bordful Jobs page and CodeMatch at the same Chromium viewport sizes on ${report.generatedAt}. Source code and computed browser styles were inspected; the rows below list the measured box, font (size / weight / line-height / letter-spacing), padding, gap, and radius. A null / omitted component means that it is intentionally hidden at that viewport (for example, the desktop detail placeholder on phones).\n\n| Viewport | Component | Bordful computed styles | CodeMatch computed styles |\n|---|---|---|---|\n${rows.join('\n')}\n\nFull computed values (including border, shadow, text and background colors) are preserved in [ui-1-2-computed-styles.json](ui-1-2-computed-styles.json).\n`
await writeFile(join(dir, 'computed-styles-comparison.md'), markdown)
console.log(`Saved computed styles for ${viewports.length} viewports to docs/ui-refactor/ui-1/ui-1-2-computed-styles.json`)
