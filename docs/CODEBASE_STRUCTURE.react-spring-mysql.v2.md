# Cấu trúc Codebase — React + Spring Boot + MySQL

Tài liệu tham chiếu cho dự án **Frontend React** giao tiếp với **Backend Spring Boot + MySQL** qua REST API. Áp dụng mô hình **Feature-based** (mỗi domain nghiệp vụ tự đóng gói).

---

## 1. Tech stack

### Frontend
| Lớp | Công nghệ |
|---|---|
| Build / Dev | Vite 5, TypeScript 5 |
| UI | React 18, TailwindCSS, Radix UI, shadcn-style components, Lucide |
| Routing | React Router 7 (data router, lazy routes) |
| Server state | TanStack Query 5 |
| Client state | Zustand |
| Form | react-hook-form + Zod |
| HTTP | Axios (một instance duy nhất, có refresh-token interceptor) |
| Test | Vitest, Testing Library, Playwright |
| Mock API khi dev | MSW (theo schema OpenAPI từ Spring) |
| Lint / Format | ESLint, Prettier, `eslint-plugin-check-file` (ép kebab-case) |

### Backend (tham chiếu — không nằm trong repo FE)
| Lớp | Công nghệ |
|---|---|
| Framework | Spring Boot 3.x |
| Auth | Spring Security + JWT (access token + refresh token) |
| ORM | Spring Data JPA / Hibernate |
| Database | MySQL 8 |
| Migration | Flyway hoặc Liquibase |
| API doc | springdoc-openapi (Swagger UI tại `/swagger-ui.html`) |

---

## 2. Sơ đồ thư mục

```
<project>/
├── public/
├── docs/
├── src/
│   ├── app/                      # Entry, providers, routing, pages
│   │   ├── index.tsx
│   │   ├── provider.tsx          # QueryClientProvider, AuthProvider, HelmetProvider
│   │   ├── router.tsx            # createBrowserRouter (lazy + ProtectedRoute)
│   │   └── routes/
│   │       ├── landing.tsx
│   │       ├── not-found.tsx
│   │       ├── auth/             # login, register, forgot-password
│   │       ├── app/              # User area (Protected)
│   │       └── admin/            # Admin area (role-guarded)
│   ├── assets/
│   ├── components/               # UI dùng chung (cross-feature)
│   │   ├── ui/                   # shadcn-style: button, dialog, form, table, ...
│   │   ├── layouts/              # app-layout, admin-layout, auth-layout, ...
│   │   ├── seo/                  # <Head> wrapper Helmet
│   │   └── errors/
│   ├── config/
│   │   ├── env.ts                # Validate VITE_APP_* bằng Zod
│   │   └── paths.ts              # Single source of truth cho route paths
│   ├── features/                 # Module theo domain nghiệp vụ
│   │   └── <domain>/             # vd: users, products, orders
│   │       ├── api/              # useQuery / useMutation gọi Spring endpoint
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── stores/           # Zustand store cục bộ (nếu cần)
│   │       ├── types/            # DTO mirror Spring class
│   │       ├── utils/
│   │       └── index.ts          # Public API của feature
│   ├── hooks/                    # Hooks dùng chung
│   │   ├── use-disclosure.ts
│   │   └── use-toast.ts
│   ├── lib/                      # Tích hợp bên thứ ba & lõi I/O
│   │   ├── api-client.ts         # Axios instance + interceptors
│   │   ├── react-query.ts        # queryConfig (staleTime, gcTime)
│   │   └── auth/
│   │       ├── auth-context.tsx  # AuthProvider, useAuth
│   │       ├── auth-api.ts       # /api/auth/login, /refresh, /logout, /me
│   │       ├── token-storage.ts  # Lưu/đọc/xoá JWT
│   │       ├── protected-route.tsx
│   │       └── role-guard.tsx
│   ├── types/                    # Type cross-feature
│   │   ├── api.ts                # Page<T>, ApiError, ApiResponse<T>
│   │   ├── auth.ts               # User, Role, JwtPayload
│   │   └── <domain>.ts
│   ├── utils/                    # Hàm thuần (no React, no I/O)
│   │   ├── api-errors.ts         # Parse Spring error envelope
│   │   ├── date.ts               # Parse LocalDate / LocalDateTime
│   │   ├── pagination.ts         # Page<T> ↔ state FE (0-based ↔ 1-based)
│   │   ├── format.ts
│   │   └── cn.ts                 # clsx + tailwind-merge
│   ├── index.css
│   └── main.tsx
├── .env.example                  # VITE_APP_API_URL=http://localhost:8080
├── vite.config.ts
├── tailwind.config.cjs
├── tsconfig.json
└── README.md
```

