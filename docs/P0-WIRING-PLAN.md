# P0 — Kích hoạt scaffolding (Wiring Plan)

> Hướng dẫn triển khai bước **P0** đã chốt từ phân tích trạng thái codebase ngày **2026-05-10**. Coder đọc xong là đủ thông tin để thi công; reviewer dùng mục Acceptance Criteria làm tiêu chí approve.

---

## 1. Mục tiêu & phạm vi

**Mục tiêu:** kích hoạt React Router + AuthProvider + QueryClientProvider, chuyển điều hướng từ `useState` sang Router, di chuyển pages về `src/app/routes/`, áp dụng `ProtectedRoute` / `RoleGuard` cho các route nhạy cảm.

**In scope (5 việc):**
1. Viết `src/app/router.tsx` (lazy routes + guards)
2. Viết `src/app/provider.tsx` + `src/main.tsx` bọc providers
3. Viết toàn bộ `src/lib/auth/*`, `src/lib/api-client.ts`, `src/lib/react-query.ts`, `src/config/*`
4. Di chuyển `src/pages/**` → `src/app/routes/**`
5. Bọc `ProtectedRoute` cho `/schedule`, `/exam`; `RoleGuard role="ADMIN"` cho `/admin-portal`

**Out of scope (để dành P1/P2/P3):**
- Tạo feature module `src/features/<domain>/` (P1)
- Tổ chức lại `src/components/` thành `ui/`, `layouts/`, `seo/`, `errors/` (P1)
- ESLint, Prettier, `eslint-plugin-check-file`, Vitest, MSW, Playwright (P2)
- OpenAPI codegen (P2)
- Rename file sang `kebab-case` toàn diện (P3)
- Gỡ deps lạ (`express`, `dotenv`, `tsx`) (P3)

---

## 2. Bối cảnh — vì sao phải làm P0 trước

Khám phá codebase ngày 2026-05-10 cho thấy:

- `src/main.tsx` vẫn render `<App />` cũ — **bypass** mọi provider
- `src/App.tsx` (166 dòng) tự quản lý điều hướng bằng `useState<AppView>` + `window.history.pushState` thay vì React Router
- **Tất cả** file scaffolding sau đều **rỗng**: `src/app/{router,provider,index}.tsx`, `src/app/routes/{landing,not-found}.tsx`, `src/lib/api-client.ts`, `src/lib/react-query.ts`, `src/lib/auth/{auth-context,protected-route,role-guard,auth-api,token-storage}.*`, `src/config/{env,paths}.ts`
- Pages thật nằm ở `src/pages/app/*` và `src/pages/admin/AdminPortal.tsx`, được import trực tiếp vào `App.tsx`

⇒ Mọi việc P1/P2/P3 đều phụ thuộc P0. Không có Router, không có Provider thì AuthContext, useQuery, ProtectedRoute đều là code chết.

**Quyết định đã chốt với user:**

| Câu hỏi | Lựa chọn |
|---|---|
| Backend Spring Boot | ✅ Đã sẵn sàng (port 8081, prefix `/api/v1`, auth tại `/api/v1/auth/*`) |
| Phạm vi P0 | ✅ Đầy đủ 5 việc trong 1 PR |
| Login legacy (`edtech/123456`, `admin/123456`) | ✅ Giữ tạm hardcoded, bọc trong `AuthContext` fake — không break demo. TODO thay bằng `/api/auth/login` ở P1 |

---

## 3. Bản đồ điều hướng đích

| Path | Component | Guard |
|---|---|---|
| `/` | `routes/landing.tsx` | — |
| `/courses` | `routes/app/courses.tsx` | — |
| `/courses/:id` | `routes/app/course-detail.tsx` | — |
| `/schedule` | `routes/app/schedule.tsx` | `ProtectedRoute` |
| `/exam` | `routes/app/exam.tsx` | `ProtectedRoute` |
| `/admin-portal` | `routes/admin/admin-portal.tsx` | `RoleGuard role="ADMIN"` |
| `*` | `routes/not-found.tsx` | — |

