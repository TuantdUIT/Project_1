# Cấu hình kết nối Backend (8081 trực tiếp ↔ 8084 gateway)

> Ghi chú để chuyển qua lại giữa **kết nối trực tiếp management service (8081)** và **API gateway (8084)**.
> Lưu ý cốt lõi: việc app gọi tới port nào **chỉ phụ thuộc `VITE_APP_API_URL`**. Phần đổi tên file type / script codegen là tooling lúc build, không ảnh hưởng runtime.

## Trạng thái hiện tại: kết nối trực tiếp 8081 (bản đã chạy được)

| Nơi | Giá trị |
|---|---|
| `.env.local` (runtime, không commit) | `VITE_APP_API_URL=http://localhost:8081` |
| `.env.example` | `VITE_APP_API_URL=http://localhost:8081` |
| `src/config/env.ts` (default) | `http://localhost:8081` |
| `package.json` → `codegen:api` | `openapi-typescript http://localhost:8081/v3/api-docs -o src/types/openapi.ts` |
| File type | `src/types/openapi.ts` (1 file, import qua `@/types/openapi`) |

## Khi backend fix xong CORS gateway → chuyển sang 8084

Gateway `8084` route tới management (8081) và exam (8080). Swagger gộp **không** ở `/v3/api-docs` mà tách theo group:

- Management: `http://localhost:8084/docs/management-service/v3/api-docs`
- Exam: `http://localhost:8084/docs/exam-service/v3/api-docs`
- Liệt kê group: `http://localhost:8084/v3/api-docs/swagger-config`

### Các thay đổi cần áp dụng

1. **Runtime URL** — đổi cả 3 nơi sang `http://localhost:8084`:
   - `.env.local`, `.env.example`, `src/config/env.ts` (default).

2. **Tách type theo service** (vì codegen mỗi lần chỉ sinh 1 spec):
   - Đổi tên `src/types/openapi.ts` → `src/types/openapi-management.ts`.
   - Đổi 11 import `@/types/openapi` → `@/types/openapi-management` tại:
     `src/lib/auth/auth-api.ts`, `src/features/attendance/types.ts`, `src/features/admin/types.ts`,
     `src/features/timetable-template/types.ts`, `src/features/finance/types.ts`, `src/features/study-week/types.ts`,
     `src/features/schedule/api/timetable-templates.ts`, `src/features/employee-ra-template/types.ts`,
     `src/features/learning-resource/types.ts`, `src/features/landing/api/student-register.ts`,
     `src/features/curriculum/types.ts`.

3. **Scripts codegen** trong `package.json`:
   ```json
   "codegen:management": "openapi-typescript http://localhost:8084/docs/management-service/v3/api-docs -o src/types/openapi-management.ts",
   "codegen:exam":       "openapi-typescript http://localhost:8084/docs/exam-service/v3/api-docs -o src/types/openapi-exam.ts",
   "codegen:api":        "npm run codegen:management && npm run codegen:exam",
   ```

4. Bật gateway → `npm run codegen:api` → `npm run lint` (kỳ vọng 0 lỗi) → restart `npm run dev`.

## Yêu cầu phía gateway (backend) để FE chạy được trên 8084

FE đặt `withCredentials: true` và gắn header `Authorization: Bearer`. Gateway cần CORS:

- `Access-Control-Allow-Origin: http://localhost:3000` (không dùng `*` vì có credentials)
- `Access-Control-Allow-Credentials: true`
- `Access-Control-Allow-Headers: Authorization, Content-Type`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
- Trả `200` cho preflight `OPTIONS`.

> Triệu chứng khi thiếu: login chạy được (không gửi `Authorization`), nhưng mọi API sau login bị chặn CORS (Network: "Provisional headers", 0 byte).
