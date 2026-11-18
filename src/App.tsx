import { ArrowRight, Braces, Code2, MapPin, Menu, ShieldCheck, Sparkles } from 'lucide-react'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api, ApiError, checkApiHealth } from './lib/api'
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AccountPage, DeveloperProfileFormPage, LoginPage, PublicDeveloperProfilePage, RegisterPage } from './AuthPages'
import { LearningRequestFormPage, LearnerDashboardPage, RequestDetailPage, RequestDiscovery, SavedRequestsPage } from './LearningRequests'
import { EditProposalPage, MyProposalsPage, ProposalApplyPage, ReceivedProposalsPage } from './ProposalPages'
import { DeveloperMatchesPage, LearnerMatchPage } from './MatchPages'
import { AdminReportsPage } from './ModerationPages'
import { AdminPilotOverviewPage } from './PilotOverview'

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
  return <RequestDetailPage authenticated={account.isSuccess && Boolean(account.data)} />
}

function HomePage() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const apiStatus = useQuery({ queryKey: ['api-health'], queryFn: checkApiHealth, retry: 0, refetchInterval: 60_000 })
  const account = useQuery({ queryKey: ['account'], queryFn: api.current, retry: false })
  const authenticated = account.isSuccess && Boolean(account.data)

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="CodeMatch trang chủ"><span className="brand-mark"><Braces size={21} strokeWidth={2.5} /></span><span>code<span className="brand-match">match</span></span></a>
        <button className="mobile-menu" aria-label="Mở menu" aria-expanded={mobileOpen} onClick={() => setMobileOpen(!mobileOpen)}><Menu /></button>
        <nav className={mobileOpen ? 'main-nav is-open' : 'main-nav'} aria-label="Điều hướng chính">
          <a className="nav-link active" href="#requests">Tìm cơ hội học</a><a className="nav-link" href="#how">Cách hoạt động</a>
          {authenticated ? <><Link className="nav-link mobile-auth" to="/my/learning-requests">Yêu cầu của tôi</Link><Link className="nav-link mobile-auth" to="/my/proposals">Đề xuất và CV</Link><Link className="nav-link mobile-auth" to="/my/matches">Kết quả đã chọn</Link><Link className="nav-link mobile-auth" to="/saved-requests">Đã lưu</Link><Link className="nav-link mobile-auth" to="/account">Tài khoản</Link><Link className="button button-outline nav-join" to="/learning-requests/new">Đăng yêu cầu học</Link></> : <><Link className="nav-link mobile-auth" to="/login">Đăng nhập</Link><Link className="button button-outline nav-join" to="/register">Tham gia CodeMatch</Link></>}
        </nav>
        <div className="account-actions">{authenticated ? <><Link className="login-link" to="/my/learning-requests">Yêu cầu của tôi</Link><Link className="login-link" to="/my/proposals">Đề xuất và CV</Link><Link className="login-link" to="/my/matches">Kết quả đã chọn</Link><Link className="button button-outline" to="/learning-requests/new">Đăng yêu cầu</Link><Link className="login-link" to="/account">Tài khoản</Link></> : <><Link className="login-link" to="/login">Đăng nhập</Link><Link className="button button-outline" to="/register">Tham gia CodeMatch</Link></>}</div>
      </header>

      <main id="home">
        <section className="hero">
          <div className="hero-copy">
            <div className="trust-note"><span className="trust-dot" /> Học 1:1 cùng developer độc lập</div>
            <h1>Học code theo cách <span>của bạn.</span></h1>
            <p className="hero-description">Chia sẻ điều bạn muốn học. Tìm một developer phù hợp để cùng bạn đi tiếp, từng buổi một.</p>
            <div className="hero-actions"><a className="button button-primary" href="#requests">Khám phá yêu cầu học <ArrowRight size={17} /></a><Link className="quiet-link" to={authenticated ? '/learning-requests/new' : '/register'}>{authenticated ? 'Bạn muốn học?' : 'Bạn là developer?'} <span>{authenticated ? 'Đăng yêu cầu' : 'Tạo hồ sơ'}</span></Link></div>
          </div>
          <div className="hero-art" aria-label="Minh họa kết nối người học và developer">
            <div className="orbit orbit-one" /><div className="orbit orbit-two" />
            <div className="code-window"><div className="window-head"><span /><span /><span /><i>learning.js</i></div><div className="code-lines"><span><b>01</b><em>const</em> nextStep = <strong>learn</strong>();</span><span><b>02</b></span><span><b>03</b><em>await</em> nextStep.<strong>with</strong>(you);</span><span><b>04</b></span><span><b>05</b><small>// tiến bộ, từng buổi một</small></span></div></div>
            <div className="connection-card"><span className="connection-icon"><Code2 size={18} /></span><div><strong>Đúng người, đúng lúc</strong><small>Học theo mục tiêu của bạn</small></div><span className="connection-check"><ShieldCheck size={17} /></span></div>
            <span className="spark spark-a"><Sparkles size={18} /></span><span className="spark spark-b">&#123; &#125;</span>
          </div>
        </section>

        <section className="discovery" id="requests">
          <div className="section-heading"><div><span className="section-kicker">CƠ HỘI MỚI</span><h2>Đang cần người đồng hành</h2><p>Yêu cầu đang mở từ người học trên CodeMatch.</p></div><div className="section-actions"><span className={`api-status ${apiStatus.isSuccess ? 'api-online' : apiStatus.isError ? 'api-offline' : ''}`}><i />{apiStatus.isSuccess ? 'API trực tuyến' : apiStatus.isError ? 'API chưa kết nối' : 'Đang kiểm tra API'}</span></div></div>
          <RequestDiscovery authenticated={authenticated} />
        </section>
        <section className="how-strip" id="how"><span className="how-icon"><Sparkles size={19} /></span><p><strong>Mỗi buổi học bắt đầu từ mục tiêu của bạn.</strong> Bạn chọn người dạy, cùng thống nhất cách học và lịch trình phù hợp.</p><a href="#how-details">Tìm hiểu thêm <ArrowRight size={15} /></a></section>
      </main>
      <footer><a className="brand footer-brand" href="#home"><span className="brand-mark"><Braces size={18} /></span><span>code<span className="brand-match">match</span></span></a><span>Học lập trình, theo cách của bạn.</span><span className="footer-location">Việt Nam · <MapPin size={13} /></span></footer>
    </div>
  )
}
