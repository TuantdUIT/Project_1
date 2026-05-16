# P1 — Feature modules + thoát fake auth (Features Plan)

> Hướng dẫn triển khai bước **P1**: thay `AuthContext` fake bằng API thật, tạo các feature module đầu tiên, thay data cứng bằng `useQuery`, kèm reorg `components/` và setup OpenAPI codegen. Tiếp nối [P0-WIRING-PLAN.md](./P0-WIRING-PLAN.md).
>
> **Cập nhật 2026-05-10:** rewire toàn bộ endpoints theo [docs/API_ENDPOINTS.md](./API_ENDPOINTS.md) — backend `ManagementService` (Spring Boot, port 8081, prefix `/api/v1`).
>
> **Cập nhật 2026-05-13:** đối chiếu lại với [`FRONTEND_API_GUIDE.md`](../../FRONTEND_API_GUIDE.md) (tài liệu BE gửi). Một số giả định ban đầu cần xác minh hoặc đã sai (xem mục 0 + mục 6, 7).

---

## 0. BE Reality Check — đối chiếu với plan ban đầu

| Giả định ban đầu | Thực tế BE | Hành động |
|---|---|---|
| Prefix `/api/...` | `/api/v1/...` | Sửa toàn bộ path |
| Port 8080 | **Port 8081** | Sửa `VITE_OPENAPI_URL` + `VITE_API_BASE_URL` |
| Login `{ username, password }` | `{ email, password }` (`ReqLoginDTO`) | Sửa form + DTO |
| Login response `{ accessToken, refreshToken, user, role:string }` | `{ access_token, user: {id, email, fullName}, role: {roleId: Long, roleName: string} }` — **`access_token` snake_case**, không có `refreshToken` trong body, `role` là object | Map snake→camel ở `authApi.login`; tách `role` object riêng khỏi `user`; bỏ kỳ vọng `refreshToken` trong body |
| `GET /api/auth/me` | `GET /api/v1/auth/account` (trả `{user, role}`) | Đổi tên hook `useMe` → `useAccount` |
| Refresh token trong body/storage | **HttpOnly cookie** `refresh_token`, refresh dùng `GET /api/v1/auth/refresh` (không body) | Axios `withCredentials: true`; không lưu refresh ở client; xoá `getRefreshToken/setRefreshToken` của P0 |
| Response trả về raw | **Cần xác nhận BE** — `FRONTEND_API_GUIDE.md §1.3` nói: "Da so API tra JSON object hoac JSON array truc tiep". Nếu có wrapper `FormatRestResponse: { statusCode, message, data, error }` thì interceptor unwrap `response.data.data`; nếu không thì không động vào | **Smoke call** 1 GET endpoint thật ngay đầu P1 để chốt (xem mục 12 bước 0) |
| Pagination | **Không áp dụng đồng đều** — `/api/v1/grades` (và một số lookup endpoint khác) **không có pagination**, trả thẳng JSON array. Chỉ một số endpoint danh sách như `/manager/students` mới có (response `{meta, result}`). Guide §4.3 ví dụ request dùng `page=0&size=20` (0-indexed) nhưng response `meta.page: 1` (1-indexed). API_ENDPOINTS.md note `one-indexed-parameters=true` → 1-indexed | **Smoke call** vào endpoint **có** pagination (vd `/manager/students`) với `page=0` và `page=1` để chốt index thực tế; viết pagination util chỉ dùng cho các endpoint có meta. Các endpoint không paginate (như `/grades`, `/lesson-types`) gọi không kèm `page/size` |
| `/api/courses`, `/api/courses/:id/lessons` | ❌ **Không tồn tại** — BE chỉ có `/lessons`, `/lesson-types`, `/grades` | Xem mục 6 — feature `courses` đổi mô hình |
| `/api/schedule/me`, `/api/schedule?grade=` | ❌ Không tồn tại — phải compose từ `/timetable-templates` + `/periods` + `/study-weeks` | Xem mục 7 |
| `/api/admin/stats` | ❌ Không tồn tại | Bỏ stats card hoặc tự derive client-side từ list endpoints |
| `/api/admin/students` | `/api/v1/manager/students` (có `studentStatus`, `schoolYear` filter) | Sửa path + filter |
| `/api/admin/teachers/performance` | ❌ Không tồn tại | Có thể derive từ `/record-attendances/weekly-summary` — defer P1.5 |
| `/api/admin/schedule` | Dùng chung `/timetable-templates` + filter | Gộp với mục 7 |

**Tài nguyên BE có sẵn nhưng plan ban đầu bỏ qua** (xem mục 9 để xếp lịch P1.5/P2):
Attendances, Record-Attendances, Costs, Cost-Tags, Penalties, Penalty-Tags, Online-Lectures, Learning-Files, Periods, Period-Settings, Study-Weeks, Timetable-Templates, Lesson-Types, Grades.

**Tài nguyên BE CHƯA có endpoint dù plan ban đầu giả định** (đã xác nhận từ guide):
- `LESSON` — guide §9: "chua co API CRUD/fetch rieng cho LESSON. frontend chua the goi endpoint lesson truc tiep". Toàn bộ §6 curriculum phải đổi cách hoặc defer.
- `/schedule/me`, `/schedule?grade=` — không có.
- `gradeId` trong `/auth/account` response — guide §2.1/2.2 user payload chỉ có `{id, email, fullName}`. FE muốn schedule per-user thì phải fetch riêng `GET /manager/student/register/{userUuid}` để đọc `grades[]`, hoặc mở ticket BE thêm field.

**Ghi chú về kiểu `id`** (guide §1.1) — type FE phải bám sát:
- `UUID` (string): `user`, `period`, `period_setting`, `lesson_type`, `study_week`, `timetable_template`
- `Long` (number): `gradeId`, `roleId`, `costTagId`, `tagIds[]` (penalty)
- `studentId` / `SID` (string do manager nhập, ví dụ `K10-10013`): **KHÁC** `user.id` (UUID)
- Response student dùng **snake_case** (`user_uuid`, `student_id`, `user_fullname`, `school_year`, ...), request dùng **camelCase** (`fullName`, `phoneNumber`, `gradeIds`, ...) — tách 2 shape khi viết DTO, **không gộp**.

