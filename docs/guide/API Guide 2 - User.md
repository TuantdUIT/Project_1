# API Guide 2 - User

## 1. Mục đích module

Module `User` phục vụ quản lý tài khoản người dùng ở mức chung:
- Lấy danh sách user
- Lấy chi tiết user
- Tạo user
- Cập nhật user
- Xóa user

Đây là module quản lý tài khoản tổng quát, khác với module `Student` là module hồ sơ học sinh có thêm nghiệp vụ riêng.

## 2. Ghi chú chung cho frontend

- Base path của module: `/api/v1/users`
- Response thành công được bọc theo `RestResponse`
- Danh sách user trả theo format phân trang `ResultPaginationDTO`
- `password` chỉ dùng ở request create/update, không trả về ở response

## 3. Format response chung

### 3.1 Response thành công

```json
{
  "statusCode": 200,
  "error": null,
  "message": "Mo ta API",
  "data": {}
}
```

### 3.2 Response phân trang

```json
{
  "statusCode": 200,
  "error": null,
  "message": "Lay danh sach users",
  "data": {
    "meta": {
      "page": 1,
      "pageSize": 10,
      "totalPages": 3,
      "totalItems": 25
    },
    "result": []
  }
}
```

### 3.3 Response lỗi thường gặp

```json
{
  "statusCode": 400,
  "error": "User with email 'a@example.com' already exists",
  "message": "User with email 'a@example.com' already exists",
  "data": null
}
```

## 4. Danh sách API

### 4.1 GET `/api/v1/users`

#### Mục đích
Lấy danh sách user có phân trang.

#### Input format

Query params hỗ trợ bởi `Pageable`:
- `page`: số trang, thường bắt đầu từ `0` ở request
- `size`: số phần tử mỗi trang
- `sort`: field sắp xếp, ví dụ `createdAt,desc`

Ví dụ:

```http
GET /api/v1/users?page=0&size=10&sort=createdAt,desc
```

#### Output format

```json
{
  "statusCode": 200,
  "error": null,
  "message": "Lay danh sach users",
  "data": {
    "meta": {
      "page": 1,
      "pageSize": 10,
      "totalPages": 2,
      "totalItems": 12
    },
    "result": [
      {
        "id": "019dbfff-d60d-7607-b06c-baea94cdf4c9",
        "user_fullname": "Nguyen Van A",
        "user_phone_number": "0123456789",
        "fb_link": "https://facebook.com/a",
        "user_email": "a@example.com",
        "role": {
          "id": 1,
          "name": "MANAGER",
          "description": "Quan ly van hanh",
          "active": true,
          "permissions": null,
          "createdAt": null,
          "updatedAt": null,
          "createdBy": null,
          "updatedBy": null
        },
        "created_at": "2026-05-16T10:00:00Z",
        "updated_at": "2026-05-16T10:00:00Z",
        "created_by": "system",
        "updated_by": "system"
      }
    ]
  }
}
```

#### Mô tả luồng

Nhận query phân trang -> truy vấn bảng `USER` bằng `Pageable` -> map từng user sang `ResUserDTO` -> dựng `meta` phân trang -> trả kết quả

#### Exception có thể trả về

- Thực tế API này hiện không có validate nghiệp vụ riêng ngoài lỗi framework nếu query param sai format

---

### 4.2 GET `/api/v1/users/{id}`

#### Mục đích
Lấy chi tiết một user theo `UUID`.

#### Đường dẫn

```http
GET /api/v1/users/{id}
```

Ví dụ:

```http
GET /api/v1/users/019dbfff-d60d-7607-b06c-baea94cdf4c9
```

#### Input format

Path variable:
- `id`: `UUID` của user

#### Output format

```json
{
  "statusCode": 200,
  "error": null,
  "message": "Lay chi tiet user",
  "data": {
    "id": "019dbfff-d60d-7607-b06c-baea94cdf4c9",
    "user_fullname": "Nguyen Van A",
    "user_phone_number": "0123456789",
    "fb_link": "https://facebook.com/a",
    "user_email": "a@example.com",
    "role": {
      "id": 1,
      "name": "MANAGER",
      "description": "Quan ly van hanh",
      "active": true,
      "permissions": null,
      "createdAt": null,
      "updatedAt": null,
      "createdBy": null,
      "updatedBy": null
    },
    "created_at": "2026-05-16T10:00:00Z",
    "updated_at": "2026-05-16T10:00:00Z",
    "created_by": "system",
    "updated_by": "system"
  }
}
```

#### Mô tả luồng

Nhận `userUuid` -> tìm user trong DB theo id -> map sang `ResUserDTO` -> trả kết quả

#### Exception có thể trả về

- Hiện tại service `handleFetchUserById` không ném lỗi nếu không tìm thấy
- Trong trường hợp không có dữ liệu, response có thể là:

```json
{
  "statusCode": 200,
  "error": null,
  "message": "Lay chi tiet user",
  "data": null
}
```

#### Ghi chú cho frontend

- Frontend cần tự xử lý case `data = null` như một trường hợp "không tìm thấy user"

---

### 4.3 POST `/api/v1/users`

#### Mục đích
Tạo mới một user.

#### Input format

Request body:

```json
{
  "fullName": "Nguyen Van A",
  "phoneNumber": "0123456789",
  "fbLink": "https://facebook.com/a",
  "email": "a@example.com",
  "password": "123456",
  "roleId": 1
}
```

#### Validate input

- `fullName`: bắt buộc
- `email`: bắt buộc, đúng format email
- `password`: bắt buộc
- `roleId`: bắt buộc

#### Output format

