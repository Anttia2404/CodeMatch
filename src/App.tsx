import { ArrowRight, Braces, Compass, Lightbulb, MapPin, Menu, Target } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
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
import { LearningHeroScene } from './LearningHeroScene'

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

function Reveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true)
        observer.disconnect()
      }
    }, { threshold: 0.12 })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return <div ref={ref} className={`scroll-reveal${visible ? ' is-visible' : ''} ${className}`}>{children}</div>
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
        <section className="hero hero-section">
          <LearningHeroScene />
          <div className="hero-copy">
            <div className="trust-note"><span className="trust-dot" /> Học 1:1 · Theo nhịp của bạn</div>
            <h1>Học lập trình.<br /><span>Đi xa hơn cùng nhau.</span></h1>
            <p className="hero-description">Chọn một mục tiêu, tìm developer đồng hành và biến điều đang học thành sản phẩm bạn tự làm được.</p>
            <div className="hero-actions"><a className="button button-primary" href="#requests">Khám phá yêu cầu học <ArrowRight size={17} /></a><Link className="quiet-link" to={authenticated ? '/learning-requests/new' : '/register'}>{authenticated ? 'Bạn muốn học?' : 'Bạn là developer?'} <span>{authenticated ? 'Đăng yêu cầu' : 'Tạo hồ sơ'}</span></Link></div>
          </div>
          <a className="hero-scroll" href="#requests"><span /> Cuộn để khám phá</a>
        </section>

        <section className="discovery" id="requests">
          <Reveal className="section-heading"><div><span className="section-kicker">Cơ hội học mới</span><h2>Đang cần người đồng hành</h2><p>Yêu cầu đang mở từ người học trên CodeMatch.</p></div><div className="section-actions"><span className={`api-status ${apiStatus.isSuccess ? 'api-online' : apiStatus.isError ? 'api-offline' : ''}`}><i />{apiStatus.isSuccess ? 'API trực tuyến' : apiStatus.isError ? 'API chưa kết nối' : 'Đang kiểm tra API'}</span></div></Reveal>
          <RequestDiscovery authenticated={authenticated} />
        </section>
        <section className="how-section section" id="how" aria-labelledby="how-title">
          <Reveal className="how-heading"><div><span className="section-kicker">Học theo mục tiêu thật</span><h2 id="how-title">Từ câu hỏi đầu tiên<br />đến điều bạn tự xây.</h2></div><p>Mỗi hành trình bắt đầu từ điều bạn muốn làm được. Bạn chọn người đồng hành và cùng thống nhất cách học phù hợp.</p></Reveal>
          <div className="learning-steps">
            <Reveal className="learning-step"><span className="step-index">01</span><Target size={23} /><h3>Nêu mục tiêu</h3><p>Chia sẻ kỹ năng, sản phẩm hoặc vấn đề bạn muốn học.</p></Reveal>
            <Reveal className="learning-step"><span className="step-index">02</span><Compass size={23} /><h3>Chọn người đồng hành</h3><p>Xem các đề xuất và chọn developer phù hợp với cách học của bạn.</p></Reveal>
            <Reveal className="learning-step"><span className="step-index">03</span><Lightbulb size={23} /><h3>Cùng thực hành</h3><p>Thống nhất lịch và biến kiến thức thành kỹ năng qua từng buổi.</p></Reveal>
          </div>
        </section>
      </main>
      <footer><a className="brand footer-brand" href="#home"><span className="brand-mark"><Braces size={18} /></span><span>code<span className="brand-match">match</span></span></a><span>Học lập trình, theo cách của bạn.</span><span className="footer-location">Việt Nam · <MapPin size={13} /></span></footer>
    </div>
  )
}