---

## 1. Mục tiêu & phạm vi

**Mục tiêu:** lần đầu Network tab có request thật — FE bắt đầu giao tiếp với Spring Boot `ManagementService`.

**In scope (P1):**
1. **Setup OpenAPI codegen** (`openapi-typescript`) — chạy đầu tiên, sinh type cho cả 4 feature
2. **Reorg `src/components/`** thành `ui/`, `layouts/`, `seo/`, `errors/` + di chuyển component domain vào `features/<domain>/components/`
3. **`features/auth/`** — thay fake login → gọi `/api/v1/auth/*` thật
4. **`features/curriculum/`** *(thay tên `courses`)* — list grades + lessons + lesson-types (xem mục 6)
5. **`features/schedule/`** — compose timetable từ `/timetable-templates` + `/periods` + `/study-weeks`
6. **`features/admin/`** — quản lý học sinh qua `/manager/students` (bỏ stats card vì BE chưa có)

**Out of scope (chuyển P1.5 / P2 / P3):**
- `features/exam/` — chờ BE bổ sung domain bài thi (P1.5)
- `features/attendance/`, `features/record-attendance/` — có endpoints nhưng UI chưa có (P1.5)
- `features/finance/` (costs + penalties + tags) — UI chưa có (P2)
- `features/materials/` (online-lectures + learning-files) — UI chưa có (P2)
- Vitest / Testing Library / MSW / Playwright (P2)
- ESLint, Prettier, `eslint-plugin-check-file` (P2)
- Rename file sang `kebab-case` toàn bộ (P3)
- Gỡ deps lạ `express`, `dotenv`, `tsx`, `@google/genai` (P3)

---

## 2. Bối cảnh & quyết định đã chốt

P0 đã wire xong scaffolding (router, providers, AuthContext fake, axios interceptor). Tất cả request giờ đã có:
- `Authorization: Bearer <token>` tự động (interceptor)
- Refresh-token retry cho 401 (interceptor) — **lưu ý:** P0 đang giả định refresh trả body; P1 phải sửa interceptor để dùng cookie HttpOnly
- `QueryClient` bao phủ toàn app (provider)
- AuthContext, ProtectedRoute, RoleGuard hoạt động — chỉ thiếu data thật

| Câu hỏi | Lựa chọn |
|---|---|
| Endpoint Spring Boot | ✅ Đã có Swagger tại `http://localhost:8081/v3/api-docs` |
| Phạm vi | ✅ auth + curriculum + schedule + admin (bỏ exam, finance, materials sang P1.5/P2) |
| Reorg `components/` | ✅ Gộp vào P1 vì sẽ động import paths nhiều nhất |
| OpenAPI codegen | ✅ Làm ngay P1 — sinh type từ `/v3/api-docs`, không viết tay DTO |
| Response unwrap | ⚠ **Pending xác nhận** — chỉ unwrap nếu BE thật sự trả `FormatRestResponse` wrapper. Smoke call chốt trước khi code (xem §0). |
| Refresh cookie | ✅ Bật `withCredentials: true` ở axios + `cors.allowCredentials = true` BE đã set sẵn |
| Pagination index | ⚠ **Pending xác nhận** — chỉ một số endpoint có pagination (vd `/manager/students`). `/grades`, `/lesson-types` trả array trần. Guide & API_ENDPOINTS mâu thuẫn 0/1-indexed. Smoke call endpoint **có** pagination để chốt; util chỉ dùng cho endpoint có meta. |

---

## 3. Setup OpenAPI codegen — bước **làm trước tiên**

### 3.1 Cài deps

```powershell
rtk pnpm add -D openapi-typescript
```

### 3.2 Cấu hình env

Tạo `.env.local` (gitignore):

```
VITE_API_BASE_URL=http://localhost:8081
VITE_OPENAPI_URL=http://localhost:8081/v3/api-docs
```

> Đổi sang URL staging/production khi deploy. Xem [.env.example](../.env.example) để giữ đồng bộ.

### 3.3 Thêm script `package.json`

```json
"scripts": {
  "codegen:api": "openapi-typescript $env:VITE_OPENAPI_URL -o src/types/openapi.ts"
}
```

> Trên Linux/Mac đổi `$env:VITE_OPENAPI_URL` → `$VITE_OPENAPI_URL`. User đang dùng Windows PowerShell.

### 3.4 Chạy lần đầu

```powershell
rtk pnpm codegen:api
```

→ sinh ra `src/types/openapi.ts` chứa toàn bộ `paths` và `components.schemas` của BE. Mỗi DTO trong từng feature **import từ đây**, không viết tay.

### 3.5 Workflow khi BE đổi schema

BE thay đổi → chạy lại `pnpm codegen:api` → TypeScript báo đỏ chỗ shape lệch → sửa.

### 3.6 Sửa axios interceptor

Trước khi sang feature, vá `src/lib/api-client.ts`:

```ts
// withCredentials cho refresh cookie (chắc chắn cần — guide §2.1/2.3)
api.defaults.withCredentials = true;
```

**Response unwrap — chỉ thêm sau khi smoke call xác nhận có wrapper:**

```ts
// Chỉ thêm nếu smoke call cho thấy response = { statusCode, message, data, error }
api.interceptors.response.use((response) => {
  if (response.data && typeof response.data === 'object' && 'data' in response.data && 'statusCode' in response.data) {
    response.data = response.data.data;
  }
  return response;
});
```

Guide §1.3 nói "Da so API tra JSON object hoac JSON array truc tiep" → có khả năng không cần unwrap. Smoke call 1 endpoint không-auth (vd `GET /api/v1/grades`) để chốt.

Refresh interceptor (P0 đã có) đổi gọi `GET /api/v1/auth/refresh` (HTTP method GET, không body, cookie `refresh_token` tự gửi nhờ `withCredentials`). Đồng thời **xoá `getRefreshToken/setRefreshToken` ở `token-storage.ts`** vì không còn dùng.

---

## 4. Reorg `src/components/` — bước **làm trước tạo features**

Đi trước `features/*` vì khi tạo feature sẽ động đến import paths của các component này. Làm sau sẽ phải sửa import 2 lần.

### 4.1 Layout chung

