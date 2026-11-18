import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api, ApiError } from './lib/api'
import type { ModerationReport, ReportTargetType } from './lib/api'
import './moderation.css'

const reasons = [
  ['SPAM', 'Spam'], ['HARASSMENT', 'Quấy rối'], ['INAPPROPRIATE', 'Nội dung không phù hợp'],
  ['FRAUD', 'Lừa đảo'], ['OTHER', 'Lý do khác'],
]
const labels: Record<ReportTargetType, string> = {
  LEARNING_REQUEST: 'yêu cầu học', DEVELOPER_PROFILE: 'hồ sơ developer', TEACHING_PROPOSAL: 'đề xuất',
}
const reportError = (error: unknown) => error instanceof ApiError ? error.message : 'Không thể gửi yêu cầu. Hãy thử lại sau.'

export function ReportButton({ targetType, targetId }: { targetType: ReportTargetType; targetId: string }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('OTHER')
  const [description, setDescription] = useState('')
  const [sent, setSent] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const reasonRef = useRef<HTMLSelectElement>(null)
  const submit = useMutation({ mutationFn: () => api.createReport({ targetType, targetId, reason, description }) })

  useEffect(() => {
    if (!open) return
    const trigger = triggerRef.current
    reasonRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKeyDown)
    return () => { window.removeEventListener('keydown', onKeyDown); trigger?.focus() }
  }, [open])

  return <>
    <button ref={triggerRef} className="button button-outline report-trigger" onClick={() => setOpen(true)} disabled={sent}>
      {sent ? 'Đã gửi báo cáo' : 'Báo cáo nội dung'}
    </button>
    {open && <div className="report-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false) }}>
      <section className="report-dialog" role="dialog" aria-modal="true" aria-labelledby="report-title">
        <h2 id="report-title">Báo cáo {labels[targetType]}</h2>
        <p>Chỉ nhóm quản trị mới xem được nội dung báo cáo. Không nhập mật khẩu, mã xác thực hoặc thông tin riêng tư.</p>
        <form onSubmit={(event) => { event.preventDefault(); submit.mutate(undefined, { onSuccess: () => { setSent(true); setOpen(false) } }) }}>
          <label>Lý do<select ref={reasonRef} value={reason} onChange={(event) => setReason(event.target.value)}>{reasons.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label>
          <label>Mô tả (không bắt buộc)<textarea value={description} maxLength={1000} rows={4} onChange={(event) => setDescription(event.target.value)} /></label>
          {submit.isError && <p role="alert" className="report-error">{reportError(submit.error)}</p>}
          <div className="report-actions"><button type="button" className="button button-outline" onClick={() => setOpen(false)}>Đóng</button><button type="submit" className="button button-primary" disabled={submit.isPending}>{submit.isPending ? 'Đang gửi…' : 'Gửi báo cáo'}</button></div>
        </form>
      </section>
    </div>}
  </>
}

export function AdminReportsPage() {
  const client = useQueryClient()
  const [userId, setUserId] = useState('')
  const [message, setMessage] = useState('')
  const reports = useQuery({ queryKey: ['admin-reports'], queryFn: () => api.adminReports('OPEN') })
  const review = useMutation({ mutationFn: ({ id, status }: { id: string; status: 'RESOLVED' | 'DISMISSED' }) => api.reviewReport(id, status), onSuccess: () => { setMessage('Báo cáo đã được cập nhật.'); void client.invalidateQueries({ queryKey: ['admin-reports'] }) } })
  const hide = useMutation({ mutationFn: api.hideRequest, onSuccess: () => setMessage('Yêu cầu đã được ẩn.') })
  const suspend = useMutation({ mutationFn: api.suspendUser, onSuccess: () => { setMessage('Tài khoản đã bị đình chỉ và các phiên đăng nhập đã bị thu hồi.'); setUserId('') } })
  const error = reports.error ?? review.error ?? hide.error ?? suspend.error

  return <main className="learning-page moderation-page">
    <div className="learning-page-heading"><div><span className="section-kicker">QUẢN TRỊ</span><h1>Báo cáo cần xem</h1><p>Tối đa 100 báo cáo đang chờ xử lý.</p></div><Link className="button button-outline" to="/account">Tài khoản</Link></div>
    <section className="moderation-tools"><h2>Đình chỉ tài khoản</h2><p>Nhập ID tài khoản đã được xác minh trong nội dung báo cáo.</p><form onSubmit={(event) => { event.preventDefault(); if (userId.trim()) suspend.mutate(userId.trim()) }}><label>ID tài khoản<input value={userId} onChange={(event) => setUserId(event.target.value)} required /></label><button className="button button-outline" disabled={suspend.isPending}>Đình chỉ</button></form></section>
    {message && <p role="status" className="report-success">{message}</p>}
    {error && <p role="alert" className="report-error">{reportError(error)}</p>}
    {reports.isLoading && <p role="status">Đang tải báo cáo…</p>}
    {reports.isError && <button className="button button-outline" onClick={() => void reports.refetch()}>Tải lại báo cáo</button>}
    {reports.data?.length === 0 && <div className="report-empty">Không có báo cáo đang chờ xử lý.</div>}
    <div className="moderation-list">{reports.data?.map((report) => <ReportCard key={report.id} report={report} onReview={(status) => review.mutate({ id: report.id, status })} onHide={() => hide.mutate(report.targetId)} busy={review.isPending || hide.isPending} />)}</div>
  </main>
}

function ReportCard({ report, onReview, onHide, busy }: { report: ModerationReport; onReview: (status: 'RESOLVED' | 'DISMISSED') => void; onHide: () => void; busy: boolean }) {
  const targetUrl = report.targetType === 'LEARNING_REQUEST' ? `/learning-requests/${report.targetId}`
    : report.targetType === 'DEVELOPER_PROFILE' ? `/developers/${report.targetId}` : undefined
  return <article className="moderation-card">
    <div className="moderation-card-head"><strong>{reasons.find(([value]) => value === report.reason)?.[1] ?? report.reason}</strong><time dateTime={report.createdAt}>{new Date(report.createdAt).toLocaleString('vi-VN')}</time></div>
    <p>Loại nội dung: {labels[report.targetType]}</p>
    {report.description && <p className="moderation-description">{report.description}</p>}
    <p className="moderation-id">Mã báo cáo: {report.id}</p>
    {targetUrl && <Link to={targetUrl}>Mở nội dung theo quyền truy cập hiện có</Link>}
    {report.targetType === 'LEARNING_REQUEST' && <button className="text-action" disabled={busy} onClick={onHide}>Ẩn yêu cầu học</button>}
    <div className="report-actions"><button className="button button-outline" disabled={busy} onClick={() => onReview('DISMISSED')}>Bỏ qua</button><button className="button button-primary" disabled={busy} onClick={() => onReview('RESOLVED')}>Đánh dấu đã xử lý</button></div>
  </article>
}
