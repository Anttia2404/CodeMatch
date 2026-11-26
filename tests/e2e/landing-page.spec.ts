import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const publicRequestsUrl = '**/api/v1/learning-requests*'
const emptyPage = { content: [], page: 0, size: 3, totalElements: 0, totalPages: 0 }

async function useAnonymousAccount(page: import('@playwright/test').Page) {
  await page.route('**/api/v1/auth/me', (route) => route.fulfill({ status: 401, contentType: 'application/problem+json', body: JSON.stringify({ code: 'unauthorized', detail: 'Đăng nhập để tiếp tục.' }) }))
}

test.describe('Landing Page development preview', () => {
  test('renders a keyboard-accessible landing page without axe violations', async ({ page }) => {
    await useAnonymousAccount(page)
    await page.route(publicRequestsUrl, (route) => route.fulfill({ status: 200, json: emptyPage }))
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/__preview/landing', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 1, name: 'Học lập trình cùng developer phù hợp với bạn.' })).toBeVisible()
    await expect(page.getByText('Chưa có yêu cầu học đang mở')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Đăng yêu cầu học' }).first()).toHaveAttribute('href', '/learning-requests/new')
    await expect(page.getByRole('link', { name: 'Tìm yêu cầu để hướng dẫn' }).first()).toHaveAttribute('href', '/')

    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: 'Bỏ qua điều hướng' })).toBeFocused()
    const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
    expect(accessibility.violations.map(({ id, impact, description, nodes }) => ({ id, impact, description, nodes: nodes.map((node) => node.html) }))).toEqual([])
  })

  test('shows loading, API error, and retry states without sample listings', async ({ page }) => {
    await useAnonymousAccount(page)
    let calls = 0
    await page.route(publicRequestsUrl, async (route) => {
      calls += 1
      if (calls === 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
      return route.fulfill({ status: 503, contentType: 'application/problem+json', body: JSON.stringify({ code: 'unavailable', detail: 'Thử lại sau.' }) })
    })
    await page.goto('/__preview/landing', { waitUntil: 'commit' })
    await expect(page.locator('.landing-request-preview')).toHaveAttribute('aria-busy', 'true')
    await expect(page.locator('.landing-skeleton-line')).toHaveCount(3)
    await expect(page.getByRole('alert')).toContainText('Chưa tải được yêu cầu học')
    await page.getByRole('button', { name: 'Thử lại' }).click()
    await expect(page.getByRole('alert')).toContainText('Chưa tải được yêu cầu học')
    expect(calls).toBe(2)
    await expect(page.getByText(/Minh họa synthetic/i)).toHaveCount(0)
  })

  test('keeps marketplace discovery as the developer workflow and requires login to post as an anonymous learner', async ({ page }) => {
    await useAnonymousAccount(page)
    await page.route(publicRequestsUrl, (route) => route.fulfill({ status: 200, json: emptyPage }))
    await page.goto('/__preview/landing')
    await page.getByRole('link', { name: 'Tìm yêu cầu để hướng dẫn' }).first().click()
    await expect(page).toHaveURL(/\/$/)
    await page.goto('/__preview/landing')
    await page.getByRole('link', { name: 'Đăng yêu cầu học' }).first().click()
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('heading', { name: 'Đăng nhập' })).toBeVisible()
  })

  test('mobile menu is keyboard operable and shows the current product routes', async ({ page }) => {
    await useAnonymousAccount(page)
    await page.route(publicRequestsUrl, (route) => route.fulfill({ status: 200, json: emptyPage }))
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/__preview/landing')
    const menuButton = page.getByRole('button', { name: 'Mở menu' })
    await menuButton.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('button', { name: 'Đóng menu' })).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByRole('navigation', { name: 'Điều hướng di động' }).getByRole('link', { name: 'Đăng nhập' })).toHaveAttribute('href', '/login')
    await expect(page.getByRole('navigation', { name: 'Điều hướng di động' }).getByRole('link', { name: 'Tham gia CodeMatch' })).toHaveAttribute('href', '/register')
    await page.getByRole('navigation', { name: 'Điều hướng di động' }).getByRole('link', { name: 'Cách hoạt động' }).click()
    await expect(page.getByRole('button', { name: 'Mở menu' })).toHaveAttribute('aria-expanded', 'false')
  })
})
