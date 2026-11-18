import { expect, test } from '@playwright/test'

const requestId = 'request-e2e'
const proposalId = 'proposal-e2e'
const developer = { profileId: 'profile-e2e', displayName: 'Mai Developer', headline: 'Java mentor', biography: 'Hướng dẫn qua dự án thực tế.', yearsExperience: 5, skills: [] }
const proposal = {
  id: proposalId, learningRequestId: requestId, learningRequestTitle: 'Học cách xây API với Spring', learningRequestStatus: 'OPEN',
  developer, introduction: 'Tôi có thể giúp bạn hoàn thiện mục tiêu bằng lộ trình thực hành phù hợp.',
  teachingApproach: 'Chia nhỏ từng phần và thực hành qua dự án.', relevantExperience: 'Tôi đã hướng dẫn nhiều dự án nhỏ.',
  proposedRate: 250000, rateUnit: 'PER_SESSION', currency: 'VND', proposedSchedule: 'Tối thứ Ba',
  estimatedDuration: '4 buổi', hasCv: false, status: 'SUBMITTED', createdAt: '', updatedAt: '', withdrawnAt: null,
}
const confirmedMatch = {
  id: 'match-e2e', learningRequestId: requestId, learningRequestTitle: proposal.learningRequestTitle,
  learnerDisplayName: 'Linh Learner', selectedProposalId: proposalId, developer, proposal, status: 'CONFIRMED', createdAt: '', updatedAt: '',
}

test.beforeEach(async ({ page }) => {
  let requestStatus = 'OPEN'
  let selectionStatus = 'PENDING'
  let rejectSelection = false
  await page.addInitScript(() => { document.cookie = 'XSRF-TOKEN=e2e-csrf; path=/' })
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const path = url.pathname.replace('/api/v1', '')
    const cors = {
      'Access-Control-Allow-Origin': 'http://127.0.0.1:5173',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Headers': 'content-type,x-xsrf-token',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    }
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors })
    if (path === '/auth/csrf') return route.fulfill({ status: 204, headers: cors })
    if (path === '/auth/me') return route.fulfill({ status: 200, headers: cors, contentType: 'application/json', body: JSON.stringify({ id: 'learner-e2e', email: 'linh@example.test', displayName: 'Linh Learner', status: 'ACTIVE', createdAt: '', updatedAt: '' }) })
    if (path === `/me/learning-requests/${requestId}/proposals`) {
      return route.fulfill({ status: 200, headers: cors, contentType: 'application/json', body: JSON.stringify([{ ...proposal, learningRequestStatus: requestStatus }]) })
    }
    if (path === `/proposals/${proposalId}/selection-status`) {
      return route.fulfill({ status: 200, headers: cors, contentType: 'application/json', body: JSON.stringify({ learningRequestId: requestId, requestStatus, proposalStatus: 'SUBMITTED', selectionStatus }) })
    }
    if (path === `/me/learning-requests/${requestId}/match` && request.method() === 'POST') {
      if (rejectSelection) return route.fulfill({ status: 409, headers: cors, contentType: 'application/problem+json', body: JSON.stringify({ code: 'request_already_matched', detail: 'Yêu cầu này đã có developer được chọn.' }) })
      const body = request.postDataJSON() as { proposalId: string }
      expect(body.proposalId).toBe(proposalId)
      requestStatus = 'MATCHED'
      selectionStatus = 'SELECTED'
      return route.fulfill({ status: 200, headers: cors, contentType: 'application/json', body: JSON.stringify(confirmedMatch) })
    }
    if (path === `/me/learning-requests/${requestId}/match`) return route.fulfill({ status: 200, headers: cors, contentType: 'application/json', body: JSON.stringify(confirmedMatch) })
    if (path === '/me/matches') return route.fulfill({ status: 200, headers: cors, contentType: 'application/json', body: JSON.stringify([confirmedMatch]) })
    if (path === '/me/matches/match-e2e') return route.fulfill({ status: 200, headers: cors, contentType: 'application/json', body: JSON.stringify(confirmedMatch) })
    if (path === '/_test/reject-selection') { rejectSelection = true; return route.fulfill({ status: 204, headers: cors }) }
    return route.fulfill({ status: 404, headers: cors, contentType: 'application/problem+json', body: JSON.stringify({ code: 'not_found', detail: 'Not found' }) })
  })
})

test('learner reviews a proposal, confirms selection, and sees server-confirmed match', async ({ page }) => {
  await page.goto(`/my/learning-requests/${requestId}/proposals`)
  await expect(page.getByRole('heading', { name: developer.displayName })).toBeVisible()
  await page.getByRole('button', { name: 'Chọn developer này' }).click()
  const dialog = page.getByRole('dialog', { name: 'Xác nhận lựa chọn' })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Xác nhận lựa chọn' }).click()
  await expect(page.getByText('Đã xác nhận lựa chọn.')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Xem thông tin developer đã chọn' })).toHaveAttribute('href', `/my/learning-requests/${requestId}/match`)
})

test('learner sees a conflict without a false success state', async ({ page }) => {
  await page.route('**/api/v1/auth/csrf', (route) => route.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': 'http://127.0.0.1:5173', 'Access-Control-Allow-Credentials': 'true' } }))
  await page.route(`**/api/v1/me/learning-requests/${requestId}/match`, async (route) => {
    if (route.request().method() === 'POST') return route.fulfill({ status: 409, headers: { 'Access-Control-Allow-Origin': 'http://127.0.0.1:5173', 'Access-Control-Allow-Credentials': 'true' }, contentType: 'application/problem+json', body: JSON.stringify({ code: 'request_already_matched', detail: 'Yêu cầu này đã có developer được chọn.' }) })
    return route.continue()
  })
  await page.goto(`/my/learning-requests/${requestId}/proposals`)
  await page.getByRole('button', { name: 'Chọn developer này' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Xác nhận lựa chọn' }).click()
  await expect(page.getByRole('alert')).toContainText('Yêu cầu này đã có developer được chọn.')
  await expect(page.getByText('Đã xác nhận lựa chọn.')).toHaveCount(0)
})

test('selected developer can view the confirmed match', async ({ page }) => {
  await page.goto('/my/matches')
  await expect(page.getByRole('heading', { name: proposal.learningRequestTitle })).toBeVisible()
  await expect(page.getByText('Người học:')).toBeVisible()
  await expect(page.getByText('Linh Learner')).toBeVisible()
})

test('learner can open match details after confirmation', async ({ page }) => {
  await page.goto(`/my/learning-requests/${requestId}/match`)
  await expect(page.getByRole('heading', { name: 'Developer đã chọn' })).toBeVisible()
  await expect(page.getByRole('heading', { name: proposal.learningRequestTitle })).toBeVisible()
  await expect(page.getByRole('heading', { name: developer.displayName })).toBeVisible()
})
