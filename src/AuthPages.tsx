import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { api, ApiError } from './lib/api'
import type { DeveloperProfile, ProfileInput, Skill } from './lib/api'
import { ReportButton } from './ModerationPages'
import { CodeMatchMark } from './CodeMatchBrand'

function PageFrame({ title, children }: { title: string; children: ReactNode }) {
  return <main className="form-page"><section className="form-card"><Link to="/" className="auth-brand"><CodeMatchMark size={16} /><span>CodeMatch</span></Link><h1>{title}</h1>{children}</section></main>
}

function problem(error: unknown) { return error instanceof ApiError ? error.message : 'Không thể kết nối máy chủ. Vui lòng thử lại.' }

export function RegisterPage() {
  const navigate = useNavigate(); const client = useQueryClient(); const [error, setError] = useState(''); const [busy, setBusy] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); const data = new FormData(event.currentTarget)
    const password = String(data.get('password') ?? '')
    if (password.length < 12) { setError('Mật khẩu cần có ít nhất 12 ký tự.'); return }
    if (password !== data.get('confirmPassword')) { setError('Mật khẩu xác nhận chưa khớp.'); return }
    setBusy(true)
    try { const credentials = { email: String(data.get('email')), password }; await api.register({ ...credentials, displayName: String(data.get('displayName')) }); const account = await api.login(credentials); client.setQueryData(['account'], account); navigate('/account') }
    catch (caught) { setError(problem(caught)) } finally { setBusy(false) }
  }
  return <PageFrame title="Tạo tài khoản"><form onSubmit={submit} className="product-form" noValidate>
    <label>Tên hiển thị<input name="displayName" autoComplete="name" required minLength={2} maxLength={80} /></label>
    <label>Email<input name="email" type="email" autoComplete="email" required maxLength={254} /></label>
    <label>Mật khẩu<input name="password" type="password" autoComplete="new-password" required minLength={12} maxLength={64} /></label>
    <label>Xác nhận mật khẩu<input name="confirmPassword" type="password" autoComplete="new-password" required /></label>
    {error && <p role="alert" className="form-error">{error}</p>}<button className="button button-primary" disabled={busy}>{busy ? 'Đang tạo tài khoản…' : 'Tạo tài khoản'}</button>
  </form><p className="form-foot">Đã có tài khoản? <Link to="/login">Đăng nhập</Link></p></PageFrame>
}

export function LoginPage() {
  const navigate = useNavigate(); const location = useLocation(); const client = useQueryClient(); const [error, setError] = useState(''); const [busy, setBusy] = useState(false)
  const destination = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/account'
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); const data = new FormData(event.currentTarget)
    try { const account = await api.login({ email: String(data.get('email')), password: String(data.get('password')) }); client.setQueryData(['account'], account); navigate(destination, { replace: true }) }
    catch (caught) { setError(problem(caught)) } finally { setBusy(false) }
  }
  return <PageFrame title="Đăng nhập"><form onSubmit={submit} className="product-form">
    <label>Email<input name="email" type="email" autoComplete="email" required /></label>
    <label>Mật khẩu<input name="password" type="password" autoComplete="current-password" required /></label>
    {error && <p role="alert" className="form-error">{error}</p>}<button className="button button-primary" disabled={busy}>{busy ? 'Đang đăng nhập…' : 'Đăng nhập'}</button>
  </form><p className="form-foot">Chưa có tài khoản? <Link to="/register">Đăng ký</Link></p></PageFrame>
}

export function AccountPage() {
  const client = useQueryClient(); const account = useQuery({ queryKey: ['account'], queryFn: api.current, retry: false })
  if (account.isLoading) return <PageFrame title="Tài khoản"><p role="status">Đang tải thông tin…</p></PageFrame>
  if (account.isError || !account.data) return <Navigate to="/login" replace />
  return <PageFrame title="Tài khoản"><p>Xin chào, <strong>{account.data.displayName}</strong></p><p>{account.data.email}</p><p>Vai trò hiện tại: {account.data.admin ? 'quản trị viên' : 'người dùng'}</p>{account.data.admin && <><Link className="button button-outline" to="/admin/reports">Quản lý báo cáo</Link><Link className="button button-outline" to="/admin/pilot">Tổng quan pilot</Link></>}<Link className="button button-primary" to="/developer-profile">Hồ sơ developer</Link><Link className="button button-outline" to="/my/proposals">Đề xuất và quản lý CV</Link><button className="button button-outline" onClick={async () => { await api.logout(); client.setQueryData(['account'], null); await client.invalidateQueries({ queryKey: ['account'] }) }}>Đăng xuất</button></PageFrame>
}

const emptyProfile = { headline: '', biography: '', yearsExperience: 0, githubUrl: '', linkedinUrl: '', portfolioUrl: '', teachingApproach: '', availability: '' }

export function DeveloperProfileFormPage() {
  const query = useQuery({ queryKey: ['my-profile'], queryFn: api.myProfile, retry: false })
  if (query.isLoading) return <PageFrame title="Hồ sơ developer"><p role="status">Đang tải hồ sơ…</p></PageFrame>
  if (query.isError && query.error instanceof ApiError && query.error.status === 401) return <Navigate to="/login" replace />
  return <ProfileEditor existing={query.data ?? null} />
}