| Đích (mới) | Nguồn (cũ) |
|---|---|
| `src/components/layouts/app-layout.tsx` | đã có ở P0 — giữ nguyên |
| `src/components/layouts/navbar.tsx` | `src/components/Navbar.tsx` (rename) |
| `src/components/layouts/footer.tsx` | `src/components/Footer.tsx` (rename) |

### 4.2 UI nguyên thuỷ

| Đích (mới) | Nguồn (cũ) |
|---|---|
| `src/components/ui/login-modal.tsx` | `src/components/LoginModal.tsx` |
| (tương lai) `src/components/ui/button.tsx`, `dialog.tsx`, ... | shadcn-style — chưa cần ngay |

### 4.3 SEO + errors (chưa nội dung, chỉ scaffold)

```
src/components/seo/                      ← để trống, P2 tạo <Head> Helmet wrapper
src/components/errors/                   ← để trống, P2 tạo error-boundary
```

### 4.4 Component domain → đẩy vào feature tương ứng

| Đích | Nguồn |
|---|---|
| `src/features/curriculum/components/course-card.tsx` | `src/components/CourseCard.tsx` |
| `src/features/curriculum/components/course-section.tsx` | `src/components/CourseSection.tsx` |
| `src/features/curriculum/components/featured-courses.tsx` | `src/components/FeaturedCourses.tsx` |
| `src/features/curriculum/components/teacher-section.tsx` | `src/components/TeacherSection.tsx` |
| `src/features/landing/components/home-hero.tsx` | `src/components/HomeHero.tsx` |
| `src/features/landing/components/hero.tsx` | `src/components/Hero.tsx` |
| `src/features/landing/components/consultation-form.tsx` | `src/components/ConsultationForm.tsx` — **gọi `POST /api/v1/student/register`** (xem mapping field bên dưới) |

> `landing/` không có protected API — chỉ là composition. `consultation-form` là chỗ duy nhất ở landing thực sự gọi BE (`/student/register` whitelisted).

**Mapping field cho `ConsultationForm` → `POST /student/register`** (guide §4.1):

DTO BE chấp nhận: `fullName, phoneNumber, parentName, parentNumber, fbLink, email, school, className, schoolYear, gradeIds[]`.

Form hiện tại có "Họ tên / Lớp / Trường học / Tỉnh / Lời nhắn" — **không khớp DTO**, cần đổi UI:

- Bỏ field "Tỉnh/Thành phố" và "Lời nhắn" (DTO không có).
- Thêm: `phoneNumber` (input tel, required), `parentName`, `parentNumber`, `email` (input email, required), `fbLink` (optional).
- Field "Lớp" hiện tại là `<select>` "Lớp 10/11/12" → tách thành 2 field: (a) `className` (text, ví dụ `"10A1"`), (b) chọn khối → push vào `gradeIds: [<Long>]` (1 phần tử). **Lưu ý:** `gradeIds` là `Long[]`, không phải UUID; cần map UI label sang id thật của `/grades` (fetch `GET /api/v1/grades` để dropdown động thay vì hardcode 1/2/3).
- `schoolYear`: auto set năm học hiện tại (vd 2026) trong submit handler, không cần input.
- Password BE tự gen = `phoneNumber` (guide §4.1) — FE không gửi password.

### 4.5 Xoá thư mục `src/data/`

Sau khi `features/curriculum/` đã gọi API thật → `src/data/courseDetails.ts` không còn cần → xoá.

---

## 5. Feature 1 — `features/auth/` (làm trước, vì cốt lõi)

### 5.1 Cấu trúc

```
src/features/auth/
├── api/
│   └── auth.ts          # useLogin, useLogout, useAccount (mutations + query)
├── components/
│   └── login-form.tsx   # form bên trong LoginModal — gọi useLogin
├── types.ts             # re-export từ openapi.ts (ReqLoginDTO, ResLoginDTO, ResAccountDTO)
└── index.ts             # public API
```

### 5.2 Endpoint (đã xác nhận từ BE)

| Method | Path | Hook | Body / Response |
|---|---|---|---|
| POST | `/api/v1/auth/login` | `useLogin()` (mutation) | body `{ email, password }` → **`{ access_token, user: {id, email, fullName}, role: {roleId, roleName} }`** + Set-Cookie `refresh_token` (HttpOnly) |
| GET | `/api/v1/auth/account` | `useAccount()` (query) | header Authorization → `{user, role}` (chưa có `gradeId`/`gradeIds` — xem §0) |
| GET | `/api/v1/auth/refresh` | dùng trực tiếp trong axios interceptor | cookie `refresh_token` → `access_token` mới (snake_case) |
| POST | `/api/v1/auth/logout` | `useLogout()` (mutation) | header Authorization → 200, cookie `refresh_token` bị BE expire |

> **Lưu ý form**: input đầu tiên trong LoginModal phải đổi label từ "Tên đăng nhập" → "Email", `type="email"`.

### 5.3 Thay đổi `AuthContext`

[src/lib/auth/auth-context.tsx](../src/lib/auth/auth-context.tsx) sẽ được sửa lại:

**Bỏ:**
- Hàm `resolveFakeUser()`
- `setAccessToken('fake-token')` + `setRefreshToken('fake-refresh-token')`
- Mọi reference đến `refreshToken` ở storage (refresh giờ là cookie HttpOnly)
- Hardcoded `AuthRole = 'USER' | 'ADMIN'`

**Thêm:**
- `login(email, password)` → gọi `authApi.login()` → **map `access_token` (snake_case BE) → `accessToken`** trong client; lưu access token + `user` + `role` object (`{roleId, roleName}`) thật
- `useEffect` mount: nếu có `accessToken` → gọi `authApi.getAccount()`. Nếu 401 → interceptor refresh tự động; refresh fail → clear + setUser(null)
- Trạng thái `isLoading: boolean` — true khi đang `getAccount()` lúc mount → tránh flash UI "chưa login"
- Lưu `role` riêng khỏi `user` để `RoleGuard` đọc nhanh
- Đổi `AuthRole` thành union từ `roleName` thật BE: `'MANAGER' | 'STUDENT' | ...` (chốt enum theo Swagger). `RoleGuard` cũ dùng `'ADMIN'` cho `/admin-portal` → map sang `'MANAGER'` (hoặc role admin tương ứng theo backend seed)

