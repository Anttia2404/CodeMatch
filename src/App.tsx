import { ArrowRight, Bookmark, Braces, ChevronDown, Clock3, Code2, MapPin, Menu, Search, ShieldCheck, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { checkApiHealth } from './lib/api'

const requests = [
  { title: 'Mình muốn hiểu React hooks qua một project nhỏ', detail: 'Đang làm quen với React, muốn tự tay hoàn thiện một ứng dụng quản lý công việc để hiểu state và effect thực sự hoạt động ra sao.', name: 'Minh Anh', initials: 'MA', color: 'lavender', time: 'Đăng 2 giờ trước', level: 'Mới bắt đầu', budget: '200–350k / buổi', tags: ['React', 'JavaScript', 'Frontend'], sessions: '4–6 buổi' },
  { title: 'Review giúp lộ trình học backend với Spring Boot', detail: 'Mình đã biết Java cơ bản và đang phân vân nên học gì tiếp theo để có thể tự xây dựng REST API hoàn chỉnh.', name: 'Quốc Bảo', initials: 'QB', color: 'mint', time: 'Đăng hôm qua', level: 'Cơ bản', budget: '250–400k / buổi', tags: ['Java', 'Spring Boot', 'Backend'], sessions: '3–4 buổi' },
  { title: 'Cùng debug và tối ưu truy vấn PostgreSQL', detail: 'Cần người hướng dẫn đọc execution plan và giúp mình hiểu cách cải thiện vài truy vấn chậm trong side project.', name: 'Thảo Vy', initials: 'TV', color: 'peach', time: 'Đăng 1 ngày trước', level: 'Trung cấp', budget: '300–500k / buổi', tags: ['PostgreSQL', 'SQL', 'Backend'], sessions: '2–3 buổi' },
]

const filters = ['Tất cả kỹ năng', 'Mức kinh nghiệm', 'Ngân sách', 'Lịch học']

export default function App() {
  const [saved, setSaved] = useState<number[]>([])
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('Tất cả kỹ năng')
  const [mobileOpen, setMobileOpen] = useState(false)
  const apiStatus = useQuery({ queryKey: ['api-health'], queryFn: checkApiHealth, retry: 0, refetchInterval: 60_000 })
  const visibleRequests = requests.filter((request) => `${request.title} ${request.detail} ${request.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase()))

  function toggleSaved(index: number) {
    setSaved((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index])
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="CodeMatch trang chủ"><span className="brand-mark"><Braces size={21} strokeWidth={2.5} /></span><span>code<span className="brand-match">match</span></span></a>
        <button className="mobile-menu" aria-label="Mở menu" aria-expanded={mobileOpen} onClick={() => setMobileOpen(!mobileOpen)}><Menu /></button>
        <nav className={mobileOpen ? 'main-nav is-open' : 'main-nav'} aria-label="Điều hướng chính">
          <a className="nav-link active" href="#requests">Tìm cơ hội học</a><a className="nav-link" href="#how">Cách hoạt động</a>
          <a className="nav-link mobile-auth" href="#login">Đăng nhập</a><a className="button button-outline nav-join" href="#signup">Tham gia CodeMatch</a>
        </nav>
        <div className="account-actions"><a className="login-link" href="#login">Đăng nhập</a><a className="button button-outline" href="#signup">Tham gia CodeMatch</a></div>
      </header>

      <main id="home">
        <section className="hero">
          <div className="hero-copy">
            <div className="trust-note"><span className="trust-dot" /> Học 1:1 cùng developer độc lập</div>
            <h1>Học code theo cách <span>của bạn.</span></h1>
            <p className="hero-description">Chia sẻ điều bạn muốn học. Tìm một developer phù hợp để cùng bạn đi tiếp, từng buổi một.</p>
            <div className="hero-actions"><a className="button button-primary" href="#requests">Khám phá yêu cầu học <ArrowRight size={17} /></a><a className="quiet-link" href="#how">Bạn là developer? <span>Khám phá cơ hội</span></a></div>
          </div>
          <div className="hero-art" aria-label="Minh họa kết nối người học và developer">
            <div className="orbit orbit-one" /><div className="orbit orbit-two" />
            <div className="code-window"><div className="window-head"><span /><span /><span /><i>learning.js</i></div><div className="code-lines"><span><b>01</b><em>const</em> nextStep = <strong>learn</strong>();</span><span><b>02</b></span><span><b>03</b><em>await</em> nextStep.<strong>with</strong>(you);</span><span><b>04</b></span><span><b>05</b><small>// tiến bộ, từng buổi một</small></span></div></div>
            <div className="connection-card"><span className="connection-icon"><Code2 size={18} /></span><div><strong>Đúng người, đúng lúc</strong><small>Học theo mục tiêu của bạn</small></div><span className="connection-check"><ShieldCheck size={17} /></span></div>
            <span className="spark spark-a"><Sparkles size={18} /></span><span className="spark spark-b">&#123; &#125;</span>
          </div>
        </section>

        <section className="discovery" id="requests">
          <div className="section-heading"><div><span className="section-kicker">CƠ HỘI MỚI</span><h2>Đang cần người đồng hành</h2><p>Những mục tiêu học tập đang chờ một developer phù hợp.</p><p className="demo-note">Yêu cầu bên dưới là dữ liệu minh họa, chưa lấy từ API.</p></div><div className="section-actions"><span className={`api-status ${apiStatus.isSuccess ? 'api-online' : apiStatus.isError ? 'api-offline' : ''}`}><i />{apiStatus.isSuccess ? 'API trực tuyến' : apiStatus.isError ? 'API chưa kết nối' : 'Đang kiểm tra API'}</span><a className="all-link" href="#all">Xem tất cả yêu cầu <ArrowRight size={16} /></a></div></div>
          <div className="search-row"><label className="search-box"><Search size={18} /><input aria-label="Tìm theo kỹ năng hoặc công nghệ" placeholder="Tìm theo kỹ năng, công nghệ..." value={query} onChange={(event) => setQuery(event.target.value)} /><kbd>⌘ K</kbd></label><div className="filter-list">{filters.map((filter) => <button key={filter} className={`filter-button ${activeFilter === filter ? 'filter-selected' : ''}`} onClick={() => setActiveFilter(filter)}>{filter}<ChevronDown size={14} /></button>)}</div></div>
          <div className="request-list" aria-live="polite">{visibleRequests.map((request) => {
            const originalIndex = requests.indexOf(request)
            return <article className="request-card" key={request.title}>
              <div className="request-main"><div className="request-title-row"><a className="request-title" href={`#request-${originalIndex}`}>{request.title}</a><button className={`save-button ${saved.includes(originalIndex) ? 'is-saved' : ''}`} onClick={() => toggleSaved(originalIndex)} aria-label={saved.includes(originalIndex) ? 'Bỏ lưu yêu cầu' : 'Lưu yêu cầu'} aria-pressed={saved.includes(originalIndex)}><Bookmark size={18} fill={saved.includes(originalIndex) ? 'currentColor' : 'none'} /></button></div><p className="request-description">{request.detail}</p><div className="tag-list">{request.tags.map((tag) => <span className="skill-tag" key={tag}>{tag}</span>)}</div></div>
              <div className="request-meta"><div className="requester"><span className={`avatar ${request.color}`}>{request.initials}</span><div><strong>{request.name}</strong><small>{request.time}</small></div></div><div className="meta-grid"><span><Code2 size={14} />{request.level}</span><span><Clock3 size={14} />{request.sessions}</span><span><MapPin size={14} />Online</span></div></div>
              <div className="request-price"><strong>{request.budget}</strong><span>ngân sách dự kiến</span><a href={`#proposal-${originalIndex}`}>Xem chi tiết <ArrowRight size={14} /></a></div>
            </article>
          })}{visibleRequests.length === 0 && <div className="empty-state"><Search size={22} /><strong>Chưa tìm thấy yêu cầu phù hợp</strong><span>Thử một từ khóa khác như React, Java hoặc SQL.</span></div>}</div>
        </section>
        <section className="how-strip" id="how"><span className="how-icon"><Sparkles size={19} /></span><p><strong>Mỗi buổi học bắt đầu từ mục tiêu của bạn.</strong> Bạn chọn người dạy, cùng thống nhất cách học và lịch trình phù hợp.</p><a href="#how-details">Tìm hiểu thêm <ArrowRight size={15} /></a></section>
      </main>
      <footer><a className="brand footer-brand" href="#home"><span className="brand-mark"><Braces size={18} /></span><span>code<span className="brand-match">match</span></span></a><span>Học lập trình, theo cách của bạn.</span><span className="footer-location">Việt Nam · <MapPin size={13} /></span></footer>
    </div>
  )
}