Tất cả route (trừ admin) lồng trong layout `<AppLayout>` (Navbar + `<Outlet />` + Footer + `<LoginModal>`). `/admin-portal` có thể tự render layout riêng vì có sidebar/topbar đặc thù.

---

## 4. Danh sách file & thay đổi

### 4.1 Lib & config — viết từ đầu (9 file)

| File | Mô tả |
|---|---|
| `src/config/env.ts` | Zod parse `import.meta.env.VITE_APP_API_URL` (default `http://localhost:8081`); export object `env` |
| `src/config/paths.ts` | Single source of truth: `paths.home = '/'`, `paths.courses = '/courses'`, `paths.courseDetail = (id) => '/courses/' + id`, `paths.schedule`, `paths.exam`, `paths.adminPortal`, `paths.login` |
| `src/lib/api-client.ts` | Axios instance theo mục **3.1** của `CODEBASE_STRUCTURE.react-spring-mysql.v2.md`: request interceptor gắn `Authorization: Bearer`, response interceptor unwrap `res.data`, **bật `withCredentials: true`** (để cookie `refresh_token` HttpOnly tự gửi ở P1), retry refresh-token cho 401 (P0 dùng fake-refresh, P1 sẽ đổi sang `GET /api/v1/auth/refresh` không body), parse error 4xx/5xx → toast |
| `src/lib/react-query.ts` | `queryConfig`: `staleTime` 5m, `gcTime` 10m, `refetchOnWindowFocus: false`, retry rule (no-retry 4xx, max 2 với 5xx). Export `new QueryClient({ defaultOptions: queryConfig })` |
| `src/lib/auth/token-storage.ts` | `localStorage` wrapper: `getAccessToken / setAccessToken / getRefreshToken / setRefreshToken / clear`. Key: `auth.access`, `auth.refresh`. **Lưu ý:** `getRefreshToken/setRefreshToken` chỉ phục vụ fake-flow ở P0. Ở P1, refresh token là cookie HttpOnly do BE quản — 2 hàm này sẽ bị xoá |
| `src/lib/auth/auth-api.ts` | `login(email, password)`, `logout()`, `refreshAccessToken()`, `getAccount()` — gọi `/api/v1/auth/login` (POST), `/api/v1/auth/logout` (POST), `/api/v1/auth/refresh` (**GET**, không body, dùng cookie), `/api/v1/auth/account` (GET). Chưa dùng ở P0, có sẵn cho P1. **Lưu ý**: login response trả `access_token` (snake_case), `user: {id, email, fullName}`, `role: {roleId, roleName}` — KHÔNG có `refreshToken` trong body (đi qua cookie) |
| `src/lib/auth/auth-context.tsx` | `AuthProvider` + hook `useAuth()`. **P0 fake**: `login(username, password)` so sánh hardcoded; `edtech/123456` → role `USER`, `admin/123456` → role `ADMIN`. Lưu user + token giả (`'fake-token'`) vào `tokenStorage`. Đọc lại từ storage khi mount để giữ session qua refresh. **TODO** comment cho P1: thay bằng `authApi.login`; đổi field form `username` → `email`; role values thật BE trả là `MANAGER`, `STUDENT`, … (không phải `USER`/`ADMIN`) — sẽ map ở P1 |
| `src/lib/auth/protected-route.tsx` | Component dùng `<Outlet />`. Đọc `useAuth()`: nếu `!user` → mở login modal (qua `useLoginModal().open()`) và `<Navigate to={paths.home} replace />`; ngược lại render `<Outlet />` |
| `src/lib/auth/role-guard.tsx` | Props `{ role: 'USER' \| 'ADMIN'; children?: ReactNode }`. Nếu `user?.role !== role` → `<Navigate to={paths.home} replace />`; ngược lại render `children ?? <Outlet />` |
| `src/lib/auth/login-modal-context.tsx` | Context nhỏ: `{ isOpen, open(), close() }` để `Navbar` / `ProtectedRoute` cùng mở được modal. Có thể dùng Zustand thay context. |

### 4.2 App shell — viết từ đầu (3 file)