---

## 3. Hợp đồng dữ liệu với Spring Boot

Đây là phần **then chốt** giúp FE đồng bộ với BE — phải reflect đúng các shape mặc định của Spring.

### 3.1. Auth — JWT flow

```
POST /api/auth/login        body: { email, password }
                            ← { accessToken, refreshToken, user }

POST /api/auth/refresh      body: { refreshToken }
                            ← { accessToken, refreshToken }

POST /api/auth/logout       (revoke refresh token)

GET  /api/auth/me           ← { id, email, fullName, roles: ["USER" | "ADMIN"] }
```

`src/lib/api-client.ts` (rút gọn):
```ts
import axios from 'axios';
import { env } from '@/config/env';
import { tokenStorage } from '@/lib/auth/token-storage';
import { refreshAccessToken } from '@/lib/auth/auth-api';
import { parseApiError } from '@/utils/api-errors';

export const api = axios.create({ baseURL: env.API_URL });

api.interceptors.request.use((cfg) => {
  const token = tokenStorage.getAccessToken();
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  cfg.headers.Accept = 'application/json';
  return cfg;
});

api.interceptors.response.use(
  (res) => res.data,                          // unwrap data
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const ok = await refreshAccessToken();
      if (ok) return api(original);           // retry với token mới
      tokenStorage.clear();
      window.location.href = '/login';
    }
    toast(parseApiError(error));
    return Promise.reject(error);
  },
);
```

### 3.2. Pagination — `org.springframework.data.domain.Page<T>`

Mọi endpoint list mặc định trả về:
```json
{
  "content": [ /* items */ ],
  "pageable": { "pageNumber": 0, "pageSize": 20 },
  "totalElements": 134,
  "totalPages": 7,
  "number": 0,
  "size": 20,
  "first": true,
  "last": false,
  "empty": false
}
```

`src/types/api.ts`:
```ts
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;        // current page (0-based)
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
```

> ⚠️ **Bẫy phổ biến:** Spring page là **0-based**, UI thường hiển thị 1-based. Luôn convert tập trung trong `utils/pagination.ts`, **không** rải `+1` / `-1` khắp UI.

### 3.3. Sort & filter — query string

Convention chuẩn của Spring Data:
```
GET /api/products?page=0&size=20&sort=createdAt,desc&sort=name,asc
GET /api/products?status=ACTIVE&minPrice=100
```
Viết helper `buildPageQuery({ page, size, sort, ...filters })` trong `utils/pagination.ts` để tránh nối tay.

### 3.4. Error envelope của Spring

Mặc định:
```json
{
  "timestamp": "2025-01-15T10:30:00.000+00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Email đã tồn tại",
  "path": "/api/users"
}
```

Khi `@Valid` fail (validation lỗi), thường có thêm:
```json
{
  ...,
  "errors": [
    { "field": "email", "defaultMessage": "must be a valid email" },
    { "field": "password", "defaultMessage": "size must be between 6 and 50" }
  ]
}
```