export function ProfileEditor({ existing }: { existing: DeveloperProfile | null }) {
  const navigate = useNavigate(); const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [skills, setSkills] = useState<Skill[]>([])
  useEffect(() => { void api.skills().then(setSkills).catch((caught) => setError(problem(caught))) }, [])
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget); const skillIds = data.getAll('skillIds').map(String)
    if (skillIds.length === 0) { setError('Hãy chọn ít nhất một kỹ năng.'); return }
    const input: ProfileInput = { headline: String(data.get('headline')), biography: String(data.get('biography')), yearsExperience: Number(data.get('yearsExperience')), githubUrl: String(data.get('githubUrl') || '') || null, linkedinUrl: String(data.get('linkedinUrl') || '') || null, portfolioUrl: String(data.get('portfolioUrl') || '') || null, teachingApproach: String(data.get('teachingApproach')), availability: String(data.get('availability')), skillIds }
    setBusy(true); setError('')
    try { const saved = existing ? await api.updateProfile(input) : await api.createProfile(input); navigate(`/developers/${saved.id}`) }
    catch (caught) { setError(problem(caught)) } finally { setBusy(false) }
  }
  const current = existing ? { ...existing, githubUrl: existing.githubUrl ?? '', linkedinUrl: existing.linkedinUrl ?? '', portfolioUrl: existing.portfolioUrl ?? '' } : emptyProfile
  return <PageFrame title={existing ? 'Chỉnh sửa hồ sơ developer' : 'Tạo hồ sơ developer'}><form onSubmit={submit} className="product-form">
    <label>Tiêu đề<input name="headline" defaultValue={current.headline} required maxLength={120} /></label>
    <label>Giới thiệu<textarea name="biography" defaultValue={current.biography} required maxLength={3000} rows={4} /></label>
    <label>Số năm kinh nghiệm<input name="yearsExperience" type="number" min="0" max="60" defaultValue={current.yearsExperience} required /></label>
    <label>GitHub URL<input name="githubUrl" type="url" defaultValue={current.githubUrl} placeholder="https://github.com/…" /></label>
    <label>LinkedIn URL<input name="linkedinUrl" type="url" defaultValue={current.linkedinUrl} placeholder="https://linkedin.com/in/…" /></label>
    <label>Portfolio URL<input name="portfolioUrl" type="url" defaultValue={current.portfolioUrl} placeholder="https://…" /></label>
    <label>Cách bạn hướng dẫn<textarea name="teachingApproach" defaultValue={current.teachingApproach} required maxLength={2000} rows={3} /></label>
    <label>Thời gian sẵn sàng<input name="availability" defaultValue={current.availability} required maxLength={500} /></label>
    <fieldset><legend>Kỹ năng (chọn ít nhất một)</legend>{skills.map((skill) => <label className="skill-option" key={skill.id}><input name="skillIds" type="checkbox" value={skill.id} defaultChecked={existing?.skills.some((item) => item.id === skill.id)} />{skill.name}</label>)}</fieldset>
    {error && <p role="alert" className="form-error">{error}</p>}<button className="button button-primary" disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu hồ sơ'}</button>
  </form></PageFrame>
}

export function PublicDeveloperProfilePage() {
  const { profileId = '' } = useParams(); const query = useQuery({ queryKey: ['developer-profile', profileId], queryFn: () => api.publicProfile(profileId) })
  const account = useQuery({ queryKey: ['account'], queryFn: api.current, retry: false })
  if (query.isLoading) return <PageFrame title="Hồ sơ developer"><p role="status">Đang tải hồ sơ…</p></PageFrame>
  if (query.isError || !query.data) return <PageFrame title="Không tìm thấy hồ sơ"><p role="alert">Hồ sơ này không tồn tại hoặc chưa được công khai.</p></PageFrame>
  const profile = query.data
  return <PageFrame title={profile.headline}><p className="profile-name">{profile.displayName} · {profile.yearsExperience} năm kinh nghiệm</p><p>{profile.biography}</p><h2>Kỹ năng</h2><div className="tag-list">{profile.skills.map((skill) => <span key={skill.id} className="skill-tag">{skill.name}</span>)}</div><h2>Phương pháp hướng dẫn</h2><p>{profile.teachingApproach}</p><h2>Khả năng</h2><p>{profile.availability}</p><div className="profile-links">{profile.githubUrl && <a href={profile.githubUrl} target="_blank" rel="noreferrer">GitHub</a>}{profile.linkedinUrl && <a href={profile.linkedinUrl} target="_blank" rel="noreferrer">LinkedIn</a>}{profile.portfolioUrl && <a href={profile.portfolioUrl} target="_blank" rel="noreferrer">Portfolio</a>}</div>{account.data && account.data.id !== profile.developerId && <ReportButton targetType="DEVELOPER_PROFILE" targetId={profile.id} />}</PageFrame>
}
