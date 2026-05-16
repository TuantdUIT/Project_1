# API Guide 1 - Auth

## 1. Mục đích module

Module `Auth` phục vụ:
- Đăng nhập bằng `email + password`
- Lấy thông tin tài khoản hiện tại
- Cấp lại `access token` bằng `refresh token`
- Đăng xuất

## 2. Ghi chú chung cho frontend

- Base path của module: `/api/v1/auth`
- `access token` được trả trong response body
- `refresh token` được trả qua cookie `HttpOnly` tên `refresh_token`
- Frontend không đọc trực tiếp được `refresh_token` vì là `HttpOnly`, nhưng trình duyệt sẽ tự gửi cookie nếu request có `credentials`
- Khi gọi `refresh`, frontend cần bật gửi cookie
- Khi gọi các API cần người dùng hiện tại, frontend cần gửi:
  - Header `Authorization: Bearer <access_token>`

## 3. Format response chung

Các API thành công được bọc theo format:

```json
{
  "statusCode": 200,
  "error": null,
  "message": "Mo ta API",
  "data": {}
}
```

Các API lỗi thường trả trực tiếp object lỗi, tối thiểu frontend nên đọc:
- HTTP status code
- message lỗi
- error

Ví dụ format lỗi thường gặp:

```json
{
  "statusCode": 400,
  "error": "No refresh token provided",
  "message": "No refresh token provided",
  "data": null
}
```

## 4. Danh sách API

### 4.1 POST `/api/v1/auth/login`

#### Mục đích
Đăng nhập hệ thống bằng email và mật khẩu.

#### Input format

Request body:

```json
{
  "email": "student1@example.com",
  "password": "0123456789"
}
```

#### Validate input

- `email`:
  - bắt buộc
  - đúng định dạng email
- `password`:
  - bắt buộc

#### Output format

```json
{
  "statusCode": 200,
  "error": null,
  "message": "Dang nhap",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiJ9...",
    "user": {
      "id": "019dbfff-d60d-7607-b06c-baea94cdf4c9",
      "email": "student1@example.com",
      "fullName": "Nguyen Van A"
    },
    "role": {
      "roleId": 1,
      "roleName": "STUDENT"
    }
  }
}
```

#### Cookie trả về

Response header có `Set-Cookie`:
- `refresh_token=<jwt>; HttpOnly; Path=/; Max-Age=...`

Frontend web cần:
- bật `withCredentials: true` hoặc cấu hình tương đương
- lưu `access_token` ở nơi phù hợp phía client nếu cần dùng cho các API sau

#### Mô tả luồng

Đăng nhập -> validate request body -> tạo `UsernamePasswordAuthenticationToken` từ `email + password` -> Spring Security authenticate -> lấy `User` từ DB theo email -> dựng response gồm `user`, `role` -> tạo `access token` -> tạo `refresh token` -> lưu `refresh token` mới vào DB của user -> set cookie `refresh_token` -> trả kết quả

#### Exception có thể trả về

- `400 Bad Request`
  - `Email khong duoc de trong`
  - `Email khong hop le`
  - `Mat khau khong duoc de trong`
- `401 Unauthorized`
  - sai email hoặc sai password
  - user không tìm thấy sau bước authenticate

---

### 4.2 GET `/api/v1/auth/account`

#### Mục đích
Lấy thông tin tài khoản hiện tại dựa trên `access token`.

#### Input format

Header:

```http
Authorization: Bearer <access_token>
```

Không có request body.

#### Output format

```json
{
  "statusCode": 200,
  "error": null,
  "message": "Lay thong tin tai khoan",
  "data": {
    "user": {
      "id": "019dbfff-d60d-7607-b06c-baea94cdf4c9",
      "email": "student1@example.com",
      "fullName": "Nguyen Van A"
    },
    "role": {
      "roleId": 1,
      "roleName": "STUDENT"
    }
  }
}
```

#### Mô tả luồng

Nhận `access token` từ header -> giải mã token để lấy subject hiện tại -> tìm user trong DB theo email -> dựng object `user + role` -> trả kết quả

#### Exception có thể trả về

- `401 Unauthorized`
  - không có `Authorization` header
  - `access token` sai định dạng hoặc hết hạn
  - email trong token không còn map được tới user trong DB

#### Ghi chú cho frontend

- API này thường được gọi sau login hoặc sau refresh thành công để đồng bộ lại user hiện tại trên client

---

### 4.3 GET `/api/v1/auth/refresh`

#### Mục đích
Cấp lại `access token` mới bằng `refresh token`.

#### Input format

Cookie gửi kèm:

