import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, FileText, Upload, X } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, ApiError } from './lib/api'
import type { BudgetUnit, DeveloperCv, Proposal, ProposalInput } from './lib/api'
import './proposals.css'

const rateLabels: Record<BudgetUnit, string> = { PER_HOUR: 'mỗi giờ', PER_SESSION: 'mỗi buổi', TOTAL: 'toàn bộ chương trình' }
const formatRate = (rate: number, unit: BudgetUnit) => `${new Intl.NumberFormat('vi-VN').format(rate)} ₫ / ${rateLabels[unit]}`
const message = (error: unknown) => error instanceof ApiError ? error.message : 'Không thể kết nối máy chủ. Kiểm tra kết nối rồi thử lại.'

function ProposalFrame({ title, children }: { title: string; children: ReactNode }) {
  return <main className="learning-page proposal-page"><Link className="form-back" to="/"><ArrowLeft size={15} /> CodeMatch</Link><div className="learning-page-heading"><div><span className="section-kicker">ĐỒNG HÀNH HỌC TẬP</span><h1>{title}</h1></div></div>{children}</main>
}

const blankInput: ProposalInput = { introduction: '', teachingApproach: '', relevantExperience: '', proposedRate: 200000, rateUnit: 'PER_SESSION', proposedSchedule: '', estimatedDuration: '', cvId: null, removeCv: false }

