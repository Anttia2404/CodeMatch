import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, Bookmark, Check, ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { api, ApiError } from './lib/api'
import type { BudgetUnit, DiscoveryFilters, LearningFormat, LearningLevel, LearningRequest, LearningRequestInput, LearningRequestStatus, Skill } from './lib/api'
import './learning-requests.css'
import { ReportButton } from './ModerationPages'

const levelLabels: Record<LearningLevel, string> = { BEGINNER: 'Mới bắt đầu', BASIC: 'Cơ bản', INTERMEDIATE: 'Trung cấp', ADVANCED: 'Nâng cao' }
const formatLabels: Record<LearningFormat, string> = { ONLINE: 'Học online', OFFLINE: 'Học trực tiếp' }
const unitLabels: Record<BudgetUnit, string> = { PER_HOUR: 'mỗi giờ', PER_SESSION: 'mỗi buổi', TOTAL: 'toàn bộ' }
const statusLabels: Record<LearningRequestStatus, string> = { DRAFT: 'Bản nháp', OPEN: 'Đang mở', CLOSED: 'Đã đóng', MATCHED: 'Đã chọn developer' }

function formatMoney(min: number | null, max: number | null, unit: BudgetUnit | null) {
  if (min == null || max == null || unit == null) return 'Thỏa thuận ngân sách'
  const money = new Intl.NumberFormat('vi-VN').format
  return `${money(min)}–${money(max)} ₫ / ${unitLabels[unit]}`
}

function dateLabel(value: string | null) {
  return value ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(new Date(value)) : 'Chưa đăng'
}

function errorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : 'Không thể kết nối máy chủ. Kiểm tra kết nối rồi thử lại.'
}

