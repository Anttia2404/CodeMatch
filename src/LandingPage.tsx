import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Check, ChevronRight, Menu, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CodeMatchMark } from './CodeMatchBrand'
import { api } from './lib/api'
import type { BudgetUnit, LearningLevel, LearningRequest } from './lib/api'
import './landing-page.css'

const levelLabels: Record<LearningLevel, string> = {
  BEGINNER: 'Mới bắt đầu', BASIC: 'Cơ bản', INTERMEDIATE: 'Trung cấp', ADVANCED: 'Nâng cao',
}
const budgetUnitLabels: Record<BudgetUnit, string> = {
  PER_HOUR: 'mỗi giờ', PER_SESSION: 'mỗi buổi', TOTAL: 'toàn bộ',
}

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const account = useQuery({ queryKey: ['account'], queryFn: api.current, retry: false })
  const authenticated = account.isSuccess && Boolean(account.data)
  const closeMenu = () => setMenuOpen(false)

  return <div className="landing-page">
    <a className="landing-skip-link" href="#landing-main">Bỏ qua điều hướng</a>
    <header className="landing-header">
      <Link className="landing-brand" to="/" aria-label="CodeMatch — trang chủ"><CodeMatchMark /><span>CodeMatch</span></Link>
      <nav className="landing-desktop-nav" aria-label="Điều hướng chính">
        <a href="#how">Cách hoạt động</a><a href="#learners">Người học</a><a href="#developers">Developer</a>
      </nav>
      <div className="landing-header-actions">
        {authenticated ? <Link className="landing-header-link" to="/account">Tài khoản</Link> : <><Link className="landing-header-link" to="/login">Đăng nhập</Link><Link className="landing-header-join" to="/register">Tham gia CodeMatch</Link></>}
      </div>
      <button className="landing-menu-button" type="button" aria-label={menuOpen ? 'Đóng menu' : 'Mở menu'} aria-expanded={menuOpen} aria-controls="landing-mobile-nav" onClick={() => setMenuOpen((open) => !open)}>
        {menuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      {menuOpen && <nav className="landing-mobile-nav" id="landing-mobile-nav" aria-label="Điều hướng di động">
        <a href="#how" onClick={closeMenu}>Cách hoạt động</a><a href="#learners" onClick={closeMenu}>Người học</a><a href="#developers" onClick={closeMenu}>Developer</a>
        {authenticated ? <Link to="/account" onClick={closeMenu}>Tài khoản</Link> : <><Link to="/login" onClick={closeMenu}>Đăng nhập</Link><Link to="/register" onClick={closeMenu}>Tham gia CodeMatch</Link></>}
      </nav>}
    </header>

    <main id="landing-main">
      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-hero-copy">
          <p className="landing-kicker">HỌC TỪ DỰ ÁN THẬT · CÙNG DEVELOPER</p>
          <h1 id="landing-title">Học lập trình cùng developer phù hợp với bạn.</h1>
          <p className="landing-intro">Đăng mục tiêu học tập, nhận đề xuất từ developer và lựa chọn người hướng dẫn phù hợp với nhu cầu của bạn.</p>
          <div className="landing-hero-actions">
            <Link className="landing-button landing-button-primary" to="/learning-requests/new">Đăng yêu cầu học <ArrowRight size={16} aria-hidden="true" /></Link>
            <Link className="landing-button landing-button-secondary" to="/">Tìm yêu cầu để hướng dẫn</Link>
          </div>
          <p className="landing-hero-note">Người học chủ động xem đề xuất và quyết định.</p>
        </div>
        <ProductVisualization />
      </section>

      <section className="landing-how" id="how" aria-labelledby="how-title">
        <div className="landing-section-heading"><p className="landing-kicker">CÁCH CODEMATCH HOẠT ĐỘNG</p><h2 id="how-title">Học cùng người hiểu công việc bạn muốn làm.</h2><p>Một quy trình rõ ràng cho cả hai phía.</p></div>
        <div className="landing-flow-grid">
          <article className="landing-flow-column"><span className="landing-flow-label">Dành cho người học</span><h3>Bạn chọn mục tiêu học.</h3><ol><li><span>01</span><div><strong>Viết yêu cầu học</strong><p>Nêu kỹ năng, trình độ, ngân sách và cách bạn muốn học.</p></div></li><li><span>02</span><div><strong>Đọc đề xuất</strong><p>Xem cách developer có thể hỗ trợ mục tiêu của bạn.</p></div></li><li><span>03</span><div><strong>Chọn người đồng hành</strong><p>So sánh đề xuất và quyết định bước tiếp theo.</p></div></li></ol><Link className="landing-text-link" to="/learning-requests/new">Đăng yêu cầu học <ArrowRight size={15} /></Link></article>
          <article className="landing-flow-column"><span className="landing-flow-label">Dành cho developer</span><h3>Bạn chọn cách chia sẻ.</h3><ol><li><span>01</span><div><strong>Tạo hồ sơ developer</strong><p>Giới thiệu kinh nghiệm và những kỹ năng bạn có thể hướng dẫn.</p></div></li><li><span>02</span><div><strong>Tìm yêu cầu phù hợp</strong><p>Duyệt yêu cầu học và chọn yêu cầu phù hợp với bạn.</p></div></li><li><span>03</span><div><strong>Gửi đề xuất</strong><p>Trình bày cách bạn sẽ đồng hành để người học xem xét.</p></div></li></ol><Link className="landing-text-link" to="/developer-profile">Tạo hồ sơ developer <ArrowRight size={15} /></Link></article>
        </div>
      </section>

      <section className="landing-benefits" aria-label="Lợi ích theo vai trò">
        <article className="landing-benefit-row" id="learners"><div><p className="landing-kicker">CHO NGƯỜI HỌC</p><h2>Học theo dự án và vấn đề của chính bạn.</h2><p>Đặt câu hỏi đúng với bối cảnh, chọn hình thức học phù hợp và xem đề xuất trước khi quyết định.</p><Link className="landing-text-link" to="/learning-requests/new">Bắt đầu với mục tiêu học <ArrowRight size={15} /></Link></div><ul><li><Check size={16} />Mô tả kỹ năng muốn cải thiện</li><li><Check size={16} />Chọn trình độ và ngân sách dự kiến</li><li><Check size={16} />Quyết định đề xuất phù hợp với mình</li><li><Check size={16} />Kiểm soát CV được chia sẻ trong quy trình đề xuất</li></ul></article>
        <article className="landing-benefit-row landing-developer-benefit" id="developers"><div><p className="landing-kicker">CHO DEVELOPER</p><h2>Chia sẻ kinh nghiệm theo cách bạn thấy phù hợp.</h2><p>Khám phá yêu cầu học lập trình, chọn chủ đề phù hợp với chuyên môn và gửi đề xuất trực tiếp.</p><Link className="landing-text-link" to="/">Tìm yêu cầu để hướng dẫn <ArrowRight size={15} /></Link></div><ul><li><Check size={16} />Giới thiệu kỹ năng và kinh nghiệm thật</li><li><Check size={16} />Tìm yêu cầu theo công nghệ và mục tiêu</li><li><Check size={16} />Giải thích cách bạn có thể hướng dẫn</li><li><Check size={16} />Người học chủ động xem xét và lựa chọn</li></ul></article>
      </section>

      <MarketplacePreview />

      <section className="landing-faq" id="faq" aria-labelledby="faq-title"><div className="landing-section-heading"><p className="landing-kicker">CÂU HỎI THƯỜNG GẶP</p><h2 id="faq-title">Bắt đầu từ những điều bạn muốn biết.</h2></div><div className="landing-faq-list">
        <details><summary>CodeMatch giúp tôi làm gì?<span aria-hidden="true">+</span></summary><p>Người học có thể tạo yêu cầu học lập trình, nhận đề xuất từ developer và xem xét lựa chọn. Developer có thể tạo hồ sơ, tìm yêu cầu phù hợp và gửi đề xuất.</p></details>
        <details><summary>Tôi cần tài khoản để làm gì?<span aria-hidden="true">+</span></summary><p>Bạn có thể khám phá yêu cầu đang mở. Tạo tài khoản để đăng yêu cầu, lưu yêu cầu, tạo hồ sơ developer hoặc gửi đề xuất theo quyền hiện có.</p></details>
        <details><summary>Ai có thể xem CV của developer?<span aria-hidden="true">+</span></summary><p>CV được lưu riêng tư và chỉ được cung cấp trong phạm vi quy trình đề xuất có quyền truy cập. Không hiển thị liên kết CV công khai.</p></details>
        <details><summary>Người học có bắt buộc chọn một đề xuất không?<span aria-hidden="true">+</span></summary><p>Không. Người học có thể xem các đề xuất và tự quyết định có chọn developer hay không.</p></details>
      </div></section>

      <section className="landing-final-cta"><div><p className="landing-kicker">BƯỚC TIẾP THEO</p><h2>Học một điều cụ thể. Cùng người phù hợp.</h2><p>Người học đăng yêu cầu; developer tìm cơ hội hướng dẫn phù hợp.</p></div><div className="landing-final-actions"><Link className="landing-button landing-button-primary" to="/learning-requests/new">Đăng yêu cầu học <ArrowRight size={16} aria-hidden="true" /></Link><Link className="landing-button landing-button-secondary" to="/">Tìm yêu cầu để hướng dẫn</Link></div></section>
    </main>

    <footer className="landing-footer"><Link className="landing-brand" to="/" aria-label="CodeMatch — trang chủ"><CodeMatchMark /><span>CodeMatch</span></Link><p>Kết nối mục tiêu học lập trình với người có thể đồng hành.</p><nav aria-label="Liên kết cuối trang"><Link to="/">Yêu cầu học</Link><a href="#how">Cách hoạt động</a><Link to="/login">Đăng nhập</Link></nav></footer>
  </div>
}