### 5.4 Thay đổi `LoginModal`

[src/components/ui/login-modal.tsx](../src/components/ui/login-modal.tsx):
- Form bên trong tách thành `features/auth/components/login-form.tsx` để gọi `useLogin()` (mutation)
- Modal vẫn lo phần shell (open/close, backdrop) qua `useLoginModal()`
- Hiển thị `fieldErrors` từ `parseApiError()` ([src/utils/api-errors.ts](../src/utils/api-errors.ts)) gắn vào `react-hook-form.setError()`
- Đổi field `username` → `email` + validate `z.string().email()`

### 5.5 Acceptance auth

- [ ] Login bằng email BE đã seed → Network tab thấy `POST /api/v1/auth/login` 200
- [ ] Response login có field **`access_token`** (snake_case) — client map sang `accessToken` ở `authApi.login`
- [ ] Response login có `role: {roleId, roleName}` (object, không phải string)
- [ ] Set-Cookie `refresh_token` xuất hiện trong response (HttpOnly, SameSite)
- [ ] Login sai mật khẩu → BE trả 4xx với `error` field → form hiện lỗi
- [ ] F5 sau login → thấy `GET /api/v1/auth/account` 200 → user vẫn hiện trên Navbar
- [ ] Token hết hạn → request 401 → interceptor gọi **`GET /api/v1/auth/refresh`** (method GET, không body, cookie tự gửi) → retry tự động
- [ ] Logout → `POST /api/v1/auth/logout` + cookie `refresh_token` bị xoá + về `/`
- [ ] `tokenStorage` không còn `getRefreshToken/setRefreshToken`
- [ ] `RoleGuard` dùng `roleName` thật BE (vd `MANAGER`), không còn `'ADMIN'` hardcoded
- [ ] Không còn import `resolveFakeUser` ở bất kỳ đâu

---

## 6. Feature 2 — `features/curriculum/` *(tên cũ: courses)*

### 6.1 Vấn đề: BE không có `/courses` và **chưa có endpoint `/lessons`**

BE không có resource "course". Domain thật là:
- `/api/v1/grades` (Long id) — khối học (10/11/12 hoặc 2k7/2k8/2k9)
- `/api/v1/lesson-types` (UUID) — loại bài (Toán/Lý/Hoá/...)
- ❌ `/api/v1/lessons` — **CHƯA tồn tại**. Guide §9: "chua co API CRUD/fetch rieng cho LESSON. frontend chua the goi endpoint lesson truc tiep". Backend chỉ auto-gen `LESSON` khi tạo `STUDY_WEEK` từ `TIMETABLE_TEMPLATE`.
- `/api/v1/study-weeks` (UUID) — tuần học theo school year
- `/api/v1/timetable-templates` (UUID) — template lịch tuần (chứa `items[]` mỗi item = lessonType × dayOfWeek × startTime)

UI hiện tại có "Toán 12", "Vật lý 11" → **đó là tổ hợp `(lesson-type × grade)`**, không phải entity rời rạc trong BE.

### 6.2 Cách map

**Trang list khoá học** (`/courses`) — giữ trong P1:
1. Fetch `/api/v1/grades` + `/api/v1/lesson-types` (cache 10 phút — ít đổi)
2. Render mỗi cell `(grade × lesson-type)` thành 1 "course card"
3. Khi click 1 card → URL `/curriculum/:gradeId/:lessonTypeId` (route mới thay `/courses/:id`)

**Trang detail** (`/curriculum/:gradeId/:lessonTypeId`) — **đổi cách hoặc defer** vì không có `/lessons`:

Hai lựa chọn:

- **(a) Defer detail sang P1.5** (khuyến nghị): trong P1, click card chỉ điều hướng tới landing-style detail page hiển thị metadata `(grade.name, lessonType.name, lessonType.lessonTime)` + chú thích "Đang chờ BE bổ sung endpoint LESSON". Không render danh sách bài học theo tuần.
- **(b) Render từ timetable-template**: fetch `GET /api/v1/timetable-templates?gradeId=...&schoolYear=...` (nếu BE hỗ trợ filter — cần xác nhận); với mỗi template active, lọc `items[]` theo `lessonTypeId` → liệt kê các buổi hiện ra trong tuần. Đây **không phải** danh sách bài học thực tế mà chỉ là khung lịch — UI phải nói rõ "Khung lịch dự kiến theo tuần" để không gây hiểu nhầm.

Quyết định mặc định trong checklist: **(a) defer**, mở ticket BE bổ sung `/lessons` (hoặc `/lessons?gradeId=&lessonTypeId=&studyWeekId=`) cho P1.5.

### 6.3 Cấu trúc

```
src/features/curriculum/
├── api/
│   ├── grades.ts              # useGradesQuery
│   └── lesson-types.ts        # useLessonTypesQuery
├── components/
│   ├── course-card.tsx        # 1 card đại diện (grade × lesson-type)
│   ├── course-section.tsx
│   ├── featured-courses.tsx
│   └── lesson-list-item.tsx   # chỉ dùng khi BE bổ sung /lessons (P1.5)
├── types.ts                   # re-export Grade, LessonType từ openapi.ts
└── index.ts
```

**Note:** không tạo `lessons.ts`/`useLessonsQuery` ở P1 vì endpoint chưa tồn tại — tạo khi BE giao.

### 6.4 Endpoint

| Method | Path | Hook | Cache | Pagination |
|---|---|---|---|---|
| GET | `/api/v1/grades` | `useGradesQuery()` | `staleTime: 10*60*1000` | **Không** — trả array trần |
| GET | `/api/v1/lesson-types` | `useLessonTypesQuery()` | `staleTime: 10*60*1000` | **Không** (giả định lookup nhỏ; xác nhận khi smoke call) |
| ~~GET~~ | ~~`/api/v1/lessons`~~ | **Defer** — endpoint chưa tồn tại (guide §9) | — | — |
| ~~GET~~ | ~~`/api/v1/lessons/{id}`~~ | **Defer** | — | — |
| GET | `/api/v1/study-weeks?schoolYear=` | `useStudyWeeksQuery(year)` (dùng trong §7 schedule) | `staleTime: 60*60*1000` | Xác nhận khi smoke call |