`src/utils/api-errors.ts` cần parse cả 2 dạng:
```ts
interface ApiError {
  title: string;
  message: string;
  fieldErrors?: Record<string, string>;
}

export const parseApiError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error) && error.response) {
    const data = error.response.data;
    const fieldErrors: Record<string, string> = {};
    if (Array.isArray(data?.errors)) {
      data.errors.forEach((e: any) => {
        if (e.field) fieldErrors[e.field] = e.defaultMessage;
      });
    }
    return {
      title: data?.error ?? 'Error',
      message: data?.message ?? 'An unexpected error occurred',
      fieldErrors: Object.keys(fieldErrors).length ? fieldErrors : undefined,
    };
  }
  return { title: 'Error', message: 'Network error' };
};
```

> Trong form, dùng `fieldErrors` để gán vào `setError(field, ...)` của react-hook-form — đồng bộ validation BE/FE.

### 3.5. Date / DateTime

| Kiểu Java | JSON shape | Cách parse FE |
|---|---|---|
| `LocalDate` | `"2025-01-15"` | `dayjs(s)` |
| `LocalDateTime` | `"2025-01-15T10:30:00"` (không có TZ) | `dayjs(s)` — coi như local time |
| `Instant` / `ZonedDateTime` | `"2025-01-15T10:30:00Z"` | `dayjs(s)` (UTC) |

> Tập trung logic parse / format trong `utils/date.ts`, **không** gọi `new Date(string)` rải rác (xử lý timezone không nhất quán giữa các browser).

### 3.6. CORS & cookies

| Chiến lược JWT | FE cần | BE cần |
|---|---|---|
| Header `Authorization: Bearer` | Không cần `withCredentials` | `CorsConfigurationSource` cho origin của FE |
| httpOnly cookie | `axios.defaults.withCredentials = true` | `Access-Control-Allow-Credentials: true` + origin tường minh (không dùng `*`) |

---

## 4. Quy tắc đặt code

### 4.1. Cây phụ thuộc đơn hướng

```
app  ──▶  features  ──▶  components / hooks / lib  ──▶  types / utils / config
```

- `features/A` **không** import từ `features/B` → cần dùng chung thì nâng lên `components/`, `hooks/`, hoặc `lib/`.
- `components/`, `hooks/`, `lib/` **không** import từ `features/` hoặc `app/`.
- `utils/` **không** import React, **không** gọi network.

### 4.2. Đặt code mới ở đâu?

| Tình huống | Vị trí |
|---|---|
| Trang mới | `src/app/routes/...` + thêm vào `config/paths.ts` |
| UI cho 1 domain | `src/features/<domain>/components/` |
| UI dùng chung ≥ 2 nơi | `src/components/ui/` hoặc `src/components/<group>/` |
| Hook chỉ cho 1 feature | `src/features/<domain>/hooks/` |
| Hook dùng chung | `src/hooks/` |
| Endpoint Spring mới (cục bộ feature) | `src/features/<domain>/api/<resource>.ts` |
| Endpoint cross-feature (auth, user) | `src/lib/<resource>-api.ts` |
| DTO mirror Spring (cục bộ) | `src/features/<domain>/types.ts` |
| DTO cross-feature | `src/types/` |
| Helper format / parse / validate | `src/utils/` |
| Biến môi trường mới | `config/env.ts` (Zod) + `.env.example` |

### 4.3. Naming convention

- **File:** `kebab-case.tsx` / `kebab-case.ts` (enforce qua `eslint-plugin-check-file`).
- **Component:** `PascalCase`.
- **Hook:** `useXxx`.
- **DTO:** đặt **đúng tên class Java** ở Spring (vd: `UserResponse`, `CreateUserRequest`, `PageRequestParams`) → dễ tra cứu chéo FE-BE.
- **Folder con cho component "nặng":** `components/ui/button/` chứa `button.tsx`, `button.stories.tsx`, `index.ts`.

### 4.4. Import alias

Cấu hình `@/*` → `src/*` trong `vite.config.ts` + `tsconfig.json`. **Luôn** dùng `@/...`:

```ts
import { api } from '@/lib/api-client';        // ✅
import { api } from '../../../lib/api-client'; // ❌
```

---

## 5. Luồng dữ liệu

