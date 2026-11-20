import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import { ApiError, api } from './lib/api'
import type { LearningRequest, PageResult } from './lib/api'

const request: LearningRequest = {
  id: 'request-1', title: 'Mình muốn học React hooks', description: 'Mình muốn tự xây một project nhỏ để hiểu state và effect.',
  learningGoal: 'Tự hoàn thiện một ứng dụng React.', currentLevel: 'BASIC', preferredFormat: 'ONLINE', city: null,
  budgetMin: 200000, budgetMax: 350000, budgetUnit: 'PER_SESSION', currency: 'VND', preferredSchedule: 'Cuối tuần',
  expectedDuration: '4 buổi', teachingExpectations: 'Giải thích từng bước và thực hành.', requiresCv: false, status: 'OPEN',
  skills: [{ id: 'skill-react', slug: 'react', name: 'React' }], createdAt: '', updatedAt: '', publishedAt: '2026-11-17T00:00:00Z', closedAt: null,
}
const page: PageResult<LearningRequest> = { content: [request], page: 0, size: 12, totalElements: 1, totalPages: 1 }

function renderApp() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(<QueryClientProvider client={queryClient}><App /></QueryClientProvider>)
}

afterEach(() => vi.restoreAllMocks())

describe('CodeMatch request discovery', () => {
  it('loads open learning requests from the API and filters using the backend search', async () => {
    const current = vi.spyOn(api, 'current').mockRejectedValue(new ApiError(401, 'unauthorized', 'Đăng nhập để tiếp tục.'))
    vi.spyOn(api, 'discoverRequests').mockResolvedValue(page)
    vi.spyOn(api, 'skills').mockResolvedValue([{ id: 'skill-react', slug: 'react', name: 'React' }])
    renderApp()
    expect(screen.getByRole('heading', { name: /Học lập trình/ })).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: 'Mình muốn học React hooks' })).toBeInTheDocument()
    fireEvent.change(screen.getByRole('textbox', { name: 'Tìm yêu cầu học' }), { target: { value: 'Spring' } })
    await waitFor(() => expect(api.discoverRequests).toHaveBeenLastCalledWith(expect.objectContaining({ q: 'Spring' })), { timeout: 1200 })
    expect(current).toHaveBeenCalled()
  })

  it('replaces the old local fixture flow with the database-backed empty state', async () => {
    vi.spyOn(api, 'current').mockRejectedValue(new ApiError(401, 'unauthorized', 'Đăng nhập để tiếp tục.'))
    vi.spyOn(api, 'discoverRequests').mockResolvedValue({ ...page, content: [], totalElements: 0, totalPages: 0 })
    vi.spyOn(api, 'skills').mockResolvedValue([])
    renderApp()
    expect(await screen.findByText('Chưa có yêu cầu phù hợp')).toBeInTheDocument()
    expect(screen.queryByText('Mình muốn hiểu React hooks qua một project nhỏ')).not.toBeInTheDocument()
  })

  it('shows learner navigation after account verification', async () => {
    vi.spyOn(api, 'current').mockResolvedValue({ id: 'user-1', email: 'person@example.test', displayName: 'Linh', status: 'ACTIVE', createdAt: '', updatedAt: '' })
    vi.spyOn(api, 'discoverRequests').mockResolvedValue(page)
    vi.spyOn(api, 'skills').mockResolvedValue([])
    renderApp()
    expect(await screen.findAllByRole('link', { name: 'Yêu cầu của tôi' })).toHaveLength(2)
    expect(screen.getByRole('link', { name: 'Đăng yêu cầu' })).toHaveAttribute('href', '/learning-requests/new')
  })
})
