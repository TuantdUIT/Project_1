# P1 — Hướng dẫn dùng Hook trong dự án

> Tài liệu bổ trợ cho [P1-FEATURES-PLAN.md](./P1-FEATURES-PLAN.md). Trả lời câu hỏi "khi nào dùng hook nào" khi viết feature mới ở P1. Áp dụng riêng cho stack dự án này: React 18 + TanStack Query 5 + react-router 7 + react-hook-form + axios + Spring Boot.

---

## 1. Mục tiêu

Khi viết một component / feature mới, có 2 câu hỏi cần trả lời rất nhanh:

1. **Cần dữ liệu từ BE?** → dùng hook nào (`useQuery`, `useMutation`)?
2. **Cần state nào đó?** → đặt ở đâu (`useState`, Context, Zustand, hay không cần state)?

Tài liệu này gom convention dự án để câu trả lời thống nhất.

---

## 2. Sơ đồ quyết định — chọn hook cho 1 nhu cầu

```
                  ┌──────────────────────────┐
                  │  Tôi cần làm gì?         │
                  └────────────┬─────────────┘
                               │
        ┌──────────────────────┼─────────────────────┐
        │                      │                     │
        ▼                      ▼                     ▼
  ĐỌC data từ BE       GỬI data lên BE          State khác
  (GET)                (POST/PUT/DELETE)
        │                      │                     │
        ▼                      ▼                     │
   useQuery              useMutation                 │
                              │                      │
                       (kèm useQueryClient           │
                        khi cần invalidate           │
                        cache khác)                  │
                                                     │
        ┌────────────────────────────────────────────┤
        │                                            │
        ▼                                            ▼
  Form input đang gõ?                       Side effect không phải data?
  → react-hook-form (useForm)               (DOM event, localStorage, lib ngoài)
                                            → useEffect
        ┌────────────────────────────────────────────┤
        │                                            │
        ▼                                            ▼
  URL/route info?                           UI state cục bộ component
  → useParams, useSearchParams,             (modal open, accordion expand)
    useNavigate                             → useState
        ┌────────────────────────────────────────────┤
        │                                            │
        ▼                                            ▼
  State chia sẻ giữa các route?             Auth/login modal toàn app?
  → Zustand store ở features/<domain>/     → useAuth(), useLoginModal()
    stores/
```

---

## 3. TanStack Query — server state

### 3.1 `useQuery` — đọc data (GET)

**Quy tắc đặt `queryKey`:**

```
[<domain>, <resource>, <params...>]

Ví dụ:
['courses']                                ← list tất cả khoá
['courses', id]                            ← chi tiết 1 khoá
['courses', id, 'lessons']                 ← lessons của khoá
['courses', { grade: '2k8', page: 0 }]     ← list với filter
['admin', 'students', { page, size, q }]   ← admin domain
['auth', 'me']                             ← user hiện tại
```

> Quy tắc: `queryKey` thay đổi → Query tự refetch. Nếu cần "refetch khi `id` đổi", **đưa `id` vào `queryKey`**, không dùng `useEffect`.

**Template viết hook trong `features/<domain>/api/*.ts`:**

```ts
// features/courses/api/courses.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { PaginatedResult } from '@/utils/pagination';
import type { Course, CourseFilters } from '../types';

export function useCoursesQuery(filters: CourseFilters = {}) {
  return useQuery({
    queryKey: ['courses', filters],
    queryFn: () => apiClient.get<PaginatedResult<Course>>('/api/courses', { params: filters }),
    staleTime: 10 * 60 * 1000,    // override default 5 phút (course ít đổi)
  });
}

export function useCourseQuery(id: string | undefined) {
  return useQuery({
    queryKey: ['courses', id],
    queryFn: () => apiClient.get<Course>(`/api/courses/${id}`),
    enabled: Boolean(id),         // không gọi nếu id chưa có
  });
}
```

**Dùng trong component:**

```tsx
function CoursesRoute() {
  const { data, isLoading, error, isFetching } = useCoursesQuery({ grade: '2k8' });

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorState error={error} />;
  if (!data?.content.length) return <EmptyState />;

  return data.content.map((c) => <CourseCard key={c.id} course={c} />);
}
```