| File | Mô tả |
|---|---|
| `src/app/provider.tsx` | `AppProvider` bọc theo thứ tự: `HelmetProvider` → `QueryClientProvider` → `AuthProvider` → `LoginModalProvider` → children |
| `src/app/router.tsx` | `createBrowserRouter([...])`. Layout cha `<AppLayout>` chứa các route con. Lazy import từng file route bằng `lazy: () => import('./routes/...')`. Áp dụng `<ProtectedRoute>` cho `/schedule`, `/exam`; `<RoleGuard role="ADMIN">` cho `/admin-portal` |
| `src/app/index.tsx` | `export default function App() { return <AppProvider><RouterProvider router={router} /></AppProvider>; }` |

### 4.3 Routes — di chuyển từ `src/pages/` (7 file)

| Đích (mới) | Nguồn (cũ) | Thay đổi |
|---|---|---|
| `src/app/routes/landing.tsx` | `src/pages/app/HomePage.tsx` | Bỏ prop `onCourseClick`; dùng `useNavigate()` + `paths.courseDetail(id)` |
| `src/app/routes/not-found.tsx` | (mới) | Page 404 đơn giản, link về `paths.home` |
| `src/app/routes/app/courses.tsx` | `src/pages/app/CoursesPage.tsx` | Bỏ prop `onCourseClick`; dùng `useNavigate()` |
| `src/app/routes/app/course-detail.tsx` | `src/pages/app/CourseDetailPage.tsx` | Đọc `id` qua `useParams()`, lấy data từ `src/data/courseDetails.ts` (giữ nguyên data cứng cho P0); bỏ prop `onBack`, dùng `useNavigate(-1)` |
| `src/app/routes/app/schedule.tsx` | `src/pages/app/SchedulePage.tsx` | Copy nguyên |
| `src/app/routes/app/exam.tsx` | `src/pages/app/ExamPage.tsx` | Copy nguyên. **Không** copy khối "yêu cầu đăng nhập" trong `App.tsx:104–138` — `ProtectedRoute` đã đảm nhiệm |
| `src/app/routes/admin/admin-portal.tsx` | `src/pages/admin/AdminPortal.tsx` | **Bỏ** `useState isLoggedIn` nội bộ + component `AdminLogin` form (auth do `AuthContext` + `RoleGuard` quản); **giữ** `AdminDashboard` + import `StudentManagement` |

### 4.4 Layout & cleanup

| Hành động | File | Chi tiết |
|---|---|---|
| Tạo mới | `src/components/layouts/app-layout.tsx` | `<div className="flex min-h-screen flex-col"><Navbar /><main className="flex-grow"><Outlet /></main><Footer /><LoginModal /></div>` |
| Sửa | `src/main.tsx` | Thay `<App />` cũ bằng import từ `@/app` (App shell mới): `import App from '@/app';` |
| Xoá | `src/App.tsx` | Toàn bộ logic đã chuyển sang router |
| Xoá thư mục | `src/pages/` | Sau khi xác nhận đã copy hết sang `src/app/routes/` |
| Refactor | `src/components/Navbar.tsx` | Bỏ props `currentView`, `onNavigate`, `isLoggedIn`, `onLoginClick`, `onLogout`. Dùng `<NavLink to={paths.x}>` cho điều hướng, `useAuth()` cho trạng thái login + `logout()`, `useLoginModal().open()` cho nút "Đăng nhập" |
| Refactor | `src/components/LoginModal.tsx` | Bỏ prop `isOpen`, `onClose`, `onLogin`. Đọc `useLoginModal()` cho open/close, gọi `useAuth().login(username, password)` thay cho prop `onLogin`. Giữ form UI cũ |
| Tạo mới | `.env.example` | `VITE_APP_API_URL=http://localhost:8081` |

---

## 5. Layout & login modal — pattern khuyến nghị

```
<AppProvider>                              ← provider.tsx
  <RouterProvider>                         ← router.tsx
    <AppLayout>                            ← layout cha
      <Navbar />                           ← <NavLink>, useAuth, useLoginModal
      <main><Outlet /></main>              ← route con render ở đây
      <Footer />
      <LoginModal />                       ← render 1 lần, mở qua useLoginModal()
    </AppLayout>
  </RouterProvider>
</AppProvider>
```

