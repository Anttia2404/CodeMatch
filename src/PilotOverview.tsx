import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from './lib/api'
import './pilot-overview.css'

const number = new Intl.NumberFormat('vi-VN')
const percent = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 })

export function AdminPilotOverviewPage() {
  const overview = useQuery({ queryKey: ['admin-pilot-overview'], queryFn: api.adminPilotOverview })

  return <main className="learning-page pilot-overview-page">
    <div className="learning-page-heading">
      <div><span className="section-kicker">QUẢN TRỊ · PILOT</span><h1>Tổng quan hoạt động</h1><p>Số liệu được tổng hợp từ dữ liệu CodeMatch hiện có trong môi trường này.</p></div>
      <Link className="button button-outline" to="/admin/reports">Quản lý báo cáo</Link>
    </div>
    {overview.isLoading && <p role="status">Đang tải số liệu…</p>}
    {overview.isError && <div role="alert" className="pilot-error"><p>Không thể tải số liệu tổng quan.</p><button className="button button-outline" onClick={() => void overview.refetch()}>Thử lại</button></div>}
    {overview.data && <>
      {overview.data.totalRegisteredUsers === 0 && <p className="pilot-empty">Chưa có dữ liệu trong môi trường này.</p>}
      <section className="pilot-metric-grid" aria-label="Chỉ số hoạt động">
        <Metric label="Tài khoản đã đăng ký" value={number.format(overview.data.totalRegisteredUsers)} />
        <Metric label="Developer đang hoạt động" value={number.format(overview.data.activeDevelopers)} />
        <Metric label="Yêu cầu đang mở" value={number.format(overview.data.openLearningRequests)} />
        <Metric label="Yêu cầu đã đăng" value={number.format(overview.data.publishedLearningRequests)} />
        <Metric label="Đề xuất đang gửi" value={number.format(overview.data.submittedProposals)} />
        <Metric label="Yêu cầu đã nhận đề xuất" value={number.format(overview.data.requestsWithAtLeastOneProposal)} />
        <Metric label="Lượt ghép đôi đã xác nhận" value={number.format(overview.data.confirmedMatches)} />
        <Metric label="Báo cáo chờ xử lý" value={number.format(overview.data.pendingModerationReports)} />
      </section>
      <section className="pilot-funnel" aria-labelledby="pilot-funnel-title">
        <h2 id="pilot-funnel-title">Tỷ lệ trong hành trình</h2>
        <p><span>Yêu cầu đã đăng nhận được ít nhất một đề xuất</span><strong>{percent.format(overview.data.requestProposalCoveragePercent)}%</strong></p>
        <p><span>Yêu cầu đã đăng dẫn đến ghép đôi xác nhận</span><strong>{percent.format(overview.data.requestMatchConversionPercent)}%</strong></p>
        <p><span>Thời gian trung bình đến đề xuất đầu tiên</span><strong>{number.format(overview.data.averageMinutesToFirstProposal)} phút</strong></p>
        <p><span>Thời gian trung bình đến ghép đôi</span><strong>{number.format(overview.data.averageMinutesToConfirmedMatch)} phút</strong></p>
        <small>Các khoảng thời gian tính từ lúc đăng yêu cầu; yêu cầu chưa nhận đề xuất hoặc chưa ghép đôi không nằm trong phép tính.</small>
      </section>
    </>}
  </main>
}

function Metric({ label, value }: { label: string; value: string }) {
  return <article className="pilot-metric"><h2>{label}</h2><strong>{value}</strong></article>
}
