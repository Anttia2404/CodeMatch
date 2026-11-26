import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { ApiError, api } from './lib/api'
import type { LearningRequest, PageResult } from './lib/api'

const request: LearningRequest = {
  id: 'request-live-preview', title: 'Luyện React qua một ứng dụng nhỏ', description: 'Thực hành giao diện và state.',
  learningGoal: 'Tự hoàn thiện giao diện có dữ liệu thật.', currentLevel: 'BASIC', preferredFormat: 'ONLINE', city: null,
  budgetMin: 200_000, budgetMax: 350_000, budgetUnit: 'PER_SESSION', currency: 'VND', preferredSchedule: 'Buổi tối',
  expectedDuration: 'Bốn buổi', teachingExpectations: 'Hướng dẫn từng bước.', requiresCv: false, status: 'OPEN',
  skills: [{ id: 'skill-react', slug: 'react', name: 'React' }], createdAt: '', updatedAt: '', publishedAt: null, closedAt: null,
}
const page: PageResult<LearningRequest> = { content: [request], page: 0, size: 3, totalElements: 1, totalPages: 1 }

function renderPreview() {
  window.history.pushState({}, '', '/__preview/landing')
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(<QueryClientProvider client={queryClient}><App /></QueryClientProvider>)
}

afterEach(() => { cleanup(); vi.restoreAllMocks(); window.history.pushState({}, '', '/') })

describe('Landing Page development preview', () => {
  it('shows approved copy, directs both audiences to existing workflows, and displays API requests', async () => {
    vi.spyOn(api, 'current').mockRejectedValue(new ApiError(401, 'unauthorized', 'Đăng nhập để tiếp tục.'))
    vi.spyOn(api, 'discoverRequests').mockResolvedValue(page)
    renderPreview()
    expect(screen.getByRole('heading', { level: 1, name: 'Học lập trình cùng developer phù hợp với bạn.' })).toBeInTheDocument()
    expect(screen.getByText('Đăng mục tiêu học tập, nhận đề xuất từ developer và lựa chọn người hướng dẫn phù hợp với nhu cầu của bạn.')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Minh họa quy trình từ Learning Request đến Proposal và lựa chọn' })).toBeInTheDocument()
    expect(document.querySelector('.landing-hero-actions a[href="/learning-requests/new"]')).toHaveTextContent('Đăng yêu cầu học')
    expect(document.querySelector('.landing-hero-actions a[href="/"]')).toHaveTextContent('Tìm yêu cầu để hướng dẫn')
    expect(await screen.findByRole('link', { name: request.title })).toHaveAttribute('href', `/learning-requests/${request.id}`)
    expect(api.discoverRequests).toHaveBeenCalledWith({ page: 0, size: 3, sort: 'NEWEST' })
  })

  it('shows a truthful empty state when the public API returns no requests', async () => {
    vi.spyOn(api, 'current').mockRejectedValue(new ApiError(401, 'unauthorized', 'Đăng nhập để tiếp tục.'))
    vi.spyOn(api, 'discoverRequests').mockResolvedValue({ ...page, content: [], totalElements: 0, totalPages: 0 })
    renderPreview()
    expect(await screen.findByText('Chưa có yêu cầu học đang mở')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: request.title })).not.toBeInTheDocument()
  })

  it('shows a recoverable error state without substituting sample marketplace content', async () => {
    vi.spyOn(api, 'current').mockRejectedValue(new ApiError(401, 'unauthorized', 'Đăng nhập để tiếp tục.'))
    vi.spyOn(api, 'discoverRequests').mockRejectedValue(new ApiError(503, 'unavailable', 'Dịch vụ tạm thời không khả dụng.'))
    renderPreview()
    expect(await screen.findByRole('alert')).toHaveTextContent('Chưa tải được yêu cầu học')
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeInTheDocument()
    expect(screen.queryByText(/Minh họa synthetic/i)).not.toBeInTheDocument()
  })
})