`useLoginModal()` đảm bảo cả `Navbar` (nút "Đăng nhập") và `ProtectedRoute` (khi user chưa login truy cập `/exam`) đều mở được cùng 1 modal mà không cần prop drilling.

---

## 6. Acceptance criteria (Definition of Done)

- [ ] `pnpm dev` chạy được; truy cập `/`, `/courses`, `/courses/:id` hoạt động không cần login
- [ ] Click "Phòng thi" khi chưa login → mở `LoginModal` (không redirect cứng); login `edtech/123456` thành công → vào được `/exam`
- [ ] Login `admin/123456` → vào được `/admin-portal`; user thường gõ trực tiếp URL `/admin-portal` → redirect về `/`
- [ ] Refresh trang ở mọi route giữ nguyên trạng thái auth (đọc lại `tokenStorage` khi `AuthProvider` mount)
- [ ] `pnpm lint` (`tsc --noEmit`) pass
- [ ] Không còn `import` từ `src/pages/` hay `src/App.tsx` ở bất kỳ file nào
- [ ] `useQuery` đặt thử ở bất kỳ route nào không lỗi `No QueryClient set` ⇒ `QueryClientProvider` đã bao phủ
- [ ] `Navbar` không còn nhận prop `currentView` / `onNavigate`; `LoginModal` không còn nhận prop `isOpen` / `onLogin`
- [ ] Axios client đã bật `withCredentials: true` (chuẩn bị cho cookie refresh ở P1)
- [ ] `.env.example` ghi `VITE_APP_API_URL=http://localhost:8081`, không phải 8080

---

## 7. Verification

```powershell
pnpm install
pnpm dev                # mở http://localhost:3000
pnpm lint               # tsc --noEmit, phải pass
pnpm build              # smoke build, phải pass
```

**Smoke test thủ công:** đi qua từng dòng ở **bảng mục 3** + **mục 6**.

---

## 8. Lưu ý chuyển tiếp sang P1 / P2 / P3

- `AuthContext.login()` đang fake (so sánh hardcoded). **TODO** trong code cho P1:
  - Thay bằng `authApi.login(email, password)` (form đổi `username` → `email`).
  - Xoá `getRefreshToken/setRefreshToken` khỏi `token-storage.ts` — refresh sẽ dùng cookie HttpOnly.
  - Đổi interceptor refresh sang `GET /api/v1/auth/refresh` (không body).
  - Map response login: `access_token` (snake_case) → `accessToken` ở app; tách `role` object riêng khỏi `user`.
  - Map role thật BE (`MANAGER`, `STUDENT`, …) sang enum FE — bỏ `'USER'|'ADMIN'` hardcoded.
- `Navbar`, `Footer`, `LoginModal` còn để ở `src/components/` — sẽ tách sang `components/layouts/`, `components/ui/` ở P1.
- Toolchain test/lint (ESLint, Prettier, Vitest, MSW) chưa setup — P2.
- File component vẫn `PascalCase.tsx`; convention `kebab-case` (theo `eslint-plugin-check-file`) làm ở P3.
- Deps lạ (`express`, `@types/express`, `dotenv`, `tsx`, `@google/genai`) chưa dọn — P3.

---

## Phụ lục — checklist thi công theo thứ tự đề xuất

1. `src/config/env.ts`, `src/config/paths.ts`, `.env.example`
2. `src/lib/react-query.ts`, `src/lib/api-client.ts`
3. `src/lib/auth/token-storage.ts`, `auth-api.ts`
4. `src/lib/auth/auth-context.tsx`, `login-modal-context.tsx`
5. `src/lib/auth/protected-route.tsx`, `role-guard.tsx`
6. `src/components/layouts/app-layout.tsx`
7. Refactor `src/components/Navbar.tsx`, `LoginModal.tsx`
8. Tạo các file route trong `src/app/routes/**` (copy từ `src/pages/`)
9. `src/app/router.tsx`, `src/app/provider.tsx`, `src/app/index.tsx`
10. Sửa `src/main.tsx`, xoá `src/App.tsx`, xoá `src/pages/`
11. `pnpm lint` + smoke test ⇒ tick acceptance criteria