function ProductVisualization() {
  return <section className="landing-product" aria-label="Minh họa quy trình từ Learning Request đến Proposal và lựa chọn">
    <div className="landing-product-top"><CodeMatchMark size={13} /><span>Quy trình CodeMatch</span><span className="landing-illustration-label">Minh họa quy trình</span></div>
    <div className="landing-product-body">
      <section className="landing-product-request"><p>YÊU CẦU HỌC</p><h2>Hoàn thiện một ứng dụng React</h2><p className="landing-product-description">Thực hành component, quản lý state và kết nối API trong dự án của bạn.</p><div className="landing-product-skills"><span>React</span><span>TypeScript</span></div><div className="landing-product-meta"><span>Trình độ: Trung cấp</span><span>Ngân sách: do người học đề xuất</span></div></section>
      <div className="landing-product-transition" aria-hidden="true"><span></span><ArrowRight size={16} /><span></span></div>
      <section className="landing-product-proposal"><p>TEACHING PROPOSAL</p><h2>Developer gửi cách hướng dẫn</h2><ul><li><Check size={13} />Kế hoạch thực hành theo mục tiêu</li><li><Check size={13} />Kinh nghiệm liên quan đến kỹ năng</li><li><Check size={13} />Lịch học và mức phí đề xuất</li></ul></section>
      <div className="landing-product-selection"><span className="selection-marker"><Check size={13} /></span><span>Người học xem xét và tự chọn đề xuất</span></div>
    </div>
  </section>
}

