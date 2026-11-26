import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LearningRequestFormPage, LearnerDashboardPage, RequestDetailPage, RequestDiscovery, SavedRequestsPage } from './LearningRequests'
import { api } from './lib/api'
import type { LearningRequest, PageResult } from './lib/api'

const item: LearningRequest = {
  id: 'request-1', title: 'Cùng học React hooks', description: 'Muốn hiểu state và effect bằng một dự án nhỏ.',
  learningGoal: 'Tự xây ứng dụng quản lý công việc.', currentLevel: 'BASIC', preferredFormat: 'OFFLINE', city: 'Đà Nẵng',
  budgetMin: 200000, budgetMax: 500000, budgetUnit: 'PER_SESSION', currency: 'VND', preferredSchedule: 'Tối cuối tuần',
  expectedDuration: '4 buổi', teachingExpectations: 'Giải thích và thực hành cùng nhau.', requiresCv: true, status: 'OPEN',
  skills: [{ id: 'react-id', slug: 'react', name: 'React' }], createdAt: '', updatedAt: '', publishedAt: '2026-11-17T00:00:00Z', closedAt: null,
}
const page: PageResult<LearningRequest> = { content: [item], page: 0, size: 20, totalElements: 1, totalPages: 1 }

function renderAt(element: ReactNode, path = '/') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[path]}><Routes>
    <Route path="/learning-requests/new" element={element} />
    <Route path="/learning-requests/:id/edit" element={element} />
    <Route path="/learning-requests/:id" element={element} />
    <Route path="/my/learning-requests" element={element} />
    <Route path="/saved-requests" element={element} />
    <Route path="/" element={element} />
  </Routes></MemoryRouter></QueryClientProvider>)
}

afterEach(() => vi.restoreAllMocks())

describe('learning request creation and management', () => {
  it('validates the request form before sending data', async () => {
    const user = userEvent.setup()
    vi.spyOn(api, 'skills').mockResolvedValue([{ id: 'react-id', slug: 'react', name: 'React' }])
    const create = vi.spyOn(api, 'createLearningRequest')
    renderAt(<LearningRequestFormPage />, '/learning-requests/new')
    await user.click(await screen.findByRole('button', { name: 'Đăng yêu cầu' }))
    expect(await screen.findByText('Vui lòng kiểm tra lại các thông tin được đánh dấu.')).toHaveAttribute('role', 'alert')
    expect(create).not.toHaveBeenCalled()
  })

  it('creates a draft and publishes it through the API', async () => {
    const user = userEvent.setup()
    vi.spyOn(api, 'skills').mockResolvedValue([{ id: 'react-id', slug: 'react', name: 'React' }])
    vi.spyOn(api, 'createLearningRequest').mockResolvedValue({ ...item, status: 'DRAFT' })
    const publish = vi.spyOn(api, 'publishLearningRequest').mockResolvedValue(item)
    renderAt(<LearningRequestFormPage />, '/learning-requests/new')
    await user.type(await screen.findByLabelText('Tiêu đề yêu cầu'), 'React hooks cho người mới')
    await user.type(screen.getByLabelText('Mô tả ngắn'), 'Tôi muốn thực hành React trong một ứng dụng nhỏ có state và effect.')
    await user.type(screen.getByLabelText('Mục tiêu học tập'), 'Tự xây ứng dụng quản lý công việc.')
    await user.click(screen.getByLabelText('React'))
    await user.type(screen.getByLabelText('Lịch học mong muốn'), 'Tối cuối tuần')
    await user.type(screen.getByLabelText('Thời lượng dự kiến'), '4 buổi')
    await user.type(screen.getByLabelText('Cách hướng dẫn phù hợp'), 'Giải thích và thực hành từng bước.')
    await user.click(screen.getByRole('button', { name: 'Đăng yêu cầu' }))
    await waitFor(() => expect(publish).toHaveBeenCalledWith('request-1'))
  }, 15000)

  it('renders complete request details without a fake proposal action', async () => {
    vi.spyOn(api, 'learningRequest').mockResolvedValue(item)
    renderAt(<RequestDetailPage authenticated={false} />, '/learning-requests/request-1')
    expect(await screen.findByRole('heading', { name: item.title })).toBeInTheDocument()
    expect(screen.getByText(item.learningGoal)).toBeInTheDocument()
    expect(screen.getByText('Yêu cầu CV')).toBeInTheDocument()
    expect(screen.getByText('Học trực tiếp · Đà Nẵng')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /đề xuất|ứng tuyển/i })).not.toBeInTheDocument()
  })

  it('renders a selected request using the discovery detail panel layout', async () => {
    vi.spyOn(api, 'learningRequest').mockResolvedValue(item)
    renderAt(<RequestDetailPage authenticated={false} panel />, '/learning-requests/request-1')
    expect(await screen.findByRole('heading', { name: item.title })).toBeInTheDocument()
    expect(document.querySelector('.bordful-detail-content')).toBeInTheDocument()
  })

  it('loads discovery filters from the skill catalog and sends selected skills to the API', async () => {
    const user = userEvent.setup()
    vi.spyOn(api, 'skills').mockResolvedValue([{ id: 'react-id', slug: 'react', name: 'React' }])
    const discover = vi.spyOn(api, 'discoverRequests').mockResolvedValue(page)
    renderAt(<RequestDiscovery authenticated={false} />)
    await user.click(await screen.findByLabelText('React'))
    await waitFor(() => expect(discover).toHaveBeenLastCalledWith(expect.objectContaining({ skillIds: ['react-id'] })))
  })

  it('publishes a draft from the learner dashboard', async () => {
    const user = userEvent.setup()
    vi.spyOn(api, 'myLearningRequests').mockResolvedValue({ ...page, content: [{ ...item, status: 'DRAFT' }] })
    const publish = vi.spyOn(api, 'publishLearningRequest').mockResolvedValue(item)
    renderAt(<LearnerDashboardPage />, '/my/learning-requests')
    await user.click(await screen.findByRole('button', { name: 'Đăng yêu cầu' }))
    await waitFor(() => expect(publish).toHaveBeenCalledWith('request-1'))
  })

  it('shows closed saved requests and supports removing a saved item', async () => {
    const user = userEvent.setup()
    vi.spyOn(api, 'savedRequests').mockResolvedValue([{ ...item, status: 'CLOSED' }])
    const unsave = vi.spyOn(api, 'unsaveRequest').mockResolvedValue(undefined)
    renderAt(<SavedRequestsPage />, '/saved-requests')
    expect(await screen.findByText('Yêu cầu này đã đóng; bạn vẫn có thể xem thông tin đã lưu.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Bỏ lưu' }))
    await waitFor(() => expect(unsave).toHaveBeenCalledWith('request-1', expect.anything()))
  })
})
