import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, api } from './lib/api'
import type { ConfirmedMatch, DeveloperCv, LearningRequest, Proposal, ProposalSelection } from './lib/api'
import { EditProposalPage, MyProposalsPage, ProposalApplyPage, ReceivedProposalsPage } from './ProposalPages'
import { DeveloperMatchesPage, LearnerMatchPage } from './MatchPages'

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
    : path.includes('/learning-requests/') && path.includes('/match') ? '/my/learning-requests/:id/match'
    : path.includes('/proposals/') && path.includes('/edit') ? '/my/proposals/:id/edit'
      : path.includes('/learning-requests/') ? '/my/learning-requests/:id/proposals' : path.split('?')[0]
  return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[path]}><Routes><Route path={routePath} element={element} /><Route path="/my/proposals" element={destination} /><Route path="/my/matches" element={destination} /><Route path="/my/learning-requests/:id/match" element={destination} /></Routes></MemoryRouter></QueryClientProvider>)
}

const match: ConfirmedMatch = {
  id: 'match-1', learningRequestId: request.id, learningRequestTitle: request.title, learnerDisplayName: 'Linh Learner',
  selectedProposalId: proposal.id, developer: proposal.developer, proposal, status: 'CONFIRMED', createdAt: '', updatedAt: '',
}
const pending: ProposalSelection = { learningRequestId: request.id, requestStatus: 'OPEN', proposalStatus: 'SUBMITTED', selectionStatus: 'PENDING' }

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

  it('shows an applicant comparison, selection action, and scoped CV download', async () => {
    vi.spyOn(api, 'receivedProposals').mockResolvedValue([proposal])
    vi.spyOn(api, 'proposalSelectionStatus').mockResolvedValue(pending)
    vi.spyOn(api, 'downloadProposalCv').mockResolvedValue(new Blob(['%PDF-']))
    vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:cv'), revokeObjectURL: vi.fn() })
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    renderRoute(`/my/learning-requests/${request.id}/proposals`, <ReceivedProposalsPage />)

    expect(await screen.findByRole('heading', { name: 'Mai Developer' })).toBeInTheDocument()
    expect(screen.getByText('250.000 ₫ / mỗi buổi')).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: 'Chọn developer này' })).toBeInTheDocument()
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

  it('asks for confirmation and only shows success after the server confirms selection', async () => {
    vi.spyOn(api, 'receivedProposals').mockResolvedValue([proposal])
    vi.spyOn(api, 'proposalSelectionStatus').mockResolvedValue(pending)
    const select = vi.spyOn(api, 'selectProposal').mockResolvedValue(match)
    renderRoute(`/my/learning-requests/${request.id}/proposals`, <ReceivedProposalsPage />)

    fireEvent.click(await screen.findByRole('button', { name: 'Chọn developer này' }))
    expect(await screen.findByRole('dialog', { name: 'Xác nhận lựa chọn' })).toBeInTheDocument()
    expect(screen.queryByText('Đã xác nhận lựa chọn.')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận lựa chọn' }))
    await waitFor(() => expect(select).toHaveBeenCalledWith(request.id, proposal.id))
    expect(await screen.findByText('Đã xác nhận lựa chọn.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Xem thông tin developer đã chọn/ })).toHaveAttribute('href', `/my/learning-requests/${request.id}/match`)
  })

  it('shows a server conflict without claiming a successful match', async () => {
    vi.spyOn(api, 'receivedProposals').mockResolvedValue([proposal])
    vi.spyOn(api, 'proposalSelectionStatus').mockResolvedValue(pending)
    vi.spyOn(api, 'selectProposal').mockRejectedValue(new ApiError(409, 'request_already_matched', 'Yêu cầu này đã có developer được chọn.'))
    renderRoute(`/my/learning-requests/${request.id}/proposals`, <ReceivedProposalsPage />)

    fireEvent.click(await screen.findByRole('button', { name: 'Chọn developer này' }))
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận lựa chọn' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Yêu cầu này đã có developer được chọn.')
    expect(screen.queryByText('Đã xác nhận lựa chọn.')).not.toBeInTheDocument()
  })

  it('prevents a duplicate confirm while selection is pending', async () => {
    vi.spyOn(api, 'receivedProposals').mockResolvedValue([proposal])
    vi.spyOn(api, 'proposalSelectionStatus').mockResolvedValue(pending)
    vi.spyOn(api, 'selectProposal').mockImplementation(() => new Promise(() => {}))
    renderRoute(`/my/learning-requests/${request.id}/proposals`, <ReceivedProposalsPage />)

    fireEvent.click(await screen.findByRole('button', { name: 'Chọn developer này' }))
    const confirm = screen.getByRole('button', { name: 'Xác nhận lựa chọn' })
    fireEvent.click(confirm)
    await waitFor(() => expect(confirm).toBeDisabled())
  })

  it('shows selected status to a developer and removes proposal edit controls after match', async () => {
    vi.spyOn(api, 'myProposals').mockResolvedValue([{ ...proposal, learningRequestStatus: 'MATCHED' }])
    vi.spyOn(api, 'myCvs').mockResolvedValue([cv])
    vi.spyOn(api, 'proposalSelectionStatus').mockResolvedValue({ ...pending, requestStatus: 'MATCHED', selectionStatus: 'SELECTED' })
    renderRoute('/my/proposals', <MyProposalsPage />)
    expect(await screen.findByText('Người học đã chọn đề xuất này')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Chỉnh sửa' })).not.toBeInTheDocument()
  })

  it('renders the private match view for the selected developer', async () => {
    vi.spyOn(api, 'developerMatches').mockResolvedValue([match])
    renderRoute('/my/matches', <DeveloperMatchesPage />)
    expect(await screen.findByRole('heading', { name: request.title })).toBeInTheDocument()
    expect(screen.getByText(/Người học:/)).toHaveTextContent('Linh Learner')
  })

  it('renders the learner match view from the confirmed API response', async () => {
    vi.spyOn(api, 'learnerMatch').mockResolvedValue(match)
    renderRoute(`/my/learning-requests/${request.id}/match`, <LearnerMatchPage />)
    expect(await screen.findByRole('heading', { name: 'Developer đã chọn' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: request.title })).toBeInTheDocument()
    expect(screen.getByText('Mai Developer')).toBeInTheDocument()
  })
})