function MarketplacePreview() {
  const requests = useQuery({ queryKey: ['landing-marketplace-preview'], queryFn: () => api.discoverRequests({ page: 0, size: 3, sort: 'NEWEST' }), retry: false, staleTime: 30_000 })
  return <section className="landing-marketplace" aria-labelledby="marketplace-title">
    <div className="landing-marketplace-heading"><div><p className="landing-kicker">YÊU CẦU HỌC ĐANG MỞ</p><h2 id="marketplace-title">Bắt đầu từ mục tiêu học cụ thể.</h2><p>Đọc kỹ năng, cấp độ và kỳ vọng trước khi chọn cách đồng hành.</p></div><Link className="landing-text-link" to="/">Khám phá tất cả yêu cầu <ArrowRight size={15} /></Link></div>
    <div className="landing-request-preview" aria-live="polite" aria-busy={requests.isLoading}>
      {requests.isLoading && <div className="landing-preview-state" role="status"><span className="landing-skeleton-line" /><span className="landing-skeleton-line" /><span className="landing-skeleton-line" /></div>}
      {requests.isError && <div className="landing-preview-state is-error" role="alert"><strong>Chưa tải được yêu cầu học</strong><span>Kiểm tra kết nối rồi thử lại.</span><button type="button" className="landing-retry" onClick={() => void requests.refetch()}>Thử lại</button></div>}
      {requests.isSuccess && requests.data.content.length === 0 && <div className="landing-preview-state"><strong>Chưa có yêu cầu học đang mở</strong><span>Khi có yêu cầu phù hợp, nội dung sẽ xuất hiện tại đây.</span><Link className="landing-text-link" to="/">Mở marketplace <ArrowRight size={15} /></Link></div>}
      {requests.isSuccess && requests.data.content.map((request) => <MarketplaceRequestRow key={request.id} request={request} />)}
    </div>
  </section>
}

function MarketplaceRequestRow({ request }: { request: LearningRequest }) {
  const budget = request.budgetMin != null && request.budgetMax != null && request.budgetUnit
    ? `${new Intl.NumberFormat('vi-VN').format(request.budgetMin)}–${new Intl.NumberFormat('vi-VN').format(request.budgetMax)} ₫ / ${budgetUnitLabels[request.budgetUnit]}`
    : 'Ngân sách sẽ trao đổi'
  const format = request.preferredFormat === 'ONLINE' ? 'Học online' : `Học trực tiếp${request.city ? ` · ${request.city}` : ''}`
  return <article className="landing-request-row"><div className="landing-request-copy"><Link to={`/learning-requests/${encodeURIComponent(request.id)}`}>{request.title}</Link><p>{request.learningGoal}</p><div className="landing-request-tags">{request.skills.map((skill) => <span key={skill.id}>{skill.name}</span>)}</div></div><div className="landing-request-facts"><span>{levelLabels[request.currentLevel]}</span><span>{format}</span><strong>{budget}</strong><Link to={`/learning-requests/${encodeURIComponent(request.id)}`}>Xem chi tiết <ChevronRight size={14} /></Link></div></article>
}