export function ProposalApplyPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(blankInput)
  const [error, setError] = useState('')
  const request = useQuery({ queryKey: ['learning-request', id], queryFn: () => api.learningRequest(id), enabled: Boolean(id) })
  const cvs = useQuery({ queryKey: ['developer-cvs'], queryFn: api.myCvs })
  const submit = useMutation({ mutationFn: () => api.submitProposal(id, form), onSuccess: () => navigate('/my/proposals?notice=submitted') })
  const upload = useMutation({ mutationFn: (file: File) => api.uploadCv(file), onSuccess: async (cv) => { setForm((old) => ({ ...old, cvId: cv.id })); await cvs.refetch() } })
  if (request.isLoading) return <ProposalFrame title="Gửi đề xuất"><p role="status">Đang tải yêu cầu…</p></ProposalFrame>
  if (request.isError || !request.data) return <ProposalFrame title="Không tìm thấy yêu cầu"><p role="alert">{request.error ? message(request.error) : 'Yêu cầu này hiện không khả dụng.'}</p></ProposalFrame>
  if (request.data.status !== 'OPEN') return <ProposalFrame title="Yêu cầu đã đóng"><p>Yêu cầu này không nhận đề xuất mới.</p></ProposalFrame>
  const item = request.data
  const picked = cvs.data?.find((cv) => cv.id === form.cvId)
  async function send(event: FormEvent) {
    event.preventDefault(); setError('')
    try { await submit.mutateAsync() } catch (caught) { setError(message(caught)) }
  }
  return <ProposalFrame title="Gửi đề xuất">
    <section className="proposal-context"><span className="detail-status">ĐANG MỞ</span><h2>{item.title}</h2><p>{item.learningGoal}</p><Link to={`/learning-requests/${item.id}`}>Xem yêu cầu học <ArrowRight size={14} /></Link></section>
    <form className="product-form proposal-form" onSubmit={(event) => void send(event)}>
      <label>Lời giới thiệu<textarea required minLength={30} maxLength={3000} rows={4} value={form.introduction} onChange={(e) => setForm({ ...form, introduction: e.target.value })} placeholder="Giới thiệu cách bạn có thể đồng hành với mục tiêu này…" /></label>
      <label>Phương pháp hướng dẫn<textarea required minLength={20} maxLength={3000} rows={4} value={form.teachingApproach} onChange={(e) => setForm({ ...form, teachingApproach: e.target.value })} /></label>
      <label>Kinh nghiệm liên quan<textarea required minLength={20} maxLength={2000} rows={3} value={form.relevantExperience} onChange={(e) => setForm({ ...form, relevantExperience: e.target.value })} /></label>
      <div className="proposal-fields"><label>Mức phí (VND)<input required type="number" min="1" step="1000" value={form.proposedRate} onChange={(e) => setForm({ ...form, proposedRate: Number(e.target.value) })} /></label><label>Đơn vị<select value={form.rateUnit} onChange={(e) => setForm({ ...form, rateUnit: e.target.value as BudgetUnit })}>{Object.entries(rateLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label></div>
      <label>Lịch bạn có thể hướng dẫn<input required maxLength={500} value={form.proposedSchedule} onChange={(e) => setForm({ ...form, proposedSchedule: e.target.value })} placeholder="Ví dụ: tối thứ Ba và thứ Năm" /></label>
      <label>Thời lượng dự kiến<input required maxLength={120} value={form.estimatedDuration} onChange={(e) => setForm({ ...form, estimatedDuration: e.target.value })} placeholder="Ví dụ: 4 buổi trong 1 tháng" /></label>
      <fieldset className="cv-picker"><legend>CV {item.requiresCv ? '(bắt buộc)' : '(không bắt buộc)'}</legend>
        {cvs.isLoading ? <p role="status">Đang tải CV…</p> : cvs.isError ? <p role="alert">{message(cvs.error)}</p> : <>
          {cvs.data?.length ? <div className="cv-options">{cvs.data.map((cv) => <label key={cv.id}><input type="radio" name="proposal-cv" checked={form.cvId === cv.id} onChange={() => setForm({ ...form, cvId: cv.id, removeCv: false })} /><FileText size={16} /><span>{cv.fileName}<small>{(cv.sizeBytes / 1024).toFixed(0)} KB</small></span></label>)}</div> : <p>Bạn chưa có CV. Tải PDF lên để tiếp tục.</p>}
          {picked && <p className="inline-success">CV được chọn: {picked.fileName}</p>}
          <CvUpload onUpload={(file) => upload.mutate(file)} busy={upload.isPending} />
          {upload.isError && <p role="alert" className="form-error">{message(upload.error)}</p>}
        </>}
      </fieldset>
      {(error || submit.isError) && <p role="alert" className="form-error">{error || message(submit.error)}</p>}
      {item.requiresCv && !form.cvId && <p className="form-hint" role="status">Yêu cầu này cần CV PDF trước khi gửi đề xuất.</p>}
      <button className="button button-primary" disabled={submit.isPending || upload.isPending || (item.requiresCv && !form.cvId)}>{submit.isPending ? 'Đang gửi…' : 'Gửi đề xuất'}</button>
    </form>
  </ProposalFrame>
}

function CvUpload({ onUpload, busy }: { onUpload: (file: File) => void; busy: boolean }) {
  return <label className="cv-upload"><Upload size={17} /><span>{busy ? 'Đang tải lên…' : 'Tải CV PDF lên (tối đa 5 MB)'}</span><input type="file" accept="application/pdf,.pdf" disabled={busy} onChange={(event) => { const file = event.target.files?.[0]; if (file) onUpload(file); event.currentTarget.value = '' }} /></label>
}

export function MyProposalsPage() {
  const queryClient = useQueryClient()
  const proposals = useQuery({ queryKey: ['my-proposals'], queryFn: api.myProposals })
  const cvs = useQuery({ queryKey: ['developer-cvs'], queryFn: api.myCvs })
  const upload = useMutation({ mutationFn: (file: File) => api.uploadCv(file), onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['developer-cvs'] }) })
  const replace = useMutation({ mutationFn: ({ id, file }: { id: string; file: File }) => api.replaceCv(id, file), onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['developer-cvs'] }) })
  const remove = useMutation({ mutationFn: (id: string) => api.deleteCv(id), onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['developer-cvs'] }) })
  const withdraw = useMutation({ mutationFn: (id: string) => api.withdrawProposal(id), onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['my-proposals'] }) })
  const notice = new URLSearchParams(location.search).get('notice')
  return <ProposalFrame title="Đề xuất và CV của tôi">
    {notice === 'submitted' && <p className="inline-success" role="status">Đề xuất đã được gửi.</p>}
    <section className="proposal-section"><div className="proposal-section-heading"><div><h2>CV riêng tư</h2><p>PDF tối đa 5 MB. Chỉ bạn và người học trong đề xuất liên quan có thể tải tệp.</p></div><CvUpload onUpload={(file) => upload.mutate(file)} busy={upload.isPending} /></div>
      {cvs.isLoading && <p role="status">Đang tải CV…</p>}{cvs.isError && <p role="alert" className="form-error">{message(cvs.error)}</p>}
      {cvs.data?.length === 0 && <p className="proposal-empty">Bạn chưa lưu CV nào.</p>}
      <div className="cv-list">{cvs.data?.map((cv) => <CvRow key={cv.id} cv={cv} onReplace={(file) => replace.mutate({ id: cv.id, file })} onDelete={() => remove.mutate(cv.id)} busy={replace.isPending || remove.isPending} />)}</div>
      {(upload.isError || replace.isError || remove.isError) && <p role="alert" className="form-error">{message(upload.error ?? replace.error ?? remove.error)}</p>}
    </section>
    <section className="proposal-section"><h2>Đề xuất đã gửi</h2>
      {proposals.isLoading && <p role="status">Đang tải đề xuất…</p>}{proposals.isError && <p role="alert" className="form-error">{message(proposals.error)}</p>}
      {proposals.data?.length === 0 && <p className="proposal-empty">Bạn chưa gửi đề xuất nào. <Link to="/">Khám phá yêu cầu học đang mở</Link></p>}
      <div className="proposal-list">{proposals.data?.map((proposal) => <article className="proposal-card" key={proposal.id}><div className="proposal-card-head"><div><span className={`proposal-status ${proposal.status.toLowerCase()}`}>{proposal.status === 'SUBMITTED' ? 'Đã gửi' : 'Đã rút'}</span><h3>{proposal.learningRequestTitle}</h3></div><strong>{formatRate(proposal.proposedRate, proposal.rateUnit)}</strong></div><p>{proposal.introduction}</p><div className="proposal-card-actions"><Link className="button button-outline" to={`/my/proposals/${proposal.id}/edit`}>Chỉnh sửa</Link>{proposal.status === 'SUBMITTED' && <button className="button button-outline" disabled={withdraw.isPending} onClick={() => { if (window.confirm('Rút đề xuất này?')) withdraw.mutate(proposal.id) }}>Rút đề xuất</button>}</div></article>)}</div>
      {withdraw.isError && <p role="alert" className="form-error">{message(withdraw.error)}</p>}
    </section>
  </ProposalFrame>
}

