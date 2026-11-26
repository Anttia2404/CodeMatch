import { Braces, Bookmark, Menu } from 'lucide-react'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api, ApiError } from './lib/api'
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { AccountPage, DeveloperProfileFormPage, LoginPage, PublicDeveloperProfilePage, RegisterPage } from './AuthPages'
import { LearningRequestFormPage, LearnerDashboardPage, RequestDetailPage, RequestDiscovery, SavedRequestsPage } from './LearningRequests'
import { EditProposalPage, MyProposalsPage, ProposalApplyPage, ReceivedProposalsPage } from './ProposalPages'
import { DeveloperMatchesPage, LearnerMatchPage } from './MatchPages'
import { AdminReportsPage } from './ModerationPages'
import { AdminPilotOverviewPage } from './PilotOverview'
import './bordful-board.css'

export default function App() {
  return <BrowserRouter><Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/login" element={<LoginPage />} /><Route path="/register" element={<RegisterPage />} />
    <Route path="/account" element={<AccountPage />} /><Route path="/developer-profile" element={<DeveloperProfileFormPage />} />
    <Route path="/developers/:profileId" element={<PublicDeveloperProfilePage />} />
    <Route path="/learning-requests/new" element={<RequireAccount><LearningRequestFormPage /></RequireAccount>} />
    <Route path="/learning-requests/:id/edit" element={<RequireAccount><LearningRequestFormPage /></RequireAccount>} />
    <Route path="/learning-requests/:id" element={<RequestDetailRoute />} />
    <Route path="/my/learning-requests" element={<RequireAccount><LearnerDashboardPage /></RequireAccount>} />
    <Route path="/saved-requests" element={<RequireAccount><SavedRequestsPage /></RequireAccount>} />
    <Route path="/learning-requests/:id/proposals/new" element={<RequireAccount><ProposalApplyPage /></RequireAccount>} />
    <Route path="/my/proposals" element={<RequireAccount><MyProposalsPage /></RequireAccount>} />
    <Route path="/my/proposals/:id/edit" element={<RequireAccount><EditProposalPage /></RequireAccount>} />
    <Route path="/my/learning-requests/:id/proposals" element={<RequireAccount><ReceivedProposalsPage /></RequireAccount>} />
    <Route path="/my/learning-requests/:id/match" element={<RequireAccount><LearnerMatchPage /></RequireAccount>} />
    <Route path="/my/matches" element={<RequireAccount><DeveloperMatchesPage /></RequireAccount>} />
    <Route path="/admin/reports" element={<RequireAdmin><AdminReportsPage /></RequireAdmin>} />
    <Route path="/admin/pilot" element={<RequireAdmin><AdminPilotOverviewPage /></RequireAdmin>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></BrowserRouter>
}

function RequireAccount({ children }: { children: ReactNode }) {
  const location = useLocation()
  const account = useQuery({ queryKey: ['account'], queryFn: api.current, retry: false })
  if (account.isLoading) return <main className="learning-page"><p role="status">Đang kiểm tra phiên đăng nhập…</p></main>
  if (account.isError && !(account.error instanceof ApiError && account.error.status === 401)) return <main className="learning-page"><p role="alert">Không thể xác minh phiên đăng nhập. Hãy thử tải lại trang.</p></main>
  if (!account.data) return <Navigate to="/login" state={{ from: location }} replace />
  return children
}

function RequireAdmin({ children }: { children: ReactNode }) {
  const account = useQuery({ queryKey: ['account'], queryFn: api.current, retry: false })
  if (account.isLoading) return <main className="learning-page"><p role="status">Đang kiểm tra quyền quản trị…</p></main>
  if (account.isError) return <main className="learning-page"><p role="alert">Đăng nhập để tiếp tục.</p><Link to="/login">Đăng nhập</Link></main>
  if (!account.data?.admin) return <main className="learning-page"><p role="alert">Bạn không có quyền truy cập trang này.</p><Link to="/account">Quay lại tài khoản</Link></main>
  return children
}

function RequestDetailRoute() {
  const account = useQuery({ queryKey: ['account'], queryFn: api.current, retry: false })
  const { id } = useParams()
  return <HomePage authenticated={account.isSuccess && Boolean(account.data)} selectedId={id} />
}

function HomePage({ authenticated: authenticatedProp, selectedId }: { authenticated?: boolean; selectedId?: string }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [search, setSearch] = useState('')
  const account = useQuery({ queryKey: ['account'], queryFn: api.current, retry: false })
  const authenticated = authenticatedProp ?? (account.isSuccess && Boolean(account.data))

  return (
    <div className="app-shell bordful-shell">
      <header className="topbar bordful-topbar">
        <Link className="brand" to="/" aria-label="CodeMatch - khám phá yêu cầu học"><span className="brand-mark"><Braces size={18} strokeWidth={2.5} /></span><span>CodeMatch</span></Link>
        <label className="header-search"><span className="sr-only">Tìm yêu cầu học</span><input aria-label="Tìm yêu cầu học" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm yêu cầu học theo kỹ năng hoặc mục tiêu" /><kbd>⌘ K</kbd></label>
        <nav className={mobileOpen ? 'main-nav is-open' : 'main-nav'} aria-label="Điều hướng chính"><Link className="nav-current" to="/">Khám phá</Link><Link to="/saved-requests"><Bookmark size={14} /> Đã lưu</Link><Link className="mobile-menu-link" to={authenticated ? '/my/learning-requests' : '/login'}>{authenticated ? 'Yêu cầu của tôi' : 'Đăng nhập'}</Link></nav>
        <button className="mobile-menu" aria-label="Mở menu" aria-expanded={mobileOpen} onClick={() => setMobileOpen(!mobileOpen)}><Menu /></button>
        <div className="account-actions">{authenticated ? <><Link to="/my/learning-requests">Yêu cầu của tôi</Link><Link to="/account">Tài khoản</Link><Link className="button button-outline" to="/learning-requests/new">Đăng yêu cầu</Link></> : <><Link to="/login">Đăng nhập</Link><Link className="button button-outline" to="/register">Tham gia</Link></>}</div>
      </header>
      <main className="bordful-main" id="home">
        <h1 className="sr-only">Học code theo cách của bạn</h1>
        <RequestDiscovery authenticated={authenticated} searchValue={search} onSearchChange={setSearch} selectedId={selectedId} detailPanel={selectedId ? <RequestDetailPage authenticated={authenticated} panel /> : <div className="detail-placeholder"><strong>Chọn một yêu cầu để xem thông tin</strong><p>Chi tiết sẽ mở tại đây để bạn có thể xem nhanh lịch học, kỹ năng và ngân sách.</p></div>} />
      </main>
      <nav className="mobile-bottom-nav" aria-label="Điều hướng nhanh"><Link className="is-current" to="/">Khám phá</Link><Link to="/saved-requests">Đã lưu</Link><Link to={authenticated ? '/account' : '/login'}>{authenticated ? 'Tài khoản' : 'Đăng nhập'}</Link></nav>
    </div>
  )
}
