import { expect, test, type Page } from '@playwright/test'

test.skip(!process.env.CODEMATCH_REAL_E2E, 'Enable with CODEMATCH_REAL_E2E=1 and the isolated E2E Compose stack.')

test('real browser completes request, CV proposal, match and denied access against PostgreSQL', async ({ browser }) => {
  test.setTimeout(120_000)
  const learnerContext = await browser.newContext({ baseURL: 'http://127.0.0.1:5173' })
  const learnerPage = await learnerContext.newPage()
  const password = 'M5-Integration-Password-83!'
  const learnerEmail = `m5-learner-${crypto.randomUUID()}@example.test`
  const requestTitle = `M5 học React với backend thật ${crypto.randomUUID().slice(0, 8)}`

  await register(learnerPage, learnerEmail, 'M5 Learner', password)
  await expect(learnerPage.getByText(learnerEmail)).toBeVisible()
  await learnerPage.goto('/learning-requests/new')
  await learnerPage.getByLabel('Tiêu đề yêu cầu').fill(requestTitle)
  await learnerPage.getByLabel('Mô tả ngắn').fill('Tôi muốn luyện tập React thông qua một ứng dụng nhỏ có dữ liệu thật.')
  await learnerPage.getByLabel('Mục tiêu học tập').fill('Tự xây trang React có thể dùng API thật.')
  await learnerPage.getByLabel('Lịch học mong muốn').fill('Buổi tối trong tuần')
  await learnerPage.getByLabel('Thời lượng dự kiến').fill('Bốn tuần')
  await learnerPage.getByLabel('Cách hướng dẫn phù hợp').fill('Giải thích và thực hành theo từng bước.')
  await learnerPage.getByLabel('React', { exact: true }).check()
  await learnerPage.getByRole('button', { name: 'Đăng yêu cầu' }).click()
  await expect(learnerPage).toHaveURL(/\/learning-requests\/[0-9a-f-]+$/)
  await expect(learnerPage.getByRole('heading', { name: requestTitle })).toBeVisible()
  const requestId = new URL(learnerPage.url()).pathname.split('/').at(-1)!
  await learnerPage.goto('/')
  await learnerPage.getByRole('link', { name: requestTitle, exact: true }).click()
  await expect(learnerPage.getByRole('heading', { name: requestTitle })).toBeVisible()

  const developerContext = await browser.newContext({ baseURL: 'http://127.0.0.1:5173' })
  const developerPage = await developerContext.newPage()
  await register(developerPage, `m5-developer-${crypto.randomUUID()}@example.test`, 'M5 Developer', password)
  await developerPage.goto('/developer-profile')
  await developerPage.getByLabel('Tiêu đề').fill('Mentor React cho dự án thực tế')
  await developerPage.getByLabel('Giới thiệu').fill('Tôi hướng dẫn xây ứng dụng React theo từng bước, chú trọng khả năng tự làm.')
  await developerPage.getByLabel('Số năm kinh nghiệm').fill('5')
  await developerPage.getByLabel('Cách bạn hướng dẫn').fill('Thực hành qua ví dụ nhỏ và phản hồi thường xuyên.')
  await developerPage.getByLabel('Thời gian sẵn sàng').fill('Buổi tối trong tuần')
  await developerPage.getByLabel('React', { exact: true }).check()
  await developerPage.getByRole('button', { name: 'Lưu hồ sơ' }).click()
  await expect(developerPage).toHaveURL(/\/developers\/[0-9a-f-]+$/)

  await developerPage.goto(`/learning-requests/${requestId}/proposals/new`)
  await developerPage.getByLabel('Lời giới thiệu').fill('Tôi sẽ đồng hành để bạn hoàn thiện ứng dụng React theo mục tiêu đã nêu.')
  await developerPage.getByLabel('Phương pháp hướng dẫn').fill('Chia nhỏ bài học, cùng xây giao diện và kết nối API thật.')
  await developerPage.getByLabel('Kinh nghiệm liên quan').fill('Tôi đã phát triển và hướng dẫn nhiều ứng dụng React thực tế.')
  await developerPage.getByLabel('Lịch bạn có thể hướng dẫn').fill('Tối thứ Ba và thứ Năm')
  await developerPage.getByLabel('Thời lượng dự kiến').fill('Bốn buổi trong một tháng')
  await developerPage.getByLabel(/Tải CV PDF lên/).setInputFiles({ name: 'synthetic-cv.pdf', mimeType: 'application/pdf', buffer: syntheticPdf() })
  await expect(developerPage.getByText(/CV được chọn:/)).toBeVisible()
  await developerPage.getByRole('button', { name: 'Gửi đề xuất' }).click()
  await expect(developerPage).toHaveURL(/\/my\/proposals\?notice=submitted$/)

  await learnerPage.goto(`/my/learning-requests/${requestId}/proposals`)
  await expect(learnerPage.getByRole('heading', { name: 'M5 Developer' })).toBeVisible()
  await learnerPage.getByRole('button', { name: 'Tải CV riêng tư' }).click()
  await learnerPage.getByRole('button', { name: 'Chọn developer này' }).click()
  const dialog = learnerPage.getByRole('dialog', { name: 'Xác nhận lựa chọn' })
  await dialog.getByRole('button', { name: 'Xác nhận lựa chọn' }).click()
  await expect(learnerPage.getByText('Đã xác nhận lựa chọn.')).toBeVisible()

  await developerPage.goto('/my/matches')
  await expect(developerPage.getByRole('heading', { name: requestTitle })).toBeVisible()

  const unrelatedContext = await browser.newContext({ baseURL: 'http://127.0.0.1:5173' })
  const unrelatedPage = await unrelatedContext.newPage()
  await register(unrelatedPage, `m5-unrelated-${crypto.randomUUID()}@example.test`, 'M5 Unrelated', password)
  const denied = await unrelatedPage.request.get(`http://127.0.0.1:18080/api/v1/me/learning-requests/${requestId}/proposals`)
  expect(denied.status()).toBe(404)

  const apiHealth = await learnerPage.request.get('http://127.0.0.1:18080/actuator/health')
  expect(apiHealth.ok()).toBeTruthy()
  await expect(apiHealth.json()).resolves.toMatchObject({ status: 'UP' })
  await Promise.all([learnerContext.close(), developerContext.close(), unrelatedContext.close()])
})

async function register(page: Page, email: string, displayName: string, password: string) {
  await page.goto('/register')
  await page.getByLabel('Tên hiển thị').fill(displayName)
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Mật khẩu', { exact: true }).fill(password)
  await page.getByLabel('Xác nhận mật khẩu').fill(password)
  await page.getByRole('button', { name: 'Tạo tài khoản' }).click()
  await expect(page).toHaveURL(/\/account$/)
}

function syntheticPdf() {
  const stream = 'BT /F1 18 Tf 72 720 Td (Synthetic CodeMatch test CV) Tj ET'
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ]
  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  for (const [index, object] of objects.entries()) {
    offsets.push(Buffer.byteLength(pdf, 'ascii'))
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  }
  const xref = Buffer.byteLength(pdf, 'ascii')
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (const offset of offsets.slice(1)) pdf += `${String(offset).padStart(10, '0')} 00000 n \n`
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  return Buffer.from(pdf, 'ascii')
}
