# API Guide 13 - Penalty Tag

## 1. Mục đích module

Module `Penalty Tag` phục vụ quản lý nhãn phân loại cho `Penalty`.

Theo nghiệp vụ hiện tại:
- `PenaltyTag` là nhãn riêng của domain phạt
- không dùng chung với `CostTag`
- một `Penalty` có thể gắn nhiều `PenaltyTag`

## 2. Ghi chú chung cho frontend

- Base path của module: `/api/v1/penalty-tags`
- Response thành công được bọc theo `RestResponse`
- Module này trả danh sách toàn bộ, chưa có phân trang

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

### 3.2 Cấu trúc `ResPenaltyTagDTO`

```json
{
  "id": 1,
  "name": "Ky luat",
  "description": "Vi pham ky luat",
  "createdAt": "2026-05-16T10:00:00Z",
  "updatedAt": "2026-05-16T10:00:00Z",
  "createdBy": "system",
  "updatedBy": "system"
}
```

## 4. Danh sách API

### 4.1 GET `/api/v1/penalty-tags`

#### Mục đích
Lấy toàn bộ danh sách `PenaltyTag`.

#### Input format

Không có request body.

#### Output format

Response là mảng `ResPenaltyTagDTO`.

#### Mô tả luồng

Nhận request -> truy vấn toàn bộ bảng `PENALTY_TAG` -> map sang `ResPenaltyTagDTO` -> trả kết quả

#### Exception có thể trả về

- Hiện tại API này không có validate nghiệp vụ riêng

---

### 4.2 GET `/api/v1/penalty-tags/{id}`

#### Mục đích
Lấy chi tiết một `PenaltyTag`.

#### Input format

Path variable:
- `id`: `Long`

#### Output format

Response là một `ResPenaltyTagDTO`.

#### Mô tả luồng

Nhận `penaltyTagId` -> tìm penalty tag theo id -> map sang `ResPenaltyTagDTO` -> trả kết quả

#### Exception có thể trả về

- `400/404` tùy global exception handler hiện tại
  - `Penalty tag with id ... does not exist`

---

### 4.3 POST `/api/v1/penalty-tags`

#### Mục đích
Tạo mới một `PenaltyTag`.

#### Input format

Request body:

```json
{
  "name": "Ky luat",
  "description": "Vi pham ky luat"
}
```

#### Validate input

- `name`: bắt buộc
- `description`: optional
- `name`: không được trùng

#### Output format

Response là một `ResPenaltyTagDTO`.

#### Mô tả luồng

Tạo penalty tag -> validate request body -> kiểm tra tên tag đã tồn tại chưa -> tạo entity `PenaltyTag` -> lưu DB -> trả kết quả

#### Exception có thể trả về

- `400 Bad Request`
  - `Ten penalty tag khong duoc de trong`
  - `Penalty tag with name '...' already exists`

---

### 4.4 PUT `/api/v1/penalty-tags/{id}`

#### Mục đích
Cập nhật một `PenaltyTag`.

#### Input format

Path variable:
- `id`: `Long`

Request body:

```json
{
  "name": "Ky luat noi bo",
  "description": "Vi pham ky luat noi bo"
}
```

#### Validate input

- `name`: optional
- `description`: optional
- nếu có `name` mới và khác tên cũ thì không được trùng

#### Output format

Response là một `ResPenaltyTagDTO`.

#### Mô tả luồng

Cập nhật penalty tag -> tìm penalty tag hiện tại theo id -> nếu có name mới thì kiểm tra trùng -> cập nhật `name`, `description` nếu có -> lưu DB -> trả kết quả

#### Exception có thể trả về

- `400 Bad Request`
  - `Penalty tag with name '...' already exists`
- `400/404` tùy global exception handler hiện tại
  - `Penalty tag with id ... does not exist`

---

### 4.5 DELETE `/api/v1/penalty-tags/{id}`

#### Mục đích
Xóa một `PenaltyTag`.

#### Input format

Path variable:
- `id`: `Long`

#### Output format

HTTP status:
- `204 No Content`

#### Mô tả luồng

Nhận `penaltyTagId` -> tìm penalty tag theo id -> xóa khỏi DB -> trả `204 No Content`

#### Exception có thể trả về

- `400/404` tùy global exception handler hiện tại
  - `Penalty tag with id ... does not exist`

#### Ghi chú cho frontend

- Service hiện tại chưa chủ động chặn xóa `PenaltyTag` đang được `Penalty` sử dụng
- Nếu DB có ràng buộc FK thì thao tác xóa có thể fail ở tầng persistence

## 5. Ghi chú liên quan module khác

- `PenaltyTag` được dùng bởi module:
  - `Penalty`
- Khi frontend tạo / cập nhật `Penalty`, trường `tagIds` sẽ lấy dữ liệu từ danh sách `PenaltyTag`

## 6. Danh sách endpoint tóm tắt

| Method | Path | Mục đích |
|------|------|------|
| GET | `/api/v1/penalty-tags` | Lấy danh sách penalty tag |
| GET | `/api/v1/penalty-tags/{id}` | Lấy chi tiết penalty tag |
| POST | `/api/v1/penalty-tags` | Tạo penalty tag |
| PUT | `/api/v1/penalty-tags/{id}` | Cập nhật penalty tag |
| DELETE | `/api/v1/penalty-tags/{id}` | Xóa penalty tag |