Endpoint trong feature này hiện **không** kèm `?page=&size=`. Pagination chỉ áp dụng cho endpoint trả `{meta, result}` (xem §8 admin).

### 6.5 Thay đổi route

| Route | Thay đổi |
|---|---|
| [src/app/routes/landing.tsx](../src/app/routes/landing.tsx) | `<FeaturedCourses>` đọc top 6 từ `useGradesQuery()` × `useLessonTypesQuery()` |
| [src/app/routes/app/courses.tsx](../src/app/routes/app/courses.tsx) | Bỏ mảng `sections` cứng; render grid `(grade × lesson-type)` |
| [src/app/routes/app/course-detail.tsx](../src/app/routes/app/course-detail.tsx) | Đổi sang `/curriculum/:gradeId/:lessonTypeId`; **P1 chỉ hiện metadata `(grade.name, lessonType.name, lessonType.lessonTime)`** + placeholder "Chi tiết bài học sẽ có khi BE bổ sung endpoint LESSON" |

> **Ticket BE cần mở:** bổ sung `GET /api/v1/lessons` (kèm filter `gradeId`, `lessonTypeId`, `studyWeekId`) — block trang detail P1.5.

### 6.6 Pagination

**Không áp dụng** cho feature curriculum vì `/grades` và `/lesson-types` không có pagination. Util [src/utils/pagination.ts](../src/utils/pagination.ts) `buildPageQuery()` chỉ dùng ở §8 admin (`/manager/students`) sau khi smoke call ở §0 chốt index (0- hay 1-indexed) và hỗ trợ thêm `sort=createdAt,desc`.

### 6.7 Acceptance curriculum

- [ ] `/courses` hiển thị tổ hợp grade × lesson-type thật từ BE
- [ ] `/curriculum/:gradeId/:lessonTypeId` hiển thị metadata grade + lesson-type + placeholder cho danh sách lesson (BE chưa có endpoint)
- [ ] Loading state có Skeleton
- [ ] Empty state nếu `/grades` hoặc `/lesson-types` trả về rỗng
- [ ] `src/data/courseDetails.ts` đã xoá
- [ ] Đã mở ticket BE bổ sung `GET /lessons` (link ticket trong PR description)

---

## 7. Feature 3 — `features/schedule/`

### 7.1 Vấn đề: không có `/schedule/me`, và `PERIOD` không phải "slot thời gian"

BE không có `/schedule/me` hay `/schedule?grade=`. **Sửa hiểu nhầm trong plan cũ:**

| Khái niệm | Plan cũ hiểu | Thực tế guide §7 |
|---|---|---|
| `PERIOD` | "Khoảng thời gian học (slot)" | **Instance học của 1 student** — gán học sinh vào 1 gói học cụ thể (`periodSetting + timetableTemplate + tuition + enrollDate`). Không phải khung giờ tiết. |
| Khung giờ tiết | (nhầm vào `PERIOD`) | Nằm trong `timetableTemplate.items[].startTime` (guide §6.2) |

⇒ Lịch học per-student compose từ:
- `/api/v1/timetable-templates` — template tuần theo grade × school year (chứa `items[]` với `dayOfWeek`, `startTime`, `lessonTypeId`)
- `/api/v1/study-weeks?schoolYear=` — tuần học cụ thể (chứa `weekNumber`, `startDate`, `endDate`)

**Bỏ** `/api/v1/periods` và `/api/v1/period-settings` khỏi schedule view — chúng dành cho màn manager cấu hình gói học, không phải render lịch.

### 7.2 Cấu trúc

```
src/features/schedule/
├── api/
│   ├── timetable-templates.ts  # useTimetableTemplatesQuery (theo grade + schoolYear)
│   └── study-weeks.ts          # useStudyWeeksQuery
├── components/
│   ├── schedule-week-grid.tsx  # khung 7 ngày × giờ (giờ lấy từ items[].startTime)
│   └── schedule-event-card.tsx
├── lib/
│   └── compose-schedule.ts     # gộp timetable-template.items[] + study-week → events
├── types.ts
└── index.ts
```

### 7.3 Endpoint

| Method | Path | Hook | Mục đích |
|---|---|---|---|
| GET | `/api/v1/timetable-templates` (filter `gradeId`, `schoolYear` — cần xác nhận BE) | `useTimetableTemplatesQuery({ gradeId, schoolYear })` | Template lịch của 1 khối; nếu không filter được thì fetch hết rồi filter client |
| GET | `/api/v1/study-weeks?schoolYear=` | `useStudyWeeksQuery(year)` | Lịch tuần — cung cấp `startDate` để map `dayOfWeek` → ngày cụ thể |

**Bỏ khỏi P1:** `/periods`, `/period-settings` (không thuộc schedule view — xem §7.1).

> **User-specific schedule — vấn đề `gradeId`:** `/auth/account` **không** trả `gradeId` (guide §2.2 chỉ trả `{user, role}`). Plan cũ giả định `auth.user.gradeId` là sai.
>
> **Giải pháp tạm:**
> 1. Sau login, nếu là student → gọi `GET /api/v1/manager/student/register/{userUuid}` để đọc `grades[]` (guide §4.6 response có field `grades`).
> 2. Nếu student có nhiều grade, hiển thị dropdown chọn 1 grade trong số đó để fetch timetable.
>
> **Ticket BE cần mở:** bổ sung `gradeId`/`gradeIds` vào `/auth/account` response, hoặc tạo `/schedule/me` (P1.5+).

### 7.4 Thay đổi route

[src/app/routes/app/schedule.tsx](../src/app/routes/app/schedule.tsx):
- Bỏ mảng `scheduleData: ScheduleEvent[]` cứng
- Sau `useAuth()` → nếu user là student → fetch `useStudentByUuidQuery(user.id)` → đọc `grades[]`
- Mặc định chọn `grades[0]`; nếu có nhiều → dropdown chọn
- `useTimetableTemplatesQuery({ gradeId, schoolYear })` để lấy template active
- `useStudyWeeksQuery(schoolYear)` để có `startDate` của tuần đang xem
- `composeSchedule(template, studyWeek)`: với mỗi `template.items[]` (có `dayOfWeek`, `startTime`, `lessonTypeId`) → map sang ngày cụ thể bằng `studyWeek.startDate` + offset của `dayOfWeek` (theo enum Java: `SUNDAY`=0/7, `MONDAY`=1, …)
- Bộ lọc khối 2k8/2k9/2k10 cũ → đổi sang dropdown khối lấy từ `grades[]` của student