export function RequestDiscovery({ authenticated, searchValue = '', onSearchChange = () => undefined, selectedId, detailPanel = null }: {
  authenticated: boolean; searchValue?: string; onSearchChange?: (value: string) => void; selectedId?: string; detailPanel?: ReactNode
}) {
  const client = useQueryClient()
  const [filters, setFilters] = useState<DiscoveryFilters>({ q: '', skillIds: [], page: 0, size: 12, sort: 'NEWEST' })
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [message, setMessage] = useState('')
  const skills = useQuery({ queryKey: ['skills'], queryFn: api.skills, staleTime: 300_000 })
  const budgetNeedsUnit = Boolean(filters.minBudget || filters.maxBudget) && !filters.budgetUnit
  const queryFilters = budgetNeedsUnit ? { ...filters, minBudget: '', maxBudget: '' } : filters
  const requests = useQuery({
    queryKey: ['learning-requests', { ...filters, q: debouncedQuery }],
    queryFn: () => api.discoverRequests({ ...queryFilters, q: debouncedQuery }),
    retry: 1,
  })
  const saved = useQuery({ queryKey: ['saved-requests'], queryFn: api.savedRequests, enabled: authenticated })
  const saveMutation = useMutation({
    mutationFn: async (request: LearningRequest) => {
      const alreadySaved = saved.data?.some((item) => item.id === request.id)
      if (alreadySaved) await api.unsaveRequest(request.id)
      else await api.saveRequest(request.id)
      return alreadySaved
    },
    onSuccess: (wasSaved) => {
      setMessage(wasSaved ? 'Đã bỏ lưu yêu cầu.' : 'Đã lưu yêu cầu.')
      void client.invalidateQueries({ queryKey: ['saved-requests'] })
    },
  })

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(filters.q ?? ''), 250)
    return () => window.clearTimeout(timer)
  }, [filters.q])

  function update(patch: Partial<DiscoveryFilters>) {
    setMessage('')
    setFilters((current) => ({ ...current, ...patch, page: patch.page ?? 0 }))
  }

  useEffect(() => update({ q: searchValue }), [searchValue])

  return <div className="discovery-panel bordful-board-grid">
    <aside className="board-rail" aria-label="Danh sách yêu cầu và kỹ năng">
      <Link className="rail-current" to="/">Yêu cầu mới <span>{requests.data?.totalElements ?? '—'}</span></Link>
      <Link to="/saved-requests">Đã lưu</Link>
      <Link to={authenticated ? '/my/learning-requests' : '/login'}>Yêu cầu của tôi</Link>
      <h2>Kỹ năng</h2>
      {skills.data?.map((skill) => <label className="rail-skill" key={skill.id}><input type="checkbox" checked={(filters.skillIds ?? []).includes(skill.id)} onChange={(event) => update({ skillIds: event.target.checked ? [...(filters.skillIds ?? []), skill.id] : (filters.skillIds ?? []).filter((id) => id !== skill.id) })} /><span>{skill.name}</span></label>)}
      {skills.isError && <span className="rail-note">Không tải được kỹ năng.</span>}
      <div className="rail-budget"><label>Ngân sách từ<input aria-label="Ngân sách từ (₫)" type="number" min="0" step="1000" value={filters.minBudget ?? ''} onChange={(event) => update({ minBudget: event.target.value })} /></label><label>Đến<input aria-label="Ngân sách đến (₫)" type="number" min="0" step="1000" value={filters.maxBudget ?? ''} onChange={(event) => update({ maxBudget: event.target.value })} /></label></div>
    </aside>
    <section className="board-center" aria-label="Yêu cầu học">
      <div className="board-filterbar">
        <label className="filter-chip"><span>Trình độ</span><select aria-label="Mức hiện tại" value={filters.level ?? ''} onChange={(event) => update({ level: event.target.value as LearningLevel | '' })}><option value="">Tất cả</option>{Object.entries(levelLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="filter-chip"><span>Hình thức</span><select aria-label="Hình thức" value={filters.format ?? ''} onChange={(event) => update({ format: event.target.value as LearningFormat | '' })}><option value="">Tất cả</option><option value="ONLINE">Online</option><option value="OFFLINE">Trực tiếp</option></select></label>
        <label className="filter-chip"><span>Ngân sách</span><select aria-label="Đơn vị ngân sách" value={filters.budgetUnit ?? ''} onChange={(event) => update({ budgetUnit: event.target.value as BudgetUnit | '' })}><option value="">Tất cả</option>{Object.entries(unitLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="filter-chip"><span>CV</span><select aria-label="Yêu cầu CV" value={filters.requiresCv === true ? 'true' : filters.requiresCv === false ? 'false' : ''} onChange={(event) => update({ requiresCv: event.target.value === '' ? '' : event.target.value === 'true' })}><option value="">Không lọc</option><option value="true">Cần CV</option><option value="false">Không cần CV</option></select></label>
        <button className="clear-filters" type="button" onClick={() => { setFilters({ q: '', skillIds: [], page: 0, size: 12, sort: 'NEWEST' }); onSearchChange(''); setDebouncedQuery('') }}><X size={14} /><span>Xóa lọc</span></button>
      </div>
      {budgetNeedsUnit && <p className="filter-hint" role="status">Chọn đơn vị ngân sách để áp dụng khoảng giá.</p>}
      <div className="board-resultsbar"><span className="live-dot" />{requests.isSuccess ? `${requests.data.totalElements} yêu cầu` : 'Đang tải yêu cầu'}<label>Sắp xếp<select aria-label="Sắp xếp" value={filters.sort} onChange={(event) => update({ sort: event.target.value as 'NEWEST' | 'OLDEST' })}><option value="NEWEST">Mới nhất</option><option value="OLDEST">Cũ nhất</option></select></label></div>
      <div className="discovery-results" aria-live="polite" aria-busy={requests.isLoading}>
        {requests.isLoading && <div className="request-skeletons" aria-label="Đang tải yêu cầu">{Array.from({ length: 5 }, (_, index) => <div className="request-skeleton" key={index}><span /><span /><span /></div>)}</div>}
        {requests.isError && <div className="request-message request-error" role="alert"><strong>Chưa tải được yêu cầu học</strong><span>{errorMessage(requests.error)}</span><button className="button button-outline" onClick={() => void requests.refetch()}>Thử lại</button></div>}
        {requests.isSuccess && requests.data.content.length === 0 && <div className="request-message request-empty"><Search size={22} /><strong>Chưa có yêu cầu phù hợp</strong><span>Thử bỏ bớt bộ lọc hoặc tìm bằng từ khóa khác.</span></div>}
        {requests.isSuccess && requests.data.content.map((request) => {
          const isSaved = saved.data?.some((item) => item.id === request.id) ?? false
          return <RequestCard key={request.id} request={request} authenticated={authenticated} isSaved={isSaved} selected={request.id === selectedId}
            onToggleSave={() => { setMessage(''); saveMutation.mutate(request) }} saving={saveMutation.isPending} />
        })}
      </div>
      {requests.data && requests.data.totalPages > 1 && <nav className="pagination" aria-label="Phân trang yêu cầu học"><button disabled={requests.data.page === 0} onClick={() => update({ page: requests.data!.page - 1 })}><ChevronLeft size={16} /> Trước</button><span>{requests.data.page + 1} / {requests.data.totalPages}</span><button disabled={requests.data.page + 1 >= requests.data.totalPages} onClick={() => update({ page: requests.data!.page + 1 })}>Sau <ChevronRight size={16} /></button></nav>}
    </section>
    <aside className="board-detail" aria-label="Chi tiết yêu cầu">{detailPanel}</aside>
    {message && <p className="inline-success" role="status"><Check size={16} />{message}</p>}
    {saveMutation.isError && <p className="form-error" role="alert">{errorMessage(saveMutation.error)}</p>}
  </div>
}

function RequestCard({ request, authenticated, isSaved, onToggleSave, saving, selected }: {
  request: LearningRequest; authenticated: boolean; isSaved: boolean; onToggleSave: () => void; saving: boolean; selected: boolean
}) {
  return <article className={`request-card live-request-card bordful-request-row ${selected ? 'is-selected' : ''}`}>
    <span className="request-mark" aria-hidden="true">{request.skills[0]?.name.slice(0, 2).toUpperCase() ?? '↗'}</span>
    <div className="request-main">
      <div className="request-title-row"><Link className="request-title" to={`/learning-requests/${request.id}`}>{request.title}</Link>
        {authenticated ? <button className={`save-button ${isSaved ? 'is-saved' : ''}`} onClick={onToggleSave} disabled={saving} aria-label={isSaved ? 'Bỏ lưu yêu cầu' : 'Lưu yêu cầu'} aria-pressed={isSaved}><Bookmark size={18} fill={isSaved ? 'currentColor' : 'none'} /></button>
          : <Link className="save-login-link" to="/login" aria-label="Đăng nhập để lưu yêu cầu"><Bookmark size={18} /></Link>}
      </div>
      <p className="request-description">{request.skills.map((skill) => skill.name).join(' · ')}{request.skills.length ? ' · ' : ''}{request.preferredFormat === 'ONLINE' ? 'Online' : request.city}</p>
    </div>
    <div className="request-price"><strong>{formatMoney(request.budgetMin, request.budgetMax, request.budgetUnit)}</strong><span>{dateLabel(request.publishedAt)}</span></div>
  </article>
}

type FormFields = Omit<LearningRequestInput, 'budgetMin' | 'budgetMax' | 'city' | 'budgetUnit'> & { budgetMin: string; budgetMax: string; city: string; budgetUnit: BudgetUnit }
const emptyForm: FormFields = {
  title: '', description: '', learningGoal: '', currentLevel: 'BEGINNER', preferredFormat: 'ONLINE', city: '',
  budgetMin: '', budgetMax: '', budgetUnit: 'PER_SESSION', preferredSchedule: '', expectedDuration: '',
  teachingExpectations: '', requiresCv: false, skillIds: [],
}

function toInput(form: FormFields): LearningRequestInput {
  const hasBudget = form.budgetMin !== '' || form.budgetMax !== ''
  return { ...form, city: form.preferredFormat === 'OFFLINE' ? form.city.trim() : null,
    budgetMin: hasBudget ? Number(form.budgetMin) : null, budgetMax: hasBudget ? Number(form.budgetMax) : null,
    budgetUnit: hasBudget ? form.budgetUnit : null, skillIds: form.skillIds }
}

export function LearningRequestFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const client = useQueryClient()
  const edit = Boolean(id)
  const [form, setForm] = useState<FormFields>(emptyForm)
  const [ready, setReady] = useState(!edit)
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const skills = useQuery({ queryKey: ['skills'], queryFn: api.skills, staleTime: 300_000 })
  const existing = useQuery({ queryKey: ['learning-request', id], queryFn: () => api.learningRequest(id!), enabled: edit })

  useEffect(() => {
    if (!existing.data) return
    if (existing.data.status === 'CLOSED' || existing.data.status === 'MATCHED') { setError('Yêu cầu đã đóng hoặc đã chọn developer nên không thể chỉnh sửa.'); setReady(true); return }
    const item = existing.data
    setForm({ title: item.title, description: item.description, learningGoal: item.learningGoal, currentLevel: item.currentLevel,
      preferredFormat: item.preferredFormat, city: item.city ?? '', budgetMin: item.budgetMin == null ? '' : String(item.budgetMin),
      budgetMax: item.budgetMax == null ? '' : String(item.budgetMax), budgetUnit: item.budgetUnit ?? 'PER_SESSION',
      preferredSchedule: item.preferredSchedule, expectedDuration: item.expectedDuration,
      teachingExpectations: item.teachingExpectations, requiresCv: item.requiresCv, skillIds: item.skills.map((skill) => skill.id) })
    setReady(true)
  }, [existing.data])

  useEffect(() => {
    if (!dirty) return
    const protect = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', protect)
    return () => window.removeEventListener('beforeunload', protect)
  }, [dirty])

  function change<K extends keyof FormFields>(key: K, value: FormFields[K]) {
    setDirty(true); setError(''); setFieldErrors((current) => ({ ...current, [key]: '' }))
    setForm((current) => ({ ...current, [key]: value }))
  }

  function validate() {
    const errors: Record<string, string> = {}
    if (form.title.trim().length < 8) errors.title = 'Tiêu đề cần ít nhất 8 ký tự.'
    if (form.description.trim().length < 30) errors.description = 'Mô tả cần ít nhất 30 ký tự.'
    if (form.learningGoal.trim().length < 10) errors.learningGoal = 'Mục tiêu cần ít nhất 10 ký tự.'
    if (!form.preferredSchedule.trim()) errors.preferredSchedule = 'Hãy mô tả thời gian phù hợp.'
    if (!form.expectedDuration.trim()) errors.expectedDuration = 'Hãy cho biết thời lượng dự kiến.'
    if (form.teachingExpectations.trim().length < 8) errors.teachingExpectations = 'Hãy mô tả cách developer có thể hỗ trợ.'
    if (!form.skillIds.length) errors.skillIds = 'Chọn ít nhất một kỹ năng.'
    if (form.preferredFormat === 'OFFLINE' && !form.city.trim()) errors.city = 'Nhập thành phố muốn học trực tiếp.'
    const min = form.budgetMin === '' ? null : Number(form.budgetMin)
    const max = form.budgetMax === '' ? null : Number(form.budgetMax)
    if ((min == null) !== (max == null)) errors.budgetMin = 'Nhập cả ngân sách thấp nhất và cao nhất, hoặc để trống cả hai.'
    if (min != null && (min < 0 || max == null || max < min)) errors.budgetMax = 'Ngân sách cao nhất phải bằng hoặc lớn hơn mức thấp nhất.'
    if (min != null && max != null && (!Number.isSafeInteger(min) || !Number.isSafeInteger(max))) errors.budgetMin = 'Ngân sách cần là số tiền VND hợp lệ.'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function save(publish: boolean) {
    if (!validate()) { setError('Vui lòng kiểm tra lại các thông tin được đánh dấu.'); return }
    setBusy(true); setError('')
    try {
      const input = toInput(form)
      const saved = edit ? await api.updateLearningRequest(id!, input) : await api.createLearningRequest(input)
      if (publish) {
        const published = saved.status === 'OPEN' ? saved : await api.publishLearningRequest(saved.id)
        await client.invalidateQueries({ queryKey: ['learning-requests'] })
        await client.invalidateQueries({ queryKey: ['my-learning-requests'] })
        setDirty(false); navigate(`/learning-requests/${published.id}`, { state: { notice: 'Yêu cầu đã được đăng.' } })
      } else {
        await client.invalidateQueries({ queryKey: ['my-learning-requests'] })
        setDirty(false); navigate('/my/learning-requests?notice=draft')
      }
    } catch (caught) {
      setError(errorMessage(caught))
      if (caught instanceof ApiError) setFieldErrors(caught.fields)
    } finally { setBusy(false) }
  }

  if (edit && existing.isLoading || skills.isLoading || !ready) return <FormShell title="Yêu cầu học"><p role="status">Đang tải thông tin…</p></FormShell>
  if (edit && existing.isError) return <FormShell title="Yêu cầu học"><ErrorBox error={existing.error} onRetry={() => void existing.refetch()} /></FormShell>

  return <FormShell title={edit ? 'Chỉnh sửa yêu cầu học' : 'Tạo yêu cầu học'}>
    {skills.isError ? <ErrorBox error={skills.error} onRetry={() => void skills.refetch()} /> : <form className="learning-form" onSubmit={(event) => { event.preventDefault(); void save(false) }}>
      <section className="learning-form-section"><h2>Bạn muốn học điều gì?</h2>
        <Field label="Tiêu đề yêu cầu" error={fieldErrors.title}><input value={form.title} maxLength={140} onChange={(event) => change('title', event.target.value)} placeholder="Ví dụ: Xây API đầu tiên với Spring Boot" /></Field>
        <Field label="Mô tả ngắn" error={fieldErrors.description}><textarea rows={3} maxLength={3000} value={form.description} onChange={(event) => change('description', event.target.value)} placeholder="Bạn đang vướng ở đâu? Bạn muốn developer hiểu điều gì về bối cảnh của mình?" /></Field>
        <Field label="Mục tiêu học tập" error={fieldErrors.learningGoal}><textarea rows={3} maxLength={2000} value={form.learningGoal} onChange={(event) => change('learningGoal', event.target.value)} placeholder="Sau khi học, bạn muốn tự làm được điều gì?" /></Field>
        <Field label="Kỹ năng cần hỗ trợ" error={fieldErrors.skillIds}><div className="skill-check-grid">{(skills.data ?? []).map((skill) => <label key={skill.id} className="skill-check"><input type="checkbox" checked={form.skillIds.includes(skill.id)} onChange={(event) => change('skillIds', event.target.checked ? [...form.skillIds, skill.id] : form.skillIds.filter((id) => id !== skill.id))} /><span>{skill.name}</span></label>)}</div></Field>
        <Field label="Trình độ hiện tại"><select value={form.currentLevel} onChange={(event) => change('currentLevel', event.target.value as LearningLevel)}>{Object.entries(levelLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
      </section>
      <section className="learning-form-section"><h2>Cách học phù hợp với bạn</h2>
        <Field label="Hình thức"><select value={form.preferredFormat} onChange={(event) => change('preferredFormat', event.target.value as LearningFormat)}><option value="ONLINE">Online</option><option value="OFFLINE">Trực tiếp</option></select></Field>
        {form.preferredFormat === 'OFFLINE' && <Field label="Thành phố" error={fieldErrors.city}><input value={form.city} maxLength={100} onChange={(event) => change('city', event.target.value)} placeholder="Ví dụ: Đà Nẵng" /></Field>}
        <Field label="Lịch học mong muốn" error={fieldErrors.preferredSchedule}><input value={form.preferredSchedule} maxLength={500} onChange={(event) => change('preferredSchedule', event.target.value)} placeholder="Ví dụ: Tối thứ 3 hoặc cuối tuần" /></Field>
        <Field label="Thời lượng dự kiến" error={fieldErrors.expectedDuration}><input value={form.expectedDuration} maxLength={120} onChange={(event) => change('expectedDuration', event.target.value)} placeholder="Ví dụ: 4 buổi, mỗi buổi 90 phút" /></Field>
      </section>
      <section className="learning-form-section"><h2>Ngân sách dự kiến</h2>
        <p className="section-help">Nhập số tiền bằng VND. Bạn có thể để trống nếu muốn trao đổi sau.</p>
        <div className="budget-fields"><Field label="Tối thiểu (₫)" error={fieldErrors.budgetMin}><input type="number" min="0" step="1000" value={form.budgetMin} onChange={(event) => change('budgetMin', event.target.value)} /></Field>
          <Field label="Tối đa (₫)" error={fieldErrors.budgetMax}><input type="number" min="0" step="1000" value={form.budgetMax} onChange={(event) => change('budgetMax', event.target.value)} /></Field>
          <Field label="Đơn vị"><select value={form.budgetUnit} onChange={(event) => change('budgetUnit', event.target.value as BudgetUnit)}>{Object.entries(unitLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
        </div>
      </section>
      <section className="learning-form-section"><h2>Điều bạn mong đợi ở developer</h2>
        <Field label="Cách hướng dẫn phù hợp" error={fieldErrors.teachingExpectations}><textarea rows={3} maxLength={1000} value={form.teachingExpectations} onChange={(event) => change('teachingExpectations', event.target.value)} placeholder="Ví dụ: giải thích từng bước, có bài tập thực hành" /></Field>
        <label className="toggle-field"><input type="checkbox" checked={form.requiresCv} onChange={(event) => change('requiresCv', event.target.checked)} /><span><strong>Yêu cầu developer gửi CV</strong><small>CV chưa được tải lên ở giai đoạn này.</small></span></label>
      </section>
      <section className="learning-form-section request-preview"><h2>Xem lại yêu cầu</h2><RequestPreview form={form} skills={skills.data ?? []} /></section>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="form-actions"><Link className="button button-outline" to="/my/learning-requests"><ArrowLeft size={16} /> Quay lại</Link>
        <button className="button button-outline" disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu bản nháp'}</button>
        <button className="button button-primary" type="button" disabled={busy} onClick={() => void save(true)}>{busy ? 'Đang xử lý…' : edit && existing.data?.status === 'OPEN' ? 'Lưu thay đổi' : 'Đăng yêu cầu'} <ArrowRight size={16} /></button>
      </div>
    </form>}
  </FormShell>
}

function RequestPreview({ form, skills }: { form: FormFields; skills: Skill[] }) {
  return <article className="preview-card"><strong>{form.title || 'Tiêu đề yêu cầu'}</strong><p>{form.description || 'Mô tả yêu cầu sẽ xuất hiện ở đây.'}</p>
    <div className="tag-list">{form.skillIds.map((id) => <span className="skill-tag" key={id}>{skills.find((skill) => skill.id === id)?.name ?? 'Kỹ năng'}</span>)}</div>
    <span className="preview-meta">{levelLabels[form.currentLevel]} · {formatLabels[form.preferredFormat]} · {form.expectedDuration || 'Thời lượng chưa chọn'}</span>
    <strong className="preview-budget">{formatMoney(form.budgetMin === '' ? null : Number(form.budgetMin), form.budgetMax === '' ? null : Number(form.budgetMax), form.budgetMin === '' || form.budgetMax === '' ? null : form.budgetUnit)}</strong>
  </article>
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return <label className="learning-field"><span>{label}</span>{children}{error && <small className="field-error" role="alert">{error}</small>}</label>
}

function FormShell({ title, children }: { title: string; children: ReactNode }) {
  return <main className="learning-page"><Link className="form-back" to="/"><ArrowLeft size={15} /> CodeMatch</Link><div className="learning-page-heading"><div><span className="section-kicker">HỌC THEO MỤC TIÊU CỦA BẠN</span><h1>{title}</h1><p>Mô tả rõ điều bạn muốn học để developer phù hợp có thể đồng hành.</p></div></div>{children}</main>
}

export function RequestDetailPage({ authenticated, panel = false }: { authenticated: boolean; panel?: boolean }) {
  const { id = '' } = useParams()
  const client = useQueryClient()
  const location = useLocation()
  const request = useQuery({ queryKey: ['learning-request', id], queryFn: () => api.learningRequest(id), enabled: Boolean(id) })
  const saved = useQuery({ queryKey: ['saved-requests'], queryFn: api.savedRequests, enabled: authenticated })
  const toggle = useMutation({ mutationFn: async () => saved.data?.some((item) => item.id === id) ? api.unsaveRequest(id) : api.saveRequest(id),
    onSuccess: () => void client.invalidateQueries({ queryKey: ['saved-requests'] }) })
  const notice = (location.state as { notice?: string } | null)?.notice
  if (panel && request.isLoading) return <div className="bordful-detail-content detail-panel-state" role="status">Đang tải yêu cầu…</div>
  if (panel && request.isError) return <div className="bordful-detail-content detail-panel-state"><ErrorBox error={request.error} onRetry={() => void request.refetch()} /></div>
  if (panel && !request.data) return <div className="bordful-detail-content detail-panel-state">Yêu cầu này hiện không khả dụng.</div>
  if (request.isLoading) return <FormShell title="Chi tiết yêu cầu"><p role="status">Đang tải yêu cầu…</p></FormShell>
  if (request.isError) return <FormShell title="Không tìm thấy yêu cầu"><ErrorBox error={request.error} onRetry={() => void request.refetch()} /></FormShell>
  if (!request.data) return <FormShell title="Không tìm thấy yêu cầu"><p>Yêu cầu này hiện không khả dụng.</p></FormShell>
  const item = request.data
  return <main className={panel ? 'request-detail-page bordful-detail-content' : 'learning-page request-detail-page'}>{!panel && <Link className="form-back" to="/"><ArrowLeft size={15} /> Khám phá yêu cầu</Link>}
    {notice && <p className="inline-success" role="status"><Check size={16} />{notice}</p>}
    <div className="detail-header"><div><span className="detail-status">{statusLabels[item.status]}</span><h1>{item.title}</h1><p className="detail-published">Đăng ngày {dateLabel(item.publishedAt)}</p></div>
      {item.status === 'OPEN' && (authenticated ? <button className="button button-outline" onClick={() => toggle.mutate()} disabled={toggle.isPending}><Bookmark size={16} fill={saved.data?.some((savedItem) => savedItem.id === id) ? 'currentColor' : 'none'} />{saved.data?.some((savedItem) => savedItem.id === id) ? 'Đã lưu' : 'Lưu yêu cầu'}</button>
        : <Link className="button button-outline" to="/login">Đăng nhập để lưu</Link>)}
    </div>
    {authenticated && <ReportButton targetType="LEARNING_REQUEST" targetId={item.id} />}
    {toggle.isError && <p className="form-error" role="alert">{errorMessage(toggle.error)}</p>}
    <div className="detail-layout"><article className="detail-content">
      <DetailSection title="Mục tiêu học tập"><p>{item.learningGoal}</p></DetailSection>
      <DetailSection title="Mô tả"><p className="detail-body">{item.description}</p></DetailSection>
      <DetailSection title="Kỹ năng cần hỗ trợ"><div className="tag-list">{item.skills.map((skill) => <span className="skill-tag" key={skill.id}>{skill.name}</span>)}</div></DetailSection>
      <DetailSection title="Điều người học mong đợi"><p>{item.teachingExpectations}</p></DetailSection>
      <DetailSection title="Lịch học"><p>{item.preferredSchedule}</p><p>{item.expectedDuration}</p></DetailSection>
    </article><aside className="detail-aside">
      <div className="detail-fact"><small>Trình độ hiện tại</small><strong>{levelLabels[item.currentLevel]}</strong></div>
      <div className="detail-fact"><small>Hình thức</small><strong>{formatLabels[item.preferredFormat]}{item.city ? ` · ${item.city}` : ''}</strong></div>
      <div className="detail-fact"><small>Ngân sách · VND</small><strong>{formatMoney(item.budgetMin, item.budgetMax, item.budgetUnit)}</strong></div>
      <div className="detail-fact"><small>CV developer</small><strong>{item.requiresCv ? 'Yêu cầu CV' : 'Không yêu cầu CV'}</strong></div>
      {item.status === 'OPEN' && (authenticated ? <Link className="button button-primary" to={`/learning-requests/${item.id}/proposals/new`}>Gửi đề xuất đồng hành <ArrowRight size={15} /></Link> : <Link className="button button-primary" to="/login">Đăng nhập để gửi đề xuất</Link>)}
    </aside></div>
  </main>
}

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return <section className="detail-section"><h2>{title}</h2>{children}</section>
}

const dashboardTabs: Array<{ label: string; value: LearningRequestStatus | undefined }> = [
  { label: 'Tất cả', value: undefined }, { label: 'Bản nháp', value: 'DRAFT' }, { label: 'Đang mở', value: 'OPEN' }, { label: 'Đã đóng', value: 'CLOSED' }, { label: 'Đã chọn developer', value: 'MATCHED' },
]

export function LearnerDashboardPage() {
  const client = useQueryClient()
  const location = useLocation()
  const [status, setStatus] = useState<LearningRequestStatus | undefined>()
  const [page, setPage] = useState(0)
  const requests = useQuery({ queryKey: ['my-learning-requests', status, page], queryFn: () => api.myLearningRequests(status, page) })
  const action = useMutation({ mutationFn: ({ id, kind }: { id: string; kind: 'publish' | 'close' }) => kind === 'publish' ? api.publishLearningRequest(id) : api.closeLearningRequest(id),
    onSuccess: () => { void client.invalidateQueries({ queryKey: ['my-learning-requests'] }); void client.invalidateQueries({ queryKey: ['learning-requests'] }) } })
  const notice = new URLSearchParams(location.search).get('notice')
  return <main className="learning-page dashboard-page"><div className="learning-page-heading"><div><span className="section-kicker">GÓC HỌC TẬP</span><h1>Yêu cầu học của tôi</h1><p>Theo dõi yêu cầu nháp, đang mở và đã đóng.</p></div><Link className="button button-primary" to="/learning-requests/new">Tạo yêu cầu học <ArrowRight size={16} /></Link></div>
    <div className="dashboard-links"><Link to="/saved-requests">Yêu cầu đã lưu <ArrowRight size={15} /></Link><Link to="/my/proposals">Đề xuất và CV của tôi <ArrowRight size={15} /></Link></div>
    {notice === 'draft' && <p role="status" className="inline-success"><Check size={16} />Đã lưu bản nháp.</p>}
    <div className="dashboard-tabs" role="tablist" aria-label="Lọc yêu cầu theo trạng thái">{dashboardTabs.map((tab) => <button key={tab.label} role="tab" aria-selected={status === tab.value} className={status === tab.value ? 'is-active' : ''} onClick={() => { setStatus(tab.value); setPage(0) }}>{tab.label}</button>)}</div>
    {requests.isLoading && <div className="request-skeletons">{Array.from({ length: 3 }, (_, index) => <div className="request-skeleton" key={index}><span /><span /><span /></div>)}</div>}
    {requests.isError && <ErrorBox error={requests.error} onRetry={() => void requests.refetch()} />}
    {requests.isSuccess && requests.data.content.length === 0 && <div className="request-message request-empty"><strong>{status ? `Chưa có yêu cầu ${statusLabels[status].toLowerCase()}` : 'Bạn chưa tạo yêu cầu học nào'}</strong><span>Tạo yêu cầu để mô tả mục tiêu học tập và tìm developer đồng hành.</span><Link className="button button-primary" to="/learning-requests/new">Tạo yêu cầu học</Link></div>}
    {requests.data?.content.map((item) => <DashboardRequest key={item.id} item={item} onAction={(kind) => action.mutate({ id: item.id, kind })} busy={action.isPending} />)}
    {action.isError && <p className="form-error" role="alert">{errorMessage(action.error)}</p>}
    {requests.data && requests.data.totalPages > 1 && <Pagination page={page} totalPages={requests.data.totalPages} total={requests.data.totalElements} onChange={setPage} />}
  </main>
}

function DashboardRequest({ item, onAction, busy }: { item: LearningRequest; onAction: (kind: 'publish' | 'close') => void; busy: boolean }) {
  return <article className="dashboard-request"><div className="dashboard-request-main"><span className={`status-pill status-${item.status.toLowerCase()}`}>{statusLabels[item.status]}</span><h2>{item.status === 'CLOSED' ? item.title : <Link to={item.status === 'DRAFT' ? `/learning-requests/${item.id}/edit` : `/learning-requests/${item.id}`}>{item.title}</Link>}</h2><p>{item.description}</p><div className="tag-list">{item.skills.map((skill) => <span className="skill-tag" key={skill.id}>{skill.name}</span>)}</div></div>
    <div className="dashboard-request-actions">{(item.status === 'DRAFT' || item.status === 'OPEN') && <Link className="button button-outline" to={`/learning-requests/${item.id}/edit`}>Chỉnh sửa</Link>}{item.status === 'DRAFT' && <button className="button button-primary" disabled={busy} onClick={() => onAction('publish')}>Đăng yêu cầu</button>}{item.status === 'OPEN' && <><Link className="button button-outline" to={`/my/learning-requests/${item.id}/proposals`}>Xem đề xuất</Link><Link className="button button-outline" to={`/learning-requests/${item.id}`}>Xem công khai</Link><button className="text-action" disabled={busy} onClick={() => onAction('close')}>Đóng yêu cầu</button></>}{(item.status === 'CLOSED' || item.status === 'MATCHED') && <Link className="button button-outline" to={`/my/learning-requests/${item.id}/proposals`}>Xem đề xuất</Link>}{item.status === 'MATCHED' && <Link className="button button-primary" to={`/my/learning-requests/${item.id}/match`}>Xem developer đã chọn</Link>}</div>
  </article>
}

export function SavedRequestsPage() {
  const client = useQueryClient()
  const saved = useQuery({ queryKey: ['saved-requests'], queryFn: api.savedRequests })
  const remove = useMutation({ mutationFn: api.unsaveRequest, onSuccess: () => void client.invalidateQueries({ queryKey: ['saved-requests'] }) })
  return <main className="learning-page"><Link className="form-back" to="/"><ArrowLeft size={15} /> Khám phá yêu cầu</Link><div className="learning-page-heading"><div><span className="section-kicker">DANH SÁCH CỦA BẠN</span><h1>Yêu cầu đã lưu</h1><p>Những yêu cầu bạn muốn xem lại.</p></div></div>
    {saved.isLoading && <p role="status">Đang tải danh sách…</p>}{saved.isError && <ErrorBox error={saved.error} onRetry={() => void saved.refetch()} />}
    {saved.isSuccess && saved.data.length === 0 && <div className="request-message request-empty"><Bookmark size={22} /><strong>Chưa có yêu cầu được lưu</strong><span>Lưu yêu cầu đang mở để xem lại sau.</span><Link className="button button-primary" to="/">Khám phá yêu cầu</Link></div>}
    {saved.data?.map((item) => <article className="dashboard-request saved-request" key={item.id}><div className="dashboard-request-main"><span className={`status-pill status-${item.status.toLowerCase()}`}>{statusLabels[item.status]}</span><h2>{item.status === 'OPEN' ? <Link to={`/learning-requests/${item.id}`}>{item.title}</Link> : item.title}</h2><p>{item.description}</p><div className="tag-list">{item.skills.map((skill) => <span className="skill-tag" key={skill.id}>{skill.name}</span>)}</div>{(item.status === 'CLOSED' || item.status === 'MATCHED') && <p className="closed-note">{item.status === 'MATCHED' ? 'Người học đã chọn developer; yêu cầu không nhận thêm đề xuất.' : 'Yêu cầu này đã đóng; bạn vẫn có thể xem thông tin đã lưu.'}</p>}</div><div className="dashboard-request-actions">{item.status === 'OPEN' && <Link className="button button-outline" to={`/learning-requests/${item.id}`}>Xem chi tiết</Link>}<button className="text-action" disabled={remove.isPending} onClick={() => remove.mutate(item.id)}>Bỏ lưu</button></div></article>)}
    {remove.isError && <p className="form-error" role="alert">{errorMessage(remove.error)}</p>}
  </main>
}

function Pagination({ page, totalPages, total, onChange }: { page: number; totalPages: number; total: number; onChange: (page: number) => void }) {
  return <nav className="pagination" aria-label="Phân trang"><button disabled={page === 0} onClick={() => onChange(page - 1)}><ChevronLeft size={16} /> Trang trước</button><span>Trang {page + 1} / {totalPages} · {total} yêu cầu</span><button disabled={page + 1 >= totalPages} onClick={() => onChange(page + 1)}>Trang sau <ChevronRight size={16} /></button></nav>
}

function ErrorBox({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return <div className="request-message request-error" role="alert"><strong>Không tải được dữ liệu</strong><span>{errorMessage(error)}</span><button className="button button-outline" onClick={onRetry}>Thử lại</button></div>
}