```http
Cookie: refresh_token=<refresh_token>
```

Không có request body.

#### Output format

```json
{
  "statusCode": 200,
  "error": null,
  "message": "Lay token moi bang refresh token",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiJ9...",
    "user": {
      "id": "019dbfff-d60d-7607-b06c-baea94cdf4c9",
      "email": "student1@example.com",
      "fullName": "Nguyen Van A"
    },
    "role": {
      "roleId": 1,
      "roleName": "STUDENT"
    }
  }
}
```

#### Cookie trả về

Response sẽ set lại cookie `refresh_token` mới:
- backend rotate refresh token
- refresh token cũ bị thay thế trong DB

#### Mô tả luồng

Nhận cookie `refresh_token` -> kiểm tra cookie có tồn tại không -> giải mã và validate refresh token -> lấy email từ token -> kiểm tra user trong DB có đúng refresh token này không -> tạo `access token` mới -> tạo `refresh token` mới -> lưu refresh token mới vào DB -> set lại cookie `refresh_token` -> trả kết quả

#### Exception có thể trả về

- `400 Bad Request`
  - `No refresh token provided`
  - `Invalid refresh token`
- `401 Unauthorized`
  - refresh token sai chữ ký
  - refresh token hết hạn
  - refresh token không còn khớp với token đang lưu ở DB

#### Ghi chú cho frontend

- Phải gửi request kèm cookie
- Nếu refresh thất bại, frontend nên coi phiên đăng nhập đã hết hạn và đưa người dùng về màn hình login

---

### 4.4 POST `/api/v1/auth/logout`

#### Mục đích
Đăng xuất tài khoản hiện tại.

#### Input format

Header:

```http
Authorization: Bearer <access_token>
```

Không có request body.

#### Output format

```json
{
  "statusCode": 200,
  "error": null,
  "message": "Dang xuat",
  "data": null
}
```

#### Cookie trả về

Response sẽ set lại cookie:
- `refresh_token` với `Max-Age=0`
- mục đích là xóa cookie phía trình duyệt

#### Mô tả luồng

Nhận `access token` hiện tại -> lấy email người dùng từ security context -> cập nhật DB để xóa refresh token đã lưu của user -> set cookie `refresh_token` rỗng với thời gian sống bằng 0 -> trả kết quả

#### Exception có thể trả về

- `400 Bad Request`
  - `No user logged in`
- `401 Unauthorized`
  - không có `Authorization` header
  - token không hợp lệ hoặc hết hạn

## 5. Luồng frontend đề xuất

### 5.1 Luồng đăng nhập

1. Frontend gọi `POST /api/v1/auth/login`
2. Backend trả:
   - `access_token` trong body
   - `refresh_token` trong cookie `HttpOnly`
3. Frontend lưu `access_token`
4. Frontend có thể gọi `GET /api/v1/auth/account` để lấy lại user hiện tại nếu cần

### 5.2 Luồng gọi API khi access token hết hạn

1. Frontend gọi API nghiệp vụ bằng `Authorization: Bearer <access_token>`
2. Nếu backend trả `401`, frontend gọi `GET /api/v1/auth/refresh` kèm cookie
3. Nếu refresh thành công:
   - cập nhật `access_token` mới
   - gọi lại API cũ
4. Nếu refresh thất bại:
   - xóa state đăng nhập phía client
   - điều hướng về màn hình login

### 5.3 Luồng đăng xuất

1. Frontend gọi `POST /api/v1/auth/logout`
2. Backend xóa refresh token trong DB
3. Backend yêu cầu trình duyệt xóa cookie `refresh_token`
4. Frontend xóa `access_token` phía client và xóa user state

## 6. Ghi chú nghiệp vụ và kỹ thuật

- `role` hiện được trả về trong:
  - response `login`
  - response `account`
  - response `refresh`
- Password của học sinh được tạo mặc định từ số điện thoại khi học sinh được tạo bởi luồng đăng ký / quản lý học sinh
- `refresh token` được lưu ở DB theo user, nên mỗi lần login hoặc refresh sẽ thay thế token cũ
- Frontend không nên tự suy diễn quyền chỉ từ UI; quyền thực tế vẫn phụ thuộc backend

## 7. Danh sách endpoint tóm tắt

| Method | Path | Mục đích |
|------|------|------|
| POST | `/api/v1/auth/login` | Đăng nhập |
| GET | `/api/v1/auth/account` | Lấy thông tin tài khoản hiện tại |
| GET | `/api/v1/auth/refresh` | Cấp lại access token |
| POST | `/api/v1/auth/logout` | Đăng xuất |