### 7.5 Acceptance schedule

- [ ] `/schedule` (đã login student) fetch được `grades[]` từ `/manager/student/register/{userUuid}`
- [ ] `/schedule` hiện lịch theo `gradeId` chọn (mặc định `grades[0]`), compose từ `timetable-template` + `study-week`
- [ ] `composeSchedule` không tham chiếu `/periods` hay `/period-settings`
- [ ] Đổi grade dropdown (nếu student có >1 grade) → re-fetch timetable mới
- [ ] Đổi tuần xem → re-render đúng ngày theo `study-week.startDate`
- [ ] Logout → `/schedule` redirect về `/` (vẫn từ P0)
- [ ] Đã mở ticket BE: thêm `gradeId` vào `/auth/account` hoặc tạo `/schedule/me`

---

## 8. Feature 4 — `features/admin/`

### 8.1 Vấn đề: không có `/admin/stats`, `/admin/teachers/performance`

BE chưa expose endpoint dashboard tổng quan. P1 chỉ làm phần đã có:
- ✅ `/api/v1/manager/students` — list học sinh
- ✅ `/api/v1/manager/student/register` — tạo HS (manager)
- ✅ `/api/v1/manager/student/register/{userUuid}` — get/update theo UUID
- ❌ Stats card (tổng học sinh, doanh thu, lớp hôm nay) — **defer hoặc derive client**
- ❌ Teacher performance — defer (có thể derive từ `/record-attendances/weekly-summary` ở P1.5)

### 8.2 Cấu trúc

```
src/features/admin/
├── api/
│   ├── students.ts           # useStudentsQuery, useCreateStudent, useUpdateStudent, useStudentByUuid
│   └── stats.ts              # (P1) derive: count students từ list endpoint
├── components/
│   ├── stats-cards.tsx       # 1 card đếm học sinh (derive từ /manager/students total)
│   ├── student-table.tsx     # bảng quản lý học sinh + filter status + schoolYear
│   └── student-form.tsx      # tạo/sửa
├── types.ts
└── index.ts
```

> Bỏ tạm `schedule-timeline.tsx`, `score-chart.tsx`, `ta-performance-table.tsx` khỏi P1 — sẽ bổ sung khi BE thêm endpoint.

### 8.3 Endpoint

| Method | Path | Hook |
|---|---|---|
| GET | `/api/v1/manager/students?studentStatus=&schoolYear=&page=&size=` | `useStudentsQuery({ studentStatus, schoolYear, page, size })` — **lưu ý:** param là `studentStatus` (camelCase, viết hoa), không phải `status`; enum: `WAITING` \| `ACTIVE` \| `INACTIVE` |
| GET | `/api/v1/manager/student/register?studentID=&schoolYear=` | `useStudentByCodeQuery({ studentID, schoolYear })` — `studentID` là SID kiểu string (vd `K10-10013`), **không** phải UUID |
| GET | `/api/v1/manager/student/register/{userUuid}` | `useStudentByUuidQuery(userUuid)` — `userUuid` là UUID của User entity |
| POST | `/api/v1/manager/student/register` | `useCreateStudent()` |
| PUT | `/api/v1/manager/student/register?studentID=&schoolYear=` | `useUpdateStudentByCode()` |
| PUT | `/api/v1/manager/student/register/{userUuid}` | `useUpdateStudentByUuid()` |

> **Không có DELETE student** — BE hiện không expose. Nếu UI có nút xoá, ẩn hoặc map sang `studentStatus = INACTIVE` qua PUT.

**Cảnh báo kiểu id & shape DTO** (guide §1.1, §4):
- **Request** (POST/PUT) dùng **camelCase**: `studentId, fullName, phoneNumber, parentName, parentNumber, fbLink, email, school, className, studentStatus, schoolYear, gradeIds: Long[]`.
- **Response** (GET danh sách và chi tiết) dùng **snake_case**: `user_uuid, student_id, user_fullname, user_phone_number, parent_name, parent_number, fb_link, user_email, school, student_class, student_status, student_first_enroll_date, school_year, debt, grades`.
- 2 shape KHÁC nhau — viết type `ReqStudentDTO` và `ResStudentDTO` riêng biệt, đừng share. `openapi-typescript` codegen sẽ phản ánh đúng nếu BE khai báo schema chuẩn.
- `gradeIds[]` là `Long[]` (số); `userUuid`/`user_uuid` là UUID (chuỗi). Đừng để TypeScript suy ra `string | number` chung.
- Field auto-computed BE (FE **không** sửa): `debt` (tổng debt PERIOD), `student_first_enroll_date`, `estimate_expire_date` (xem guide §15).

### 8.4 Thay đổi route

[src/app/routes/admin/admin-portal.tsx](../src/app/routes/admin/admin-portal.tsx) → tách:
- AdminDashboard component → `features/admin/components/admin-dashboard.tsx`
- Thay mảng cứng (`{name: 'Nguyễn Minh Tú', hours: 156, ...}` ở admin-portal.tsx:307-311) bằng placeholder + ghi chú "BE chưa có endpoint"
- Stats card chỉ giữ "Tổng học sinh" (count từ `useStudentsQuery` total)

[src/features/admin/components/student-management.tsx](../src/features/admin/components/student-management.tsx) → dùng `useStudentsQuery()` + filter `studentStatus`/`schoolYear`.

### 8.5 Mutation pattern

```ts
// features/admin/api/students.ts
// Body theo guide §4.2 (camelCase, gradeIds là Long[])
type ReqManagerCreateStudentDTO = {
  studentId: string;          // SID, vd "K10-10013"
  fullName: string;
  phoneNumber: string;
  parentName?: string;
  parentNumber?: string;
  fbLink?: string;
  email?: string;
  school?: string;
  className?: string;          // vd "10A1"
  studentStatus: 'WAITING' | 'ACTIVE' | 'INACTIVE';
  schoolYear: number;
  gradeIds: number[];          // Long[]
};

export function useCreateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ReqManagerCreateStudentDTO) =>
      apiClient.post<ResStudentDTO>('/api/v1/manager/student/register', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'students'] }),
  });
}
```

