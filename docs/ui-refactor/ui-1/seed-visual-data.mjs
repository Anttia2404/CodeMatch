import { chromium } from '@playwright/test'
import { execFileSync } from 'node:child_process'

const baseUrl = process.env.CODEMATCH_BASE_URL ?? 'http://127.0.0.1:5175'
const apiOrigin = process.env.CODEMATCH_VISUAL_API_ORIGIN ?? 'http://127.0.0.1:18080'
if (new URL(baseUrl).origin !== 'http://127.0.0.1:5175' || new URL(apiOrigin).origin !== 'http://127.0.0.1:18080') {
  throw new Error('Synthetic data seeding is locked to the isolated UI-1.1 frontend :5175 and API :18080.')
}
const services = execFileSync('docker', ['compose', '-f', 'docker-compose.e2e.yml', 'ps', '--status', 'running', '--services'], { encoding: 'utf8' })
if (!services.split(/\r?\n/).includes('api') || !services.split(/\r?\n/).includes('postgres')) {
  throw new Error('Start both services from docker-compose.e2e.yml before seeding visual data.')
}
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
await page.goto(baseUrl, { waitUntil: 'domcontentloaded' })

const result = await page.evaluate(async ({ apiOrigin }) => {
  const api = `${apiOrigin}/api/v1`
  const token = () => decodeURIComponent(document.cookie.split('; ').find((part) => part.startsWith('XSRF-TOKEN='))?.split('=').slice(1).join('=') ?? '')
  const mutate = async (url, body) => {
    await fetch(`${api}/auth/csrf`, { credentials: 'include' })
    const response = await fetch(`${api}${url}`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': token() },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
    if (!response.ok) throw new Error(`${url}: ${response.status} ${await response.text()}`)
    return response.status === 204 ? undefined : response.json()
  }

  const existingResponse = await fetch(`${api}/learning-requests?size=1`, { credentials: 'include' })
  if (!existingResponse.ok) throw new Error(`Cannot inspect the isolated database (${existingResponse.status}).`)
  const existing = await existingResponse.json()
  if (existing.totalElements !== 0) throw new Error('The isolated visual database is not empty. Reset only the E2E Compose volumes before seeding again.')

  const email = `visual-${crypto.randomUUID()}@codematch.local`
  const password = Array.from(crypto.getRandomValues(new Uint8Array(24)), (byte) => byte.toString(16).padStart(2, '0')).join('')
  await mutate('/auth/register', { email, password, displayName: 'Synthetic Visual Test Learner' })
  await mutate('/auth/login', { email, password })
  const skillsResponse = await fetch(`${api}/skills`, { credentials: 'include' })
  const skills = await skillsResponse.json()
  const bySlug = Object.fromEntries(skills.map((skill) => [skill.slug, skill.id]))
  const fixtures = [
    ['Học React từ những component đầu tiên', 'Mình muốn xây dựng giao diện web có thể tái sử dụng và hiểu cách chia một trang thành các component nhỏ. Hiện mình mới biết HTML và CSS.', 'BEGINNER', ['react', 'javascript'], 120000, 180000, false, 'ONLINE'],
    ['Luyện thuật toán và cấu trúc dữ liệu bằng Java', 'Cần người hướng dẫn giải bài tập theo lộ trình, bắt đầu từ mảng, chuỗi rồi đến cây và đồ thị. Mỗi buổi nên có phần chữa bài.', 'BASIC', ['java', 'data-structures-algorithms'], 200000, 300000, true, 'ONLINE'],
    ['Xây API thực tế với Spring Boot', 'Tôi đã học Java cơ bản, muốn tự xây API REST có phân trang, kiểm thử và kết nối PostgreSQL. Mong được review bài tập giữa các buổi học.', 'INTERMEDIATE', ['spring-boot', 'java', 'postgresql'], 250000, 400000, false, 'ONLINE'],
    ['Nhập môn Python cho người chuyển ngành', 'Tôi đang chuyển sang lĩnh vực công nghệ và chưa từng lập trình. Muốn học Python qua ví dụ gần với công việc hằng ngày, có bài tập nhỏ sau mỗi buổi.', 'BEGINNER', ['python'], 100000, 160000, false, 'ONLINE'],
    ['Tối ưu truy vấn SQL cho báo cáo', 'Đang làm báo cáo dữ liệu với PostgreSQL, muốn hiểu cách đọc query plan, chọn index và cải thiện một số câu truy vấn chậm.', 'ADVANCED', ['sql', 'postgresql'], 350000, 550000, true, 'ONLINE'],
    ['Làm quen JavaScript và DOM', 'Mình cần một buổi học nền tảng về biến, hàm, mảng và cách JavaScript cập nhật nội dung trang web.', 'BEGINNER', ['javascript'], 90000, 150000, false, 'OFFLINE'],
    ['TypeScript cho dự án React hiện có', 'Nhóm nhỏ đang chuyển ứng dụng React sang TypeScript. Cần người hướng dẫn cách khai báo kiểu props, xử lý API response và tránh dùng any.', 'INTERMEDIATE', ['typescript', 'react'], 300000, 450000, true, 'ONLINE'],
    ['Machine learning căn bản với Python', 'Muốn hiểu quy trình chuẩn bị dữ liệu, chia tập train và validation, sau đó thử một mô hình phân loại đơn giản bằng scikit-learn.', 'BASIC', ['machine-learning', 'python'], 220000, 320000, false, 'ONLINE'],
    ['Node.js và thiết kế REST API', 'Cần học cách tổ chức một backend Node.js có validation, xử lý lỗi nhất quán và lưu dữ liệu vào PostgreSQL.', 'INTERMEDIATE', ['nodejs', 'javascript', 'postgresql'], 280000, 420000, true, 'ONLINE'],
    ['Ôn lại SQL trước kỳ thực tập', 'Mình biết SELECT và JOIN cơ bản nhưng còn chậm khi làm bài tập. Muốn luyện truy vấn từ dễ đến khó và được giải thích cách suy nghĩ.', 'BASIC', ['sql'], 100000, 170000, false, 'OFFLINE'],
    ['React và quản lý trạng thái giao diện', 'Đã làm vài trang React nhỏ. Muốn hiểu state, effect, form và cách tránh gọi API lặp lại khi chuyển giữa các màn hình.', 'INTERMEDIATE', ['react', 'javascript'], 260000, 380000, false, 'ONLINE'],
    ['Java nâng cao: concurrency và JVM', 'Tôi đã làm backend Java vài năm và muốn hệ thống lại thread, executor, đồng bộ dữ liệu và những chỉ số cần theo dõi khi ứng dụng chạy.', 'ADVANCED', ['java'], 500000, 750000, true, 'ONLINE'],
    ['Buổi học ngắn về Git và quy trình làm việc', 'Tôi muốn thực hành branch, pull request, xử lý conflict và viết commit rõ ràng trên một dự án mẫu.', 'BEGINNER', ['javascript'], null, null, false, 'ONLINE'],
    ['Thiết kế schema PostgreSQL cho ứng dụng học tập', 'Cần trao đổi về quan hệ giữa người học, yêu cầu học, kỹ năng và buổi dạy; đồng thời muốn biết cách viết migration an toàn.', 'INTERMEDIATE', ['postgresql', 'sql'], 300000, 500000, true, 'ONLINE'],
    ['Học Python trực tiếp tại Hà Nội', 'Tôi muốn học Python theo hình thức gặp trực tiếp, bắt đầu từ cú pháp rồi làm một công cụ nhỏ tự động hóa công việc.', 'BEGINNER', ['python'], 180000, 260000, false, 'OFFLINE'],
  ]
  const ids = []
  for (const [index, [title, description, currentLevel, slugs, budgetMin, budgetMax, requiresCv, preferredFormat]] of fixtures.entries()) {
    const draft = await mutate('/learning-requests', {
      title, description, learningGoal: 'Hoàn thành một lộ trình học có thể áp dụng vào dự án thực tế.', currentLevel, preferredFormat,
      city: preferredFormat === 'OFFLINE' ? 'Hà Nội' : null, budgetMin, budgetMax,
      budgetUnit: budgetMin === null ? null : index % 2 ? 'PER_SESSION' : 'PER_HOUR',
      preferredSchedule: index % 2 ? 'Buổi tối trong tuần' : 'Cuối tuần, linh hoạt theo lịch hai bên',
      expectedDuration: index % 3 ? '4–6 buổi' : 'Khoảng 2 tháng',
      teachingExpectations: 'Giải thích rõ ràng, có ví dụ và bài tập thực hành phù hợp với trình độ hiện tại.',
      requiresCv, skillIds: slugs.map((slug) => bySlug[slug]),
    })
    const published = await mutate(`/learning-requests/${draft.id}/publish`)
    ids.push(published.id)
  }
  return { count: ids.length, ids, skillCount: skills.length, databaseTarget: apiOrigin, fixtureLabel: 'SYNTHETIC VISUAL TEST DATA ONLY' }
}, { apiOrigin })

await browser.close()
console.log(JSON.stringify(result, null, 2))
