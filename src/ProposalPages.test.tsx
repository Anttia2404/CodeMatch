import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { api } from './lib/api'
import type { DeveloperCv, LearningRequest, Proposal } from './lib/api'
import { EditProposalPage, ProposalApplyPage, ReceivedProposalsPage } from './ProposalPages'

const request: LearningRequest = {
  id: 'request-m3', title: 'Học cách xây API với Spring', description: 'Tôi muốn hoàn thiện một ứng dụng nhỏ để thực hành cách thiết kế API và lưu dữ liệu.',
  learningGoal: 'Tự xây API có thể kiểm thử và triển khai.', currentLevel: 'BASIC', preferredFormat: 'ONLINE', city: null,
  budgetMin: null, budgetMax: null, budgetUnit: null, currency: 'VND', preferredSchedule: 'Buổi tối', expectedDuration: '4 tuần',
  teachingExpectations: 'Hướng dẫn từng bước qua ví dụ thực tế.', requiresCv: true, status: 'OPEN', skills: [], createdAt: '', updatedAt: '', publishedAt: '', closedAt: null,
}
const cv: DeveloperCv = { id: 'cv-1', fileName: 'resume.pdf', sizeBytes: 1024, uploadedAt: '', updatedAt: '' }
const proposal: Proposal = {
  id: 'proposal-1', learningRequestId: request.id, learningRequestTitle: request.title, learningRequestStatus: 'OPEN',
  developer: { profileId: 'profile-1', displayName: 'Mai Developer', headline: 'Java mentor', biography: 'Hướng dẫn qua dự án thực tế.', yearsExperience: 5, skills: [] },
  introduction: 'Tôi có thể giúp bạn hoàn thiện mục tiêu bằng lộ trình thực hành phù hợp.',
  teachingApproach: 'Chia nhỏ từng phần, cùng viết mã và kiểm tra kết quả sau mỗi bước.',
  relevantExperience: 'Tôi đã hướng dẫn nhiều dự án nhỏ dùng Spring và PostgreSQL.', proposedRate: 250000, rateUnit: 'PER_SESSION', currency: 'VND',
  proposedSchedule: 'Tối thứ Ba', estimatedDuration: '4 buổi', hasCv: true, status: 'SUBMITTED', createdAt: '', updatedAt: '', withdrawnAt: null,
}

function renderRoute(path: string, element: ReactNode, destination = <p>Gửi đề xuất thành công</p>) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } })
  const routePath = path.includes('/proposals/new') ? '/learning-requests/:id/proposals/new'
    : path.includes('/proposals/') && path.includes('/edit') ? '/my/proposals/:id/edit'
      : path.includes('/learning-requests/') ? '/my/learning-requests/:id/proposals' : path.split('?')[0]
  return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[path]}><Routes><Route path={routePath} element={element} /><Route path="/my/proposals" element={destination} /></Routes></MemoryRouter></QueryClientProvider>)
}

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

describe('M3 proposal pages', () => {
  it('requires and submits a selected CV for a CV-required request', async () => {
    vi.spyOn(api, 'learningRequest').mockResolvedValue(request)
    vi.spyOn(api, 'myCvs').mockResolvedValue([cv])
    const submit = vi.spyOn(api, 'submitProposal').mockResolvedValue(proposal)
    renderRoute(`/learning-requests/${request.id}/proposals/new`, <ProposalApplyPage />)

    expect(await screen.findByText(/cần CV PDF/)).toBeInTheDocument()
    const send = screen.getByRole('button', { name: 'Gửi đề xuất' })
    expect(send).toBeDisabled()
    fireEvent.click(screen.getByRole('radio', { name: /resume.pdf/ }))
    expect(send).toBeEnabled()
    fireEvent.change(screen.getByLabelText('Lời giới thiệu'), { target: { value: proposal.introduction } })
    fireEvent.change(screen.getByLabelText('Phương pháp hướng dẫn'), { target: { value: proposal.teachingApproach } })
    fireEvent.change(screen.getByLabelText('Kinh nghiệm liên quan'), { target: { value: proposal.relevantExperience } })
    fireEvent.change(screen.getByLabelText('Lịch bạn có thể hướng dẫn'), { target: { value: proposal.proposedSchedule } })
    fireEvent.change(screen.getByLabelText('Thời lượng dự kiến'), { target: { value: proposal.estimatedDuration } })
    fireEvent.submit(send.closest('form')!)

    await waitFor(() => expect(submit).toHaveBeenCalledWith(request.id, expect.objectContaining({ cvId: cv.id, rateUnit: 'PER_SESSION' })))
    expect(await screen.findByText('Gửi đề xuất thành công')).toBeInTheDocument()
  })

  it('shows an applicant comparison without a selection action and downloads through proposal scope', async () => {
    vi.spyOn(api, 'receivedProposals').mockResolvedValue([proposal])
    vi.spyOn(api, 'downloadProposalCv').mockResolvedValue(new Blob(['%PDF-']))
    vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:cv'), revokeObjectURL: vi.fn() })
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    renderRoute(`/my/learning-requests/${request.id}/proposals`, <ReceivedProposalsPage />)

    expect(await screen.findByRole('heading', { name: 'Mai Developer' })).toBeInTheDocument()
    expect(screen.getByText('250.000 ₫ / mỗi buổi')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /chấp nhận|chọn developer/i })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Tải CV riêng tư' }))
    await waitFor(() => expect(api.downloadProposalCv).toHaveBeenCalledWith(proposal.id))
  })

  it('renders proposal edit fields from the developer-owned proposal', async () => {
    vi.spyOn(api, 'myProposals').mockResolvedValue([proposal])
    vi.spyOn(api, 'myCvs').mockResolvedValue([cv])
    renderRoute(`/my/proposals/${proposal.id}/edit`, <EditProposalPage />)
    expect(await screen.findByDisplayValue(proposal.introduction)).toBeInTheDocument()
    expect(screen.getByDisplayValue('250000')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Lưu thay đổi' })).toBeInTheDocument()
  })
})