function CvRow({ cv, onReplace, onDelete, busy }: { cv: DeveloperCv; onReplace: (file: File) => void; onDelete: () => void; busy: boolean }) {
  return <article className="cv-row"><FileText size={18} /><div><strong>{cv.fileName}</strong><small>{(cv.sizeBytes / 1024).toFixed(0)} KB · cập nhật {new Date(cv.updatedAt).toLocaleDateString('vi-VN')}</small></div><label className="button button-outline">Thay PDF<input type="file" accept="application/pdf,.pdf" disabled={busy} onChange={(e) => { const file = e.target.files?.[0]; if (file) onReplace(file); e.currentTarget.value = '' }} /></label><button className="icon-button" aria-label={`Xóa ${cv.fileName}`} disabled={busy} onClick={onDelete}><X size={17} /></button></article>
}

export function ReceivedProposalsPage() {
  const { id = '' } = useParams()
  const proposals = useQuery({ queryKey: ['received-proposals', id], queryFn: () => api.receivedProposals(id), enabled: Boolean(id) })
  const download = useMutation({ mutationFn: async (proposal: Proposal) => {
    const blob = await api.downloadProposalCv(proposal.id)
    const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'ho-so-ung-vien.pdf'; anchor.click(); URL.revokeObjectURL(url)
  } })
  return <ProposalFrame title="So sánh đề xuất">
    <p className="proposal-intro">Xem cách hướng dẫn, kinh nghiệm, lịch và mức phí của từng developer. Mức phí chỉ so sánh trong cùng đơn vị.</p>
    {proposals.isLoading && <p role="status">Đang tải đề xuất…</p>}{proposals.isError && <p role="alert" className="form-error">{message(proposals.error)}</p>}
    {proposals.data?.length === 0 && <div className="proposal-empty">Chưa có developer gửi đề xuất cho yêu cầu này.</div>}
    <div className="compare-grid">{proposals.data?.map((proposal) => <article className="compare-card" key={proposal.id}>
      <div className="compare-heading"><div><span className={`proposal-status ${proposal.status.toLowerCase()}`}>{proposal.status === 'SUBMITTED' ? 'Đã gửi' : 'Đã rút'}</span><h2>{proposal.developer.displayName}</h2><p>{proposal.developer.headline}</p></div><Link to={`/developers/${proposal.developer.profileId}`}>Hồ sơ <ArrowRight size={14} /></Link></div>
      <p className="compare-bio">{proposal.developer.biography}</p><p className="compare-experience">{proposal.developer.yearsExperience} năm kinh nghiệm · {proposal.developer.skills.map((skill) => skill.name).join(', ')}</p>
      <CompareField title="Lời giới thiệu" text={proposal.introduction} /><CompareField title="Cách hướng dẫn" text={proposal.teachingApproach} /><CompareField title="Kinh nghiệm liên quan" text={proposal.relevantExperience} />
      <dl className="compare-facts"><div><dt>Mức phí</dt><dd>{formatRate(proposal.proposedRate, proposal.rateUnit)}</dd></div><div><dt>Lịch đề xuất</dt><dd>{proposal.proposedSchedule}</dd></div><div><dt>Thời lượng</dt><dd>{proposal.estimatedDuration}</dd></div></dl>
      {proposal.hasCv && <button className="button button-outline" disabled={download.isPending} onClick={() => download.mutate(proposal)}>Tải CV riêng tư</button>}
    </article>)}</div>
    {download.isError && <p role="alert" className="form-error">{message(download.error)}</p>}
    <p className="form-hint">Đề xuất chưa thể được chọn hoặc chấp nhận trong phiên bản này.</p>
  </ProposalFrame>
}