### 8.6 Acceptance admin

- [ ] Login admin/manager → `/admin-portal` hiện 1 stats card "Tổng học sinh" đọc từ `meta.totalItems` của `/manager/students`
- [ ] Bảng học sinh phân trang khớp BE thực tế (đã chốt index qua smoke call §0)
- [ ] Filter `studentStatus` (enum `WAITING/ACTIVE/INACTIVE`) + `schoolYear` hoạt động qua query string
- [ ] Type `ResStudentDTO` dùng snake_case khớp guide §4.6; type `ReqManagerCreateStudentDTO` dùng camelCase khớp guide §4.2 — không share type
- [ ] Tạo/sửa học sinh → bảng tự refresh nhờ `invalidateQueries`
- [ ] User thường (role không phải `MANAGER` hoặc role admin BE seed) gõ `/admin-portal` → redirect `/` (RoleGuard với `roleName` thật)

---

## 9. Backlog post-P1 — endpoints BE đã có nhưng UI chưa làm

Các tài nguyên sau **đã có ở BE** nhưng chưa nằm trong scope P1. Lên lịch:

| Feature | Endpoints | Phase |
|---|---|---|
| `features/attendance/` | `/api/v1/attendances` + `weekly-summary`, `weekly-summary/range` | P1.5 |
| `features/record-attendance/` | `/api/v1/record-attendances` + weekly-summary toàn user | P1.5 |
| `features/finance/` (costs) | `/api/v1/costs`, `/api/v1/cost-tags` | P2 |
| `features/finance/` (penalties) | `/api/v1/penalties`, `/api/v1/penalty-tags` | P2 |
| `features/materials/` | `/api/v1/online-lectures` (+ `/student/{uuid}`), `/api/v1/learning-files` (+ `/student/{uuid}`) | P2 |
| `features/exam/` | (chờ BE bổ sung) | P1.5 sau khi BE chốt |

---

## 10. Acceptance criteria tổng (Definition of Done)

- [ ] `pnpm codegen:api` chạy thành công, sinh `src/types/openapi.ts` từ `http://localhost:8081/v3/api-docs`
- [ ] `pnpm dev` chạy được; không feature nào còn data cứng (`courseDetails.ts`, `scheduleData[]`, mảng học sinh hardcoded)
- [ ] Network tab có request thật cho **mọi** trang sau khi login, prefix `/api/v1/...`
- [ ] Login bằng email BE seed thành công bằng `POST /api/v1/auth/login` + cookie `refresh_token` được set; client đã map `access_token` → `accessToken`
- [ ] F5 ở mọi route giữ login (qua `GET /api/v1/auth/account`)
- [ ] 401 → axios interceptor gọi `GET /api/v1/auth/refresh` (method GET, cookie tự gửi nhờ `withCredentials: true`) → retry tự động
- [ ] Logout → `POST /api/v1/auth/logout` + cookie cleared
- [ ] Tất cả mutation (admin CRUD) → bảng/list refresh tự động qua `invalidateQueries`
- [ ] Smoke call ở §0 đã chốt: (a) có/không wrapper `FormatRestResponse` (qua `/grades`), (b) pagination 0-/1-indexed (qua `/manager/students`). Interceptor + pagination util viết theo kết quả thực tế.
- [ ] `useGradesQuery`, `useLessonTypesQuery` **không** gửi `page/size` (endpoint trả array trần); pagination util chỉ dùng cho endpoint trả `{meta, result}`.
- [ ] `withCredentials: true` được bật ở axios client
- [ ] `tokenStorage` không còn `getRefreshToken/setRefreshToken`
- [ ] `RoleGuard` dùng `roleName` thật BE (vd `MANAGER`), không còn `'USER'|'ADMIN'` hardcoded
- [ ] Schedule không tham chiếu `/periods` hay `/period-settings`; compose từ `timetable-template.items` + `study-week`
- [ ] Curriculum detail page (`/curriculum/:gradeId/:lessonTypeId`) hiển thị metadata + placeholder vì `/lessons` chưa có; đã mở ticket BE
- [ ] `ConsultationForm` đã đổi field khớp DTO `POST /student/register` (`phoneNumber`, `parentName/parentNumber`, `email`, `gradeIds: Long[]`); bỏ "Tỉnh"/"Lời nhắn"
- [ ] `pnpm lint` (`tsc --noEmit`) pass
- [ ] Reorg `components/`: chỉ còn `ui/`, `layouts/`, `seo/`, `errors/` ở `src/components/`. Component domain đã đi vào `features/<domain>/components/`
- [ ] Xoá `src/data/courseDetails.ts`; thư mục `src/components/` không còn file ở root level

---

## 11. Verification

```powershell
rtk pnpm install
rtk pnpm codegen:api               # cần VITE_OPENAPI_URL trong .env.local
rtk pnpm lint                      # tsc --noEmit
rtk pnpm dev                       # mở http://localhost:5173 (Vite default — BE đã CORS allow)
rtk pnpm build                     # smoke build
```

**Smoke test theo thứ tự:**

1. **Auth flow** — login (email/password), F5 giữ session, logout, refresh sau 401
2. **Curriculum** — landing → list grade × lesson-type → detail lessons theo tuần
3. **Schedule** — login user → `/schedule` thấy timetable compose từ BE
4. **Admin** — login admin → bảng học sinh + filter + tạo/sửa

---

## 12. Thứ tự thi công đề xuất

0. **Smoke call thực tế** — chia 2 phần:
   - **(a) Wrapper:** gọi `GET /api/v1/grades` (không cần auth, không paginate) → xem response có wrapper `FormatRestResponse: { statusCode, message, data, error }` hay không.
   - **(b) Pagination index:** gọi endpoint **có** pagination (sau khi login manager để có token) — vd `GET /api/v1/manager/students?page=0&size=5` rồi `?page=1&size=5` — đối chiếu `meta` trả về để chốt 0- hay 1-indexed. Nếu không tiện login, dùng tạm Swagger UI tại `:8081/swagger-ui` "Try it out".
   - **Hai câu trả lời này block bước 1–7.** Pagination util chỉ áp dụng cho endpoint trả `{meta, result}`; lookup endpoint như `/grades`, `/lesson-types` gọi không kèm `page/size`.