```json
{
  "statusCode": 201,
  "error": null,
  "message": "Tao user",
  "data": {
    "id": "019dbfff-d60d-7607-b06c-baea94cdf4c9",
    "user_fullname": "Nguyen Van A",
    "user_phone_number": "0123456789",
    "fb_link": "https://facebook.com/a",
    "user_email": "a@example.com",
    "role": {
      "id": 1,
      "name": "MANAGER",
      "description": "Quan ly van hanh",
      "active": true,
      "permissions": null,
      "createdAt": null,
      "updatedAt": null,
      "createdBy": null,
      "updatedBy": null
    },
    "created_at": "2026-05-16T10:00:00Z",
    "updated_at": "2026-05-16T10:00:00Z",
    "created_by": "system",
    "updated_by": "system"
  }
}
```

#### Mô tả luồng

Tạo user -> validate request body -> kiểm tra email đã tồn tại chưa -> kiểm tra `roleId` có tồn tại không -> mã hóa password bằng `PasswordEncoder` -> lưu `USER` xuống DB -> map sang `ResUserDTO` -> trả kết quả

#### Exception có thể trả về

- `400 Bad Request`
  - `Khong duoc de trong ho ten`
  - `Khong duoc de trong email`
  - `Email khong hop le`
  - `Khong duoc de trong mat khau`
  - `Role khong duoc de trong`
  - `User with email '...' already exists`
- `400/404` tùy global exception handler hiện tại
  - `Role with id ... does not exist`

#### Ghi chú liên quan module khác

- `User` phụ thuộc module `Role` ở mức dữ liệu vì mỗi user cần `roleId`

---

### 4.4 PUT `/api/v1/users/{id}`

#### Mục đích
Cập nhật thông tin user.

#### Input format

Path variable:
- `id`: `UUID` của user

Request body:

```json
{
  "fullName": "Nguyen Van B",
  "phoneNumber": "0987654321",
  "fbLink": "https://facebook.com/b",
  "email": "b@example.com",
  "password": "new-password",
  "roleId": 2
}
```

#### Validate input

- `email`: nếu có truyền thì phải đúng format
- `id`: được set từ path variable, backend tự gán vào request

#### Output format

```json
{
  "statusCode": 200,
  "error": null,
  "message": "Cap nhat user",
  "data": {
    "id": "019dbfff-d60d-7607-b06c-baea94cdf4c9",
    "user_fullname": "Nguyen Van B",
    "user_phone_number": "0987654321",
    "fb_link": "https://facebook.com/b",
    "user_email": "b@example.com",
    "role": {
      "id": 2,
      "name": "TA",
      "description": "Tro giang",
      "active": true,
      "permissions": null,
      "createdAt": null,
      "updatedAt": null,
      "createdBy": null,
      "updatedBy": null
    },
    "created_at": "2026-05-16T10:00:00Z",
    "updated_at": "2026-05-16T11:00:00Z",
    "created_by": "system",
    "updated_by": "manager@example.com"
  }
}
```

#### Mô tả luồng

Cập nhật user -> nhận `id` từ path variable -> tìm user hiện tại trong DB -> nếu đổi email thì kiểm tra email mới có bị trùng không -> nếu có `roleId` thì kiểm tra role tồn tại -> với các field có truyền lên thì cập nhật -> nếu có password thì mã hóa lại -> lưu user xuống DB -> trả kết quả

#### Exception có thể trả về

- `400 Bad Request`
  - `Email khong hop le`
  - `User with email '...' already exists`
- `400/404` tùy global exception handler hiện tại
  - `User with id ... does not exist`
  - `Role with id ... does not exist`

#### Ghi chú cho frontend

- Đây là update kiểu partial update bằng `PUT`: field nào không truyền thì backend giữ nguyên

---

### 4.5 DELETE `/api/v1/users/{id}`

#### Mục đích
Xóa user theo `UUID`.

#### Input format

Path variable:
- `id`: `UUID` của user

#### Output format

HTTP status:
- `204 No Content`

Body:
- không có body

#### Mô tả luồng

Nhận `userUuid` -> kiểm tra user có tồn tại không -> xóa user khỏi DB -> trả `204 No Content`

#### Exception có thể trả về

- `400/404` tùy global exception handler hiện tại
  - `User with id ... does not exist`

## 5. Luồng frontend đề xuất

### 5.1 Màn hình danh sách user

1. Gọi `GET /api/v1/users`
2. Đọc:
   - `data.meta`
   - `data.result`
3. Dùng `page`, `size`, `sort` để phân trang

### 5.2 Màn hình tạo user

1. Gọi API lấy danh sách role nếu frontend có màn chọn role
2. Gửi `POST /api/v1/users`
3. Nếu thành công, quay về danh sách hoặc mở màn chi tiết

### 5.3 Màn hình cập nhật user

1. Gọi `GET /api/v1/users/{id}` để lấy dữ liệu ban đầu
2. Gửi `PUT /api/v1/users/{id}`
3. Nếu có lỗi trùng email hoặc sai role, hiển thị message lỗi từ backend

## 6. Ghi chú nghiệp vụ

- `User` là tài khoản chung cho toàn hệ thống
- `Student` cũng có `User`, nhưng được tạo qua module `Student`, không phải lúc nào cũng tạo bằng module `User`
- Với user là học sinh, một số rule riêng như password mặc định, role `STUDENT`, hồ sơ học sinh, `SID`, `GRADE` sẽ nằm ở module `Student`, không nằm ở module `User`

## 7. Danh sách endpoint tóm tắt

| Method | Path | Mục đích |
|------|------|------|
| GET | `/api/v1/users` | Lấy danh sách user |
| GET | `/api/v1/users/{id}` | Lấy chi tiết user |
| POST | `/api/v1/users` | Tạo user |
| PUT | `/api/v1/users/{id}` | Cập nhật user |
| DELETE | `/api/v1/users/{id}` | Xóa user |
