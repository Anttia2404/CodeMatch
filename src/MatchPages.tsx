import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { api, ApiError } from './lib/api'
import type { ConfirmedMatch } from './lib/api'
import './proposals.css'

const explain = (error: unknown) => error instanceof ApiError ? error.message : 'Không thể kết nối máy chủ. Kiểm tra kết nối rồi thử lại.'
const price = (match: ConfirmedMatch) => {
  const labels = { PER_HOUR: 'mỗi giờ', PER_SESSION: 'mỗi buổi', TOTAL: 'toàn bộ chương trình' }
  return `${new Intl.NumberFormat('vi-VN').format(match.proposal.proposedRate)} ₫ / ${labels[match.proposal.rateUnit]}`
}

export function LearnerMatchPage() {
  const { id = '' } = useParams()
  const match = useQuery({ queryKey: ['learner-match', id], queryFn: () => api.learnerMatch(id), enabled: Boolean(id), retry: false })
  return <main className="learning-page proposal-page match-page">
    <Link className="form-back" to="/my/learning-requests"><ArrowLeft size={15} /> Yêu cầu của tôi</Link>
    <div className="learning-page-heading"><div><span className="section-kicker">KẾT QUẢ LỰA CHỌN</span><h1>Developer đã chọn</h1></div></div>
    {match.isLoading && <p role="status">Đang tải thông tin kết nối…</p>}
    {match.isError && <p role="alert" className="form-error">{explain(match.error)}</p>}
    {match.data && <MatchSummary match={match.data} audience="learner" />}
  </main>
}

export function DeveloperMatchesPage() {
  const matches = useQuery({ queryKey: ['developer-matches'], queryFn: api.developerMatches })
  return <main className="learning-page proposal-page match-page">
    <Link className="form-back" to="/my/proposals"><ArrowLeft size={15} /> Đề xuất và CV của tôi</Link>
    <div className="learning-page-heading"><div><span className="section-kicker">KẾT QUẢ LỰA CHỌN</span><h1>Yêu cầu đã chọn bạn</h1></div></div>
    {matches.isLoading && <p role="status">Đang tải kết quả…</p>}
    {matches.isError && <p role="alert" className="form-error">{explain(matches.error)}</p>}
    {matches.data?.length === 0 && <p className="proposal-empty">Chưa có yêu cầu nào chọn đề xuất của bạn.</p>}
    {matches.data?.map((match) => <MatchSummary key={match.id} match={match} audience="developer" />)}
  </main>
}

function MatchSummary({ match, audience }: { match: ConfirmedMatch; audience: 'learner' | 'developer' }) {
  return <article className="match-summary" aria-labelledby={`match-${match.id}`}>
    <div className="match-summary-heading"><CheckCircle2 size={22} aria-hidden="true" /><div><span className="match-confirmed">Đã xác nhận</span><h2 id={`match-${match.id}`}>{match.learningRequestTitle}</h2></div></div>
    <div className="match-summary-person"><div className="match-avatar" aria-hidden="true">{match.developer.displayName.slice(0, 1).toLocaleUpperCase('vi-VN')}</div><div><h3>{match.developer.displayName}</h3><p>{match.developer.headline}</p></div><Link to={`/developers/${match.developer.profileId}`}>Xem hồ sơ <ArrowRight size={14} /></Link></div>
    {audience === 'developer' && <p className="match-audience-note">Người học: <strong>{match.learnerDisplayName}</strong></p>}
    <dl className="compare-facts"><div><dt>Mức phí đã chọn</dt><dd>{price(match)}</dd></div><div><dt>Lịch đề xuất</dt><dd>{match.proposal.proposedSchedule}</dd></div><div><dt>Thời lượng</dt><dd>{match.proposal.estimatedDuration}</dd></div></dl>
    <p>{match.proposal.introduction}</p>
    <p className="match-audience-note">Yêu cầu đã chuyển sang trạng thái đã chọn developer. Các đề xuất khác vẫn được lưu để tham chiếu.</p>
  </article>
}
