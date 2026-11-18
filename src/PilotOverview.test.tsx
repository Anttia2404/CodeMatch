import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { api, type PilotOverview } from './lib/api'
import { AdminPilotOverviewPage } from './PilotOverview'

const overview: PilotOverview = {
  totalRegisteredUsers: 12, activeDevelopers: 4, openLearningRequests: 6,
  submittedProposals: 9, confirmedMatches: 2, pendingModerationReports: 1,
  publishedLearningRequests: 8, requestsWithAtLeastOneProposal: 5, matchedLearningRequests: 2,
  requestProposalCoveragePercent: 62.5, requestMatchConversionPercent: 25,
  averageMinutesToFirstProposal: 75, averageMinutesToConfirmedMatch: 240,
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={client}><MemoryRouter><AdminPilotOverviewPage /></MemoryRouter></QueryClientProvider>)
}

describe('admin pilot overview', () => {
  it('shows aggregate funnel data returned by the API', async () => {
    vi.spyOn(api, 'adminPilotOverview').mockResolvedValue(overview)
    renderPage()

    expect(await screen.findByRole('heading', { name: 'Tổng quan hoạt động' })).toBeInTheDocument()
    expect(await screen.findByText('12')).toBeInTheDocument()
    expect(await screen.findByText('62,5%')).toBeInTheDocument()
    expect(await screen.findByText('75 phút')).toBeInTheDocument()
  })

  it('shows an empty state without inventing pilot activity', async () => {
    vi.spyOn(api, 'adminPilotOverview').mockResolvedValue({ ...overview, totalRegisteredUsers: 0 })
    renderPage()
    expect(await screen.findByText('Chưa có dữ liệu trong môi trường này.')).toBeInTheDocument()
  })
})