1. **Setup codegen** (mục 3) — sinh type; bật `withCredentials: true`; thêm response unwrap interceptor **chỉ khi** bước 0 xác nhận có wrapper
2. **Reorg `components/`** (mục 4) — di chuyển + sửa import. Commit riêng vì diff lớn nhưng đơn giản. ConsultationForm đổi field khớp DTO `/student/register`
3. **`features/auth/`** (mục 5) — quan trọng nhất, ảnh hưởng mọi tính năng có guard. Map `access_token` snake→camel; bỏ refresh storage; đổi `RoleGuard` sang `roleName` thật
4. **`features/curriculum/`** (mục 6) — list grades × lesson-types; detail page chỉ metadata vì `/lessons` chưa có. Mở ticket BE
5. **`features/schedule/`** (mục 7) — fetch `grades[]` qua `useStudentByUuidQuery` (vì account không có `gradeId`); compose từ `timetable-template` + `study-week`; **không** dùng `/periods`
6. **`features/admin/`** (mục 8) — phức tạp nhất, để cuối. Tách `ReqStudentDTO` (camelCase) khỏi `ResStudentDTO` (snake_case)
7. Smoke test toàn flow + tick acceptance criteria mục 10

---

## 13. Lưu ý chuyển tiếp sang P1.5 / P2 / P3

- **`features/attendance/`, `features/record-attendance/`** — endpoints sẵn sàng, làm khi UI có wireframe (P1.5)
- **`features/exam/`** — chờ BE bổ sung domain bài thi
- **`features/finance/`, `features/materials/`** — endpoints sẵn sàng nhưng UI chưa có (P2)
- **Toolchain test** (Vitest, MSW, Playwright) → P2
- **ESLint + `eslint-plugin-check-file`** → P2; rename file `PascalCase` còn lại → P3
- **Gỡ deps lạ** (`express`, `@google/genai`, `dotenv`, `tsx`) → P3

---

## Phụ lục — checklist thi công

```
[ ]  0a. SMOKE CALL wrapper: GET /api/v1/grades (không auth, không paginate) — chốt có FormatRestResponse hay không
[ ]  0b. SMOKE CALL pagination: GET /api/v1/manager/students?page=0&size=5 vs ?page=1&size=5 (sau khi login manager hoặc qua Swagger UI) — chốt 0- hay 1-indexed
[ ]  1. pnpm add -D openapi-typescript
[ ]  2. Tạo .env.local + điền VITE_API_BASE_URL=http://localhost:8081 và VITE_OPENAPI_URL=...
[ ]  3. Thêm script "codegen:api" vào package.json
[ ]  4. pnpm codegen:api → kiểm tra src/types/openapi.ts
[ ]  5. Sửa axios client: withCredentials=true; thêm response unwrap interceptor CHỈ KHI bước 0 cho thấy có wrapper FormatRestResponse
[ ]  6. Sửa refresh interceptor: method GET /api/v1/auth/refresh không body, dùng cookie; xoá getRefreshToken/setRefreshToken khỏi token-storage.ts
[ ]  7. Sửa pagination util theo kết quả bước 0b (0- hoặc 1-indexed); util CHỈ áp dụng cho endpoint trả {meta, result}, không dùng cho /grades, /lesson-types
[ ]  8. Reorg src/components/ → ui/, layouts/, seo/, errors/
[ ]  9. Tạo src/features/landing/ + di chuyển HomeHero, Hero, ConsultationForm, TeacherSection
[ ] 10. Sửa UI ConsultationForm: bỏ "Tỉnh"/"Lời nhắn", thêm phoneNumber/parentName/parentNumber/email/fbLink, đổi "Lớp" thành className text + dropdown grade (fetch /grades) → gradeIds: Long[]; gọi POST /api/v1/student/register
[ ] 11. Sửa import trong các route file
[ ] 12. tsc --noEmit pass sau reorg
[ ] 13. features/auth/ — viết useLogin (map access_token→accessToken), useAccount, useLogout
[ ] 14. AuthContext — bỏ resolveFakeUser, login(email,password), getAccount mount; tách role object; đổi AuthRole sang roleName thật
[ ] 15. LoginModal — đổi field username → email (type=email), tách form thành features/auth/components/login-form.tsx
[ ] 16. RoleGuard — đổi từ 'USER'/'ADMIN' sang roleName thật BE (vd 'MANAGER')
[ ] 17. Smoke test auth flow (login, F5, refresh-on-401, logout, cookie set/clear)
[ ] 18. features/curriculum/ — viết useGradesQuery, useLessonTypesQuery (KHÔNG paginate vì BE trả array trần; KHÔNG viết useLessonsQuery — endpoint chưa có)
[ ] 19. MỞ TICKET BE: bổ sung GET /api/v1/lessons (filter gradeId/lessonTypeId/studyWeekId)
[ ] 20. Sửa landing/courses dùng hook; curriculum-detail chỉ hiện metadata grade + lesson-type
[ ] 21. Xoá src/data/courseDetails.ts
[ ] 22. features/schedule/ — useTimetableTemplatesQuery + useStudyWeeksQuery (KHÔNG có usePeriodsQuery)
[ ] 23. Wire useStudentByUuidQuery để đọc grades[] của student (vì /auth/account chưa trả gradeId)
[ ] 24. composeSchedule(template, studyWeek) utility + sửa route schedule (map dayOfWeek + startTime sang ngày cụ thể qua study-week.startDate)
[ ] 25. MỞ TICKET BE: thêm gradeId/gradeIds vào /auth/account (hoặc tạo /schedule/me)
[ ] 26. features/admin/ — useStudentsQuery, useCreateStudent, useUpdateStudent; tách ReqStudentDTO (camelCase) và ResStudentDTO (snake_case)
[ ] 27. Sửa route admin-portal + student-management; dùng meta.totalItems cho stats card
[ ] 28. Smoke test toàn bộ → tick acceptance mục 10
```
