# Hướng dẫn Frontend kết nối API Gateway

Tài liệu này mô tả những điểm frontend cần lưu ý khi kết nối tới **API Gateway** của dự án.
Gateway sử dụng **Spring Cloud Gateway MVC** và đóng vai trò là điểm vào (entry point) duy nhất cho mọi request từ frontend.

> **Nguyên tắc cốt lõi:** Frontend **chỉ gọi đến API Gateway**, không bao giờ gọi trực tiếp vào các service con.

---

## 1. Địa chỉ & Port

| Thành phần | Địa chỉ mặc định | Ghi chú |
|---|---|---|
| **API Gateway** | `http://localhost:8084` | Frontend chỉ gọi đến đây |
| Management Service | `http://localhost:8081` | Nội bộ — frontend không gọi trực tiếp |
| Exam Service | `http://localhost:8080` | Nội bộ — frontend không gọi trực tiếp |

- Mọi request dùng chung một base URL: `http://localhost:8084`.
- Khi deploy (Docker/production), chỉ cần đổi base URL của Gateway; địa chỉ service nội bộ do Gateway tự quản lý qua biến môi trường `MANAGEMENT_SERVICE_URI` / `EXAM_SERVICE_URI`.

---

## 2. CORS — Origin được phép

Gateway chỉ chấp nhận request từ các origin sau (mặc định):

- `http://localhost:3000` (React / Next.js)
- `http://localhost:5173` (Vite)

> Nếu frontend chạy ở port/domain khác, cần cấu hình lại biến `app.cors.allowed-origins` phía backend.

**Chi tiết CORS:**

| Thuộc tính | Giá trị |
|---|---|
| Allowed Methods | `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS` |
| Allowed Headers | `*` (tất cả) |
| Exposed Headers | `Content-Disposition`, `Content-Length` |
| Allow Credentials | `true` |
| Preflight Cache (maxAge) | `3600s` (1 giờ) |

**Lưu ý quan trọng:**
- `allowCredentials = true` → frontend **có thể** gửi cookie/credential. Vì vậy origin **phải khai báo cụ thể**, không được dùng `*`.
- `Content-Disposition` và `Content-Length` được expose → frontend đọc được tên file khi **tải file xuống (download)**.

---

## 3. Định tuyến (Routing) theo Path

Gateway điều hướng request dựa trên **prefix của path**. Phải gọi **đúng path** thì request mới tới được service.

### Management Service (`:8081`)
Đăng nhập/đăng ký, quản lý người dùng, thời khoá biểu, điểm danh, học phí...

```
/api/v1/auth/**
/api/v1/users, /api/v1/users/**
/api/v1/grades, /api/v1/grades/**
/api/v1/lesson-types, /api/v1/lesson-types/**
/api/v1/study-weeks, /api/v1/study-weeks/**
/api/v1/timetable-templates, /api/v1/timetable-templates/**
/api/v1/lessons, /api/v1/lessons/**
/api/v1/period-settings, /api/v1/period-settings/**
/api/v1/periods, /api/v1/periods/**
/api/v1/attendances, /api/v1/attendances/**
/api/v1/record-attendances, /api/v1/record-attendances/**
/api/v1/student/register
/api/v1/manager/student/register, /api/v1/manager/student/register/**
/api/v1/manager/students
/api/v1/online-lectures, /api/v1/online-lectures/**
/api/v1/learning-files, /api/v1/learning-files/**
/api/v1/penalty-tags, /api/v1/penalty-tags/**
/api/v1/penalties, /api/v1/penalties/**
/api/v1/cost-tags, /api/v1/cost-tags/**
/api/v1/costs, /api/v1/costs/**
/api/v1/tham-sos, /api/v1/tham-sos/**
/api/v1/employee-ra-templates, /api/v1/employee-ra-templates/**
```

### Exam Service (`:8080`)
Đề thi, câu hỏi, làm bài của học sinh, chấm OMR, dashboard...

```
/api/v1/exams, /api/v1/exams/**
/api/v1/questions, /api/v1/questions/**
/api/v1/question-groups, /api/v1/question-groups/**
/api/v1/student/exams/**
/api/v1/student/attempts, /api/v1/student/attempts/**
/api/v1/omr/**
/api/v1/files
/api/v1/dashboard/**
/api/v1/health
```

> ⚠️ **Cái bẫy path chính xác vs wildcard:** Các path như `/api/v1/users` (không có slash cuối) và `/api/v1/users/**` được khai báo **riêng biệt**.
> - `/api/v1/grades` → khớp ✅
> - `/api/v1/grades/123` → khớp ✅ (qua `/**`)
> - `/api/v1/gradesXYZ` → **không** khớp route nào → trả về **404**.
>
> Luôn gọi đúng định dạng path.

---

## 4. Authentication (Xác thực)

- Gateway **không có filter xác thực riêng** — nó chỉ làm nhiệm vụ định tuyến.
- Việc đăng nhập / lấy token nằm ở `/api/v1/auth/**` (Management Service).
- Frontend tự đính kèm token vào mỗi request, thường qua header:

  ```http
  Authorization: Bearer <token>
  ```

- Gateway cho phép tất cả header (`*`), nên token sẽ được chuyển tiếp (forward) xuống service xử lý.

---

## 5. Upload File

| Giới hạn | Giá trị |
|---|---|
| Max file size | **100 MB** |
| Max request size | **110 MB** |

- Áp dụng cho các chức năng upload (OMR, `learning-files`, ...).
- Frontend **nên validate dung lượng file phía client** trước khi gửi; vượt quá giới hạn sẽ bị Gateway từ chối.

---

## 6. API Docs / Swagger

Frontend dev có thể xem toàn bộ API contract (gộp cả Management Service và Exam Service) tại:

```
http://localhost:8084/swagger-ui.html
```

---

## 7. Tóm tắt nhanh (Checklist cho Frontend)

- [ ] Base URL trỏ về Gateway: `http://localhost:8084`
- [ ] Gọi đúng path `/api/v1/...` (chú ý phân biệt có/không slash cuối)
- [ ] Frontend chạy từ origin đã whitelist: `localhost:3000` hoặc `localhost:5173`
- [ ] Lấy token từ `/api/v1/auth/**`, gửi kèm `Authorization: Bearer <token>`
- [ ] File upload < 100 MB (request < 110 MB)
- [ ] Khi download file, đọc tên từ header `Content-Disposition`
- [ ] Không gọi trực tiếp vào service con (`:8080`, `:8081`)