**Phân biệt 3 trạng thái loading:**

| State | Ý nghĩa |
|---|---|
| `isLoading` | Lần đầu fetch, chưa có cache. Dùng để show **Skeleton lớn** |
| `isFetching` | Đang fetch (kể cả lần 2 trở đi, có cache cũ). Dùng để show **spinner nhỏ** ở góc |
| `isPending` | Alias mới của `isLoading` ở v5 — cùng nghĩa |

### 3.2 `useMutation` — ghi data (POST/PUT/DELETE)

```ts
// features/admin/api/students.ts
export function useCreateStudent() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateStudentRequest) =>
      apiClient.post<Student>('/api/admin/students', body),

    onSuccess: () => {
      // Invalidate để bảng tự refresh
      qc.invalidateQueries({ queryKey: ['admin', 'students'] });
    },
  });
}
```

**Dùng trong component:**

```tsx
function CreateStudentDialog() {
  const { mutate, isPending, error } = useCreateStudent();

  const onSubmit = (values: CreateStudentRequest) => {
    mutate(values, {
      onSuccess: () => {
        toast.success('Tạo học sinh thành công');
        closeDialog();
      },
      onError: (err) => {
        // Field-level errors từ Spring @Valid
        const parsed = parseApiError(err);
        Object.entries(parsed.fieldErrors ?? {}).forEach(([field, msg]) => {
          form.setError(field, { message: msg });
        });
      },
    });
  };
}
```

**`mutate` vs `mutateAsync`:**

| Khi dùng | Tool |
|---|---|
| Chỉ cần fire-and-forget, dùng callback `onSuccess`/`onError` | `mutate(values)` |
| Cần `await` để chờ kết quả (vd: gọi nhiều mutation tuần tự) | `await mutateAsync(values)` |

### 3.3 `useQueryClient` — invalidate cache

Sau khi mutation thành công, **bảng/list cũ trong cache không tự biết là dữ liệu đã đổi**. Phải invalidate thủ công:

```ts
// Vô hiệu hoá MỘT key cụ thể
qc.invalidateQueries({ queryKey: ['admin', 'students'] });

// Vô hiệu hoá TẤT CẢ key bắt đầu bằng ['courses']
qc.invalidateQueries({ queryKey: ['courses'] });
// → ['courses'], ['courses', id], ['courses', id, 'lessons'] đều bị invalidate

// Cập nhật trực tiếp cache không refetch (tối ưu cho realtime)
qc.setQueryData(['courses', id], (old) => ({ ...old, status: 'ACTIVE' }));
```

**Quy tắc invalidate sau mutation:**

| Mutation | Invalidate |
|---|---|
| `createStudent` | `['admin', 'students']` |
| `updateStudent(id)` | `['admin', 'students']` + `['admin', 'students', id]` |
| `deleteStudent(id)` | `['admin', 'students']` |
| `login()` | `['auth', 'me']` (để hydrate lại user) |
| `logout()` | `qc.clear()` (xoá toàn bộ — user đã đăng xuất) |

### 3.4 Convention `queryKey` trong dự án

```ts
// features/auth/api/auth.ts
['auth', 'me']

// features/courses/api/courses.ts
['courses']
['courses', id]
['courses', filters]

// features/courses/api/lessons.ts
['courses', id, 'lessons']
['lessons', lessonId]

// features/schedule/api/schedule.ts
['schedule', 'me', { from, to }]
['schedule', { grade }]

// features/admin/api/*.ts
['admin', 'stats']
['admin', 'students', filters]
['admin', 'students', id]
['admin', 'teachers', 'performance']
['admin', 'schedule', { date }]
```

> **Tránh:** key trùng ở 2 domain khác nhau (vd `['students']` ở cả admin và teacher → đụng cache). Luôn prefix `<domain>`.

---

## 4. `useEffect` — chỉ dùng cho **side effect không phải fetch**

### 4.1 KHÔNG dùng useEffect cho:

| ❌ Anti-pattern | ✅ Đúng |
|---|---|
| `useEffect(() => fetch(url), [])` | `useQuery` |
| `useEffect(() => fetch(url), [id])` | `useQuery` với `id` trong `queryKey` |
| `useEffect(() => form.reset(), [success])` | `useMutation({ onSuccess: () => form.reset() })` |
| `useEffect(() => toast(error), [error])` | `useMutation({ onError })` (hoặc đã có ở axios interceptor) |
| `useEffect(() => navigate('/x'), [success])` | `useMutation({ onSuccess: () => navigate('/x') })` |

### 4.2 VẪN dùng useEffect cho:

```ts
// 1. Đồng bộ với localStorage / sessionStorage
useEffect(() => {
  const saved = localStorage.getItem('theme');
  if (saved) setTheme(saved);
}, []);

// 2. Subscribe DOM event
useEffect(() => {
  const onResize = () => setWidth(window.innerWidth);
  window.addEventListener('resize', onResize);
  return () => window.removeEventListener('resize', onResize);
}, []);

// 3. Mở modal khi state đổi (như ProtectedRoute hiện tại)
useEffect(() => {
  if (!user) open(location.pathname);
}, [user, location.pathname, open]);

// 4. Khởi tạo lib bên thứ ba
useEffect(() => {
  const chart = new Chart(ref.current, config);
  return () => chart.destroy();
}, []);
```

### 4.3 Quy tắc tự kiểm tra

> **Trước khi viết `useEffect`, hỏi: "đây có phải fetch data không?"**
>
> - Có → bỏ `useEffect`, dùng `useQuery`
> - Không → mới viết `useEffect`

---

## 5. `useState` — chỉ cho **client state cục bộ**

### 5.1 Dùng useState khi

- UI state cục bộ component: modal open/close, accordion expand, tab active, hover state
- State **chỉ component đó (và con)** quan tâm
- Không cần persist sau F5

```tsx
const [isProfileOpen, setIsProfileOpen] = useState(false);
const [expandedWeeks, setExpandedWeeks] = useState<number[]>([0]);
const [searchQuery, setSearchQuery] = useState('');
```

### 5.2 KHÔNG dùng useState cho

| ❌ | ✅ |
|---|---|
| Lưu data từ BE | `useQuery` (data nằm trong cache) |
| Lưu user đang login | `useAuth()` (Context) |
| Lưu danh sách filter chia sẻ giữa nhiều component | `useSearchParams` (URL) hoặc Zustand |
| Lưu form input | `useForm` (react-hook-form) |
| Derived state (tính từ state khác) | `useMemo` hoặc tính trực tiếp khi render |

### 5.3 Anti-pattern điển hình — lưu data từ Query vào useState

```tsx
// ❌ SAI
function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const { data } = useCoursesQuery();
  useEffect(() => {
    if (data) setCourses(data.content);
  }, [data]);
  return courses.map(...);
}

// ✅ ĐÚNG
function CoursesPage() {
  const { data } = useCoursesQuery();
  return data?.content.map(...);
}
```

→ `useQuery` đã là cache rồi. Đừng "cache chồng cache" bằng `useState`.

---

## 6. React Router hooks

| Hook | Dùng để | Ví dụ |
|---|---|---|
| `useParams` | Đọc `:id` từ URL | `const { id } = useParams(); useCourseQuery(id)` |
| `useSearchParams` | Đọc/sửa `?query=string` | `const [params, setParams] = useSearchParams()` |
| `useNavigate` | Chuyển trang bằng code | `navigate(paths.courseDetail(id))` |
| `useLocation` | Đọc `pathname` hiện tại | Dùng trong ProtectedRoute để lưu redirectTo |
| `<NavLink>` / `<Link>` | Chuyển trang bằng UI | Dùng thay `<a href>` |

**Pattern: filter từ URL → query:**

```tsx
function CoursesRoute() {
  const [params] = useSearchParams();
  const grade = params.get('grade') ?? undefined;
  const page = Number(params.get('page') ?? '0');

  const { data } = useCoursesQuery({ grade, page });
  // URL đổi → searchParams đổi → queryKey đổi → tự refetch
}
```

→ **Filter qua URL** giúp user share link, F5 giữ filter, browser back/forward chạy đúng.

---

## 7. react-hook-form — kết hợp với mutation

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const loginSchema = z.object({
  username: z.string().min(1, 'Bắt buộc'),
  password: z.string().min(6, 'Tối thiểu 6 ký tự'),
});