function CompareField({ title, text }: { title: string; text: string }) { return <section className="compare-field"><h3>{title}</h3><p>{text}</p></section> }

export function EditProposalPage() {
  const { id = '' } = useParams()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const proposalList = useQuery({ queryKey: ['my-proposals'], queryFn: api.myProposals })
  const proposal = proposalList.data?.find((item) => item.id === id)
  const cvs = useQuery({ queryKey: ['developer-cvs'], queryFn: api.myCvs })
  const [form, setForm] = useState<ProposalInput | null>(null)
  const [error, setError] = useState('')
  const save = useMutation({ mutationFn: (input: ProposalInput) => api.updateProposal(id, input), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['my-proposals'] }); navigate('/my/proposals') } })
  if (proposalList.isLoading) return <ProposalFrame title="Chỉnh sửa đề xuất"><p role="status">Đang tải…</p></ProposalFrame>
  if (proposalList.isError || !proposal) return <ProposalFrame title="Không tìm thấy đề xuất"><p role="alert">{proposalList.error ? message(proposalList.error) : 'Đề xuất không tồn tại hoặc thuộc tài khoản khác.'}</p></ProposalFrame>
  const values = form ?? { introduction: proposal.introduction, teachingApproach: proposal.teachingApproach, relevantExperience: proposal.relevantExperience, proposedRate: proposal.proposedRate, rateUnit: proposal.rateUnit, proposedSchedule: proposal.proposedSchedule, estimatedDuration: proposal.estimatedDuration, cvId: null, removeCv: false }
  function change<K extends keyof ProposalInput>(key: K, value: ProposalInput[K]) { setForm((old) => ({ ...(old ?? values), [key]: value })) }
  async function submit(event: FormEvent) { event.preventDefault(); setError(''); try { await save.mutateAsync(values) } catch (caught) { setError(message(caught)) } }
  return <ProposalFrame title="Chỉnh sửa đề xuất"><form className="product-form proposal-form" onSubmit={(e) => void submit(e)}>
    <label>Lời giới thiệu<textarea required minLength={30} maxLength={3000} rows={4} value={values.introduction} onChange={(e) => change('introduction', e.target.value)} /></label>
    <label>Phương pháp hướng dẫn<textarea required minLength={20} maxLength={3000} rows={4} value={values.teachingApproach} onChange={(e) => change('teachingApproach', e.target.value)} /></label>
    <label>Kinh nghiệm liên quan<textarea required minLength={20} maxLength={2000} rows={3} value={values.relevantExperience} onChange={(e) => change('relevantExperience', e.target.value)} /></label>
    <div className="proposal-fields"><label>Mức phí (VND)<input type="number" min="1" value={values.proposedRate} onChange={(e) => change('proposedRate', Number(e.target.value))} /></label><label>Đơn vị<select value={values.rateUnit} onChange={(e) => change('rateUnit', e.target.value as BudgetUnit)}>{Object.entries(rateLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label></div>
    <label>Lịch hướng dẫn<input required value={values.proposedSchedule} onChange={(e) => change('proposedSchedule', e.target.value)} /></label><label>Thời lượng<input required value={values.estimatedDuration} onChange={(e) => change('estimatedDuration', e.target.value)} /></label>
    {proposal.hasCv && <label className="remove-cv"><input type="checkbox" checked={values.removeCv} onChange={(e) => change('removeCv', e.target.checked)} /> Gỡ CV khỏi đề xuất</label>}
    {cvs.data?.length ? <label>Đổi CV đính kèm<select value={values.cvId ?? ''} onChange={(e) => { change('cvId', e.target.value || null); change('removeCv', false) }}><option value="">Giữ CV hiện tại</option>{cvs.data.map((cv) => <option value={cv.id} key={cv.id}>{cv.fileName}</option>)}</select></label> : <p>Bạn có thể quản lý CV tại <Link to="/my/proposals">Đề xuất của tôi</Link>.</p>}
    {error && <p role="alert" className="form-error">{error}</p>}<button className="button button-primary" disabled={save.isPending}>{save.isPending ? 'Đang lưu…' : 'Lưu thay đổi'}</button>
  </form></ProposalFrame>
}