```
React component
  └── hook (use-*)                        ← TanStack Query cache
        └── features/<domain>/api/*.ts    (useQuery / useMutation)
              └── lib/api-client.ts (axios)
                    ├─ Request interceptor:
                    │     • gắn Authorization: Bearer <accessToken>
                    │     • set Accept: application/json
                    ├─ Response interceptor:
                    │     • 2xx  → unwrap response.data
                    │     • 401  → gọi /api/auth/refresh → retry; fail → redirect /login
                    │     • 4xx/5xx → parseApiError → toast + reject
                    └─ baseURL = env.API_URL
                         │
                         ▼
                   Spring Boot REST
                         │
                  Controller → Service → Repository (JPA)
                         │
                         ▼
                       MySQL
```

**TanStack Query config gợi ý** (`src/lib/react-query.ts`):
```ts
export const queryConfig = {
  queries: {
    staleTime: 1000 * 60 * 5,         // 5 phút
    gcTime: 1000 * 60 * 10,           // 10 phút
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Không retry 4xx, retry tối đa 2 lần với 5xx
      const status = (error as any)?.response?.status;
      if (status >= 400 && status < 500) return false;
      return failureCount < 2;
    },
  },
  mutations: { retry: false },
} satisfies DefaultOptions;
```

**Cache invalidation pattern cho mutation:**
```ts
export const useCreateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateProductRequest) => api.post('/api/products', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
};
```

---

## 6. Đồng bộ DTO với Spring (khuyến nghị mạnh)

Thay vì viết tay từng `interface` mirror DTO Java, dùng **OpenAPI codegen**:

```bash
# Spring đã có springdoc-openapi → /v3/api-docs
yarn add -D openapi-typescript

# Sinh type tự động khi BE đổi:
npx openapi-typescript http://localhost:8080/v3/api-docs -o src/types/openapi.ts
```

Lợi ích:
- DTO luôn đúng theo BE, không lệch khi BE refactor.
- Có autocomplete cho path, query param, response body.
- Kết hợp `openapi-fetch` hoặc tự wrap quanh axios để type-safe end-to-end.

---

## 7. Checklist khởi tạo dự án

- [ ] `pnpm create vite@latest <name> -- --template react-ts`
- [ ] Cài deps chính: `axios`, `@tanstack/react-query`, `react-router`, `react-hook-form`, `zod`, `@hookform/resolvers`, `zustand`, `dayjs`, `clsx`, `tailwind-merge`, `lucide-react`.
- [ ] Cài Tailwind + init shadcn/ui CLI.
- [ ] Cài dev: `eslint`, `prettier`, `eslint-plugin-check-file`, `vitest`, `@testing-library/react`, `msw`, `playwright`.
- [ ] Tạo cây thư mục `src/` đúng sơ đồ ở mục 2.
- [ ] Cấu hình alias `@/*` trong `vite.config.ts` + `tsconfig.json`.
- [ ] Viết `lib/api-client.ts` với refresh-token interceptor (mục 3.1).
- [ ] Viết `types/api.ts`: `Page<T>`, `ApiError` (mục 3.2, 3.4).
- [ ] Viết `utils/api-errors.ts`, `utils/date.ts`, `utils/pagination.ts`.
- [ ] Viết `lib/auth/`: `token-storage.ts`, `auth-context.tsx`, `protected-route.tsx`.
- [ ] Tạo `.env.example`: `VITE_APP_API_URL=http://localhost:8080`.
- [ ] (Khuyến nghị) Bật OpenAPI codegen từ Spring `/v3/api-docs`.
- [ ] (Khuyến nghị) Setup MSW handler cho dev khi BE chưa sẵn sàng.

---

## 8. Tham khảo

- Bulletproof React: https://github.com/alan2207/bulletproof-react
- Spring Data Pageable: https://docs.spring.io/spring-data/commons/reference/repositories/core-concepts.html
- springdoc-openapi: https://springdoc.org/
- openapi-typescript: https://github.com/drwpow/openapi-typescript
- TanStack Query: https://tanstack.com/query
- shadcn/ui: https://ui.shadcn.com/