type LoginForm = z.infer<typeof loginSchema>;

function LoginForm() {
  const form = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const { mutate: login, isPending } = useLogin();

  const onSubmit = (values: LoginForm) => {
    login(values, {
      onError: (err) => {
        const parsed = parseApiError(err);
        Object.entries(parsed.fieldErrors ?? {}).forEach(([field, msg]) => {
          form.setError(field as keyof LoginForm, { message: msg });
        });
      },
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register('username')} />
      {form.formState.errors.username && <p>{form.formState.errors.username.message}</p>}

      <button disabled={isPending}>
        {isPending ? 'Đang đăng nhập...' : 'Đăng nhập'}
      </button>
    </form>
  );
}
```

**Quy tắc field errors:**

- Validation **client-side** (bắt buộc, độ dài, regex) → Zod schema, react-hook-form tự bắt
- Validation **server-side** (email đã tồn tại, mật khẩu sai) → Spring `@Valid` trả `errors[]` → `parseApiError` → `form.setError(field, ...)`

---

## 8. Custom hooks của dự án

### 8.1 Đã có (từ P0)

| Hook | File | Chức năng |
|---|---|---|
| `useAuth()` | [src/lib/auth/auth-context.tsx](../src/lib/auth/auth-context.tsx) | `{ user, isAuthenticated, login, logout }` |
| `useLoginModal()` | [src/lib/auth/login-modal-context.tsx](../src/lib/auth/login-modal-context.tsx) | `{ isOpen, open, close, redirectTo, consumeRedirectTo }` |
| `useDisclosure()` | [src/hooks/use-disclosure.ts](../src/hooks/use-disclosure.ts) | Open/close cho dialog |
| `useToast()` | [src/hooks/use-toast.ts](../src/hooks/use-toast.ts) | Hiển thị toast |

### 8.2 Sẽ viết ở P1

| Vị trí | Hook |
|---|---|
| `features/auth/api/auth.ts` | `useLogin`, `useLogout`, `useMe` |
| `features/courses/api/courses.ts` | `useCoursesQuery`, `useCourseQuery` |
| `features/courses/api/lessons.ts` | `useCourseLessonsQuery`, `useLessonQuery` |
| `features/schedule/api/schedule.ts` | `useMyScheduleQuery`, `useScheduleByGradeQuery` |
| `features/admin/api/*.ts` | `useAdminStatsQuery`, `useStudentsQuery`, `useCreateStudent`, ... |

### 8.3 Convention đặt tên

```
useXxxQuery       → useQuery (đọc data)
useXxx            → useMutation (ghi data) — không hậu tố
                    Vd: useLogin, useLogout, useCreateStudent

useXxxMutation    → cũng được, nhưng dài. Chọn 1 trong 2 và nhất quán
```

Dự án dùng quy ước: **`useXxxQuery` cho query**, **`useXxx` (verb) cho mutation** (theo style Bulletproof React).

---

## 9. Anti-patterns thường gặp — danh sách kiểm

### 9.1 ❌ Fetch data bằng useEffect

```tsx
useEffect(() => {
  fetch('/api/courses').then(r => r.json()).then(setCourses);
}, []);
```

→ Dùng `useQuery`.

### 9.2 ❌ Lưu Query data vào useState

```tsx
const [courses, setCourses] = useState([]);
const { data } = useCoursesQuery();
useEffect(() => setCourses(data ?? []), [data]);
```

→ Dùng trực tiếp `data`. Cache đã ở trong Query.

### 9.3 ❌ Gọi mutation trong useEffect

```tsx
useEffect(() => {
  if (formSubmitted) {
    apiClient.post('/api/x', data);
  }
}, [formSubmitted]);
```

→ Dùng `useMutation` + gọi `mutate()` trong onSubmit handler.

### 9.4 ❌ queryKey thiếu params

```tsx
useQuery({
  queryKey: ['courses'],         // không có filter!
  queryFn: () => apiClient.get('/api/courses', { params: filters }),
});
```

→ Nếu `filters` đổi mà `queryKey` không đổi → Query trả cache cũ. **Mọi biến trong `queryFn` phải có trong `queryKey`**.

### 9.5 ❌ Quên `enabled` khi key có thể undefined

```tsx
const { id } = useParams();
useQuery({
  queryKey: ['courses', id],
  queryFn: () => apiClient.get(`/api/courses/${id}`),
  // KHÔNG có enabled → khi id là undefined vẫn gọi /api/courses/undefined
});
```

→ Thêm `enabled: Boolean(id)`.

### 9.6 ❌ Invalidate quá rộng

```tsx
useMutation({
  mutationFn: createStudent,
  onSuccess: () => qc.invalidateQueries(),    // ← invalidate TẤT CẢ
});
```

→ Chỉ invalidate đúng key liên quan: `qc.invalidateQueries({ queryKey: ['admin', 'students'] })`.

### 9.7 ❌ Không xử lý loading/error state

```tsx
const { data } = useCoursesQuery();
return data.content.map(...);     // crash nếu data còn undefined
```

→ Luôn handle `isLoading`, `error`, empty state trước khi `data!.x.y.z`.

### 9.8 ❌ Tự retry/cancel thủ công

```tsx
useEffect(() => {
  const ctrl = new AbortController();
  fetch(url, { signal: ctrl.signal });
  return () => ctrl.abort();
}, [url]);
```

→ Query lo cancel + retry. Bỏ.

### 9.9 ❌ Đặt token vào useState rồi gửi tay

```tsx
const [token, setToken] = useState(localStorage.getItem('token'));
fetch(url, { headers: { Authorization: `Bearer ${token}` } });
```

→ `apiClient` (axios interceptor) đã tự lấy từ `tokenStorage` và gắn header. Đừng làm tay.

---

## 10. Cheatsheet 1 trang

```
┌──────────────────────────────────────────────────────────────────┐
│ NHU CẦU                                  HOOK / TOOL             │
├──────────────────────────────────────────────────────────────────┤
│ GET data từ BE                           useQuery                │
│ GET với id từ URL                        useParams + useQuery    │
│ GET với filter từ URL                    useSearchParams + useQuery │
│ POST/PUT/DELETE                          useMutation             │
│ Refresh list sau mutation                onSuccess + invalidateQueries │
│ Form input đang gõ                       useForm (react-hook-form) │
│ Validate input client-side               Zod schema + zodResolver │
│ Hiển thị lỗi field từ Spring @Valid      form.setError + parseApiError │
│ Modal/dialog mở/đóng cục bộ              useState                │
│ Modal login dùng nhiều nơi               useLoginModal()         │
│ User hiện tại                            useAuth()               │
│ Chuyển trang bằng code                   useNavigate             │
│ <a href> link                            <Link> / <NavLink>      │
│ Đồng bộ với localStorage                 useEffect (mount)       │
│ Subscribe DOM event                      useEffect + return cleanup │
│ Khởi tạo lib bên thứ ba (chart, map)     useEffect + return cleanup │
│ Toast lỗi từ axios                       Đã tự động qua interceptor │
│ Header Bearer token                      Đã tự động qua interceptor │
│ Refresh token khi 401                    Đã tự động qua interceptor │
└──────────────────────────────────────────────────────────────────┘

3 nguyên tắc vàng:
1. Cần data từ BE? → Query, KHÔNG dùng useEffect.
2. queryKey phải chứa MỌI biến mà queryFn dùng.
3. useState chỉ cho UI state cục bộ — KHÔNG cho data, KHÔNG cho user, KHÔNG cho form input.
```

---

## 11. Tham khảo

- TanStack Query v5: https://tanstack.com/query/latest
- Bulletproof React (gốc của convention dự án): https://github.com/alan2207/bulletproof-react
- "You Might Not Need an Effect" (React docs): https://react.dev/learn/you-might-not-need-an-effect
- react-hook-form + Zod: https://react-hook-form.com/get-started#SchemaValidation
- Cấu trúc dự án: [CODEBASE_STRUCTURE.react-spring-mysql.v2.md](../CODEBASE_STRUCTURE.react-spring-mysql.v2.md)
- Plan P0 wiring: [P0-WIRING-PLAN.md](./P0-WIRING-PLAN.md)
- Plan P1 features: [P1-FEATURES-PLAN.md](./P1-FEATURES-PLAN.md)
