# API Guide 15 - Cost Tag

## 1. Mục đích module

Module `Cost Tag` phục vụ quản lý nhãn phân loại cho `Cost`.

Theo nghiệp vụ hiện tại:
- `CostTag` là nhãn riêng của domain chi phí
- không dùng chung với `PenaltyTag`
- một `Cost` hiện tại gắn tối đa 1 `CostTag`

## 2. Ghi chú chung cho frontend

- Base path của module: `/api/v1/cost-tags`
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

### 3.2 Cấu trúc `ResCostTagDTO`

```json
{
  "id": 1,
  "name": "Van hanh",
  "createdAt": "2026-05-16T10:00:00Z",
  "updatedAt": "2026-05-16T10:00:00Z",
  "createdBy": "system",
  "updatedBy": "system"
}
```

## 4. Danh sách API

### 4.1 GET `/api/v1/cost-tags`

#### Mục đích
Lấy toàn bộ danh sách `CostTag`.

#### Input format

Không có request body.

#### Output format

Response là mảng `ResCostTagDTO`.

#### Mô tả luồng

Nhận request -> truy vấn toàn bộ bảng `COST_TAG` -> map sang `ResCostTagDTO` -> trả kết quả

#### Exception có thể trả về

- Hiện tại API này không có validate nghiệp vụ riêng

---

### 4.2 GET `/api/v1/cost-tags/{id}`

#### Mục đích
Lấy chi tiết một `CostTag`.

#### Input format

Path variable:
- `id`: `Long`

#### Output format

Response là một `ResCostTagDTO`.

#### Mô tả luồng

Nhận `costTagId` -> tìm cost tag theo id -> map sang `ResCostTagDTO` -> trả kết quả

#### Exception có thể trả về

- `400/404` tùy global exception handler hiện tại
  - `Cost tag with id ... does not exist`

---

### 4.3 POST `/api/v1/cost-tags`

#### Mục đích
Tạo mới một `CostTag`.

#### Input format

Request body:

```json
{
  "name": "Van hanh"
}
```

#### Validate input

- `name`: bắt buộc
- `name`: không được trùng

#### Output format

Response là một `ResCostTagDTO`.

#### Mô tả luồng

Tạo cost tag -> validate request body -> kiểm tra tên tag đã tồn tại chưa -> tạo entity `CostTag` -> lưu DB -> trả kết quả

#### Exception có thể trả về

- `400 Bad Request`
  - `Ten cost tag khong duoc de trong`
  - `Cost tag with name '...' already exists`

---

### 4.4 PUT `/api/v1/cost-tags/{id}`

#### Mục đích
Cập nhật một `CostTag`.

#### Input format

Path variable:
- `id`: `Long`

Request body:

```json
{
  "name": "Van hanh noi bo"
}
```

#### Validate input

- `name`: optional
- nếu có truyền `name` mới và khác tên cũ thì không được trùng

#### Output format

Response là một `ResCostTagDTO`.

#### Mô tả luồng

Cập nhật cost tag -> tìm cost tag hiện tại theo id -> nếu có name mới thì kiểm tra trùng -> cập nhật dữ liệu -> lưu DB -> trả kết quả

#### Exception có thể trả về

- `400 Bad Request`
  - `Cost tag with name '...' already exists`
- `400/404` tùy global exception handler hiện tại
  - `Cost tag with id ... does not exist`

---

### 4.5 DELETE `/api/v1/cost-tags/{id}`

#### Mục đích
Xóa một `CostTag`.

#### Input format

Path variable:
- `id`: `Long`

#### Output format

HTTP status:
- `204 No Content`

#### Mô tả luồng

Nhận `costTagId` -> tìm cost tag theo id -> xóa khỏi DB -> trả `204 No Content`

#### Exception có thể trả về

- `400/404` tùy global exception handler hiện tại
  - `Cost tag with id ... does not exist`

#### Ghi chú cho frontend

- Service hiện tại chưa chủ động chặn xóa `CostTag` đang được `Cost` sử dụng
- Nếu DB có ràng buộc FK thì thao tác xóa có thể fail ở tầng persistence

## 5. Danh sách endpoint tóm tắt

| Method | Path | Mục đích |
|------|------|------|
| GET | `/api/v1/cost-tags` | Lấy danh sách cost tag |
| GET | `/api/v1/cost-tags/{id}` | Lấy chi tiết cost tag |
| POST | `/api/v1/cost-tags` | Tạo cost tag |
| PUT | `/api/v1/cost-tags/{id}` | Cập nhật cost tag |
| DELETE | `/api/v1/cost-tags/{id}` | Xóa cost tag |
