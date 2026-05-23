# API Guide 16 - Cost

## 1. Mục đích module

Module `Cost` phục vụ quản lý chi phí vận hành.

Theo nghiệp vụ hiện tại, một `Cost` gồm:
- tên khoản chi
- người chịu chi / người chi
- số tiền
- trạng thái duyệt / xử lý
- phần còn nợ
- người xác nhận
- `CostTag`

## 2. Ghi chú nghiệp vụ quan trọng

- `Cost` hiện gắn tối đa 1 `CostTag`
- các user tham chiếu trong `Cost`:
  - `paidByUser`
  - `confirmedByUser`
- `paidStatus` hiện có các giá trị:
  - `SAVED`
  - `APPROVED`
  - `REJECTED`
- `debt` là số tiền còn treo của khoản chi đó

## 3. Ghi chú chung cho frontend

- Base path của module: `/api/v1/costs`
- Response thành công được bọc theo `RestResponse`
- Module này trả danh sách toàn bộ, chưa có phân trang

## 4. Format response chung

### 4.1 Response thành công

```json
{
  "statusCode": 200,
  "error": null,
  "message": "Mo ta API",
  "data": {}
}
```

### 4.2 Cấu trúc `ResCostDTO`

```json
{
  "cost_uuid": "019ff111-d60d-7607-b06c-baea94cdf4c9",
  "cost_name": "Mua tai lieu",
  "paid_by_user": {
    "user_uuid": "019ff000-d60d-7607-b06c-baea94cdf4c9",
    "user_fullname": "Nguyen Van A",
    "user_email": "manager@example.com",
    "role_name": "MANAGER"
  },
  "amount": 500000,
  "cost_paid_status": "SAVED",
  "debt": 500000,
  "confirmed_by_user": {
    "user_uuid": "019ff222-d60d-7607-b06c-baea94cdf4c9",
    "user_fullname": "Teacher 1",
    "user_email": "teacher@example.com",
    "role_name": "TEACHER"
  },
  "cost_tag": {
    "id": 1,
    "name": "Van hanh"
  },
  "created_at": "2026-05-16T10:00:00Z",
  "updated_at": "2026-05-16T10:00:00Z",
  "created_by": "system",
  "updated_by": "system"
}
```

## 5. Danh sách API

### 5.1 GET `/api/v1/costs`

#### Mục đích
Lấy toàn bộ danh sách `Cost`.

#### Input format

Không có request body.

#### Output format

Response là mảng `ResCostDTO`.

#### Mô tả luồng

Nhận request -> truy vấn toàn bộ bảng `COST` -> resolve thông tin user và tag liên quan -> map sang `ResCostDTO` -> trả kết quả

#### Exception có thể trả về

- Hiện tại API này không có validate nghiệp vụ riêng

---

### 5.2 GET `/api/v1/costs/{id}`

#### Mục đích
Lấy chi tiết một `Cost`.

#### Input format

Path variable:
- `id`: `UUID` của cost

#### Output format

Response là một `ResCostDTO`.

#### Mô tả luồng

Nhận `costUuid` -> tìm cost trong DB theo id -> map sang `ResCostDTO` -> trả kết quả

#### Exception có thể trả về

- `400/404` tùy global exception handler hiện tại
  - `Cost with id ... does not exist`

---

### 5.3 POST `/api/v1/costs`

#### Mục đích
Tạo mới một `Cost`.

#### Input format

Request body:

```json
{
  "name": "Mua tai lieu",
  "paidByUserUuid": "019ff000-d60d-7607-b06c-baea94cdf4c9",
  "amount": 500000,
  "paidStatus": "SAVED",
  "debt": 500000,
  "confirmedByUserUuid": "019ff222-d60d-7607-b06c-baea94cdf4c9",
  "costTagId": 1
}
```

#### Validate input

- `name`: bắt buộc
- `paidByUserUuid`: bắt buộc
- `amount`: bắt buộc
- `paidStatus`: bắt buộc
- `debt`: bắt buộc
- `confirmedByUserUuid`: optional
- `costTagId`: optional

#### Validate nghiệp vụ khi tạo

Backend kiểm tra:
- `paidByUserUuid` tồn tại
- nếu có `confirmedByUserUuid` thì user đó tồn tại
- nếu có `costTagId` thì cost tag đó tồn tại

#### Output format

Response là một `ResCostDTO`.

#### Mô tả luồng

Tạo cost -> validate request body -> resolve `paidByUser` -> resolve `confirmedByUser` nếu có -> resolve `CostTag` nếu có -> tạo entity `Cost` -> lưu DB -> map sang `ResCostDTO` -> trả kết quả

#### Exception có thể trả về

- `400 Bad Request`
  - `Ten cost khong duoc de trong`
  - `paidByUserUuid khong duoc de trong`
  - `amount khong duoc de trong`
  - `paidStatus khong duoc de trong`
  - `debt khong duoc de trong`
- `400/404` tùy global exception handler hiện tại
  - `User with user_uuid ... does not exist`
  - `Cost tag with id ... does not exist`

---

### 5.4 PUT `/api/v1/costs/{id}`

#### Mục đích
Cập nhật một `Cost`.

#### Input format

Path variable:
- `id`: `UUID` của cost

Request body:

```json
{
  "name": "Mua tai lieu cap nhat",
  "paidByUserUuid": "019ff000-d60d-7607-b06c-baea94cdf4c9",
  "amount": 400000,
  "paidStatus": "APPROVED",
  "debt": 0,
  "confirmedByUserUuid": "019ff222-d60d-7607-b06c-baea94cdf4c9",
  "costTagId": 1
}
```

#### Validate input

- tất cả field đều optional

#### Validate nghiệp vụ khi update

Backend kiểm tra:
- nếu có `paidByUserUuid` thì user tồn tại
- nếu có `confirmedByUserUuid` thì user tồn tại
- nếu có `costTagId` thì cost tag tồn tại

#### Output format

Response là một `ResCostDTO`.

#### Mô tả luồng

Cập nhật cost -> tìm cost hiện tại theo id -> cập nhật các field được truyền lên -> resolve user và cost tag mới nếu có -> lưu DB -> map sang `ResCostDTO` -> trả kết quả

#### Exception có thể trả về

- `400/404` tùy global exception handler hiện tại
  - `Cost with id ... does not exist`
  - `User with user_uuid ... does not exist`
  - `Cost tag with id ... does not exist`

---

### 5.5 DELETE `/api/v1/costs/{id}`

#### Mục đích
Xóa một `Cost`.

#### Input format

Path variable:
- `id`: `UUID` của cost

#### Output format

HTTP status:
- `204 No Content`

#### Mô tả luồng

Nhận `costUuid` -> tìm cost theo id -> xóa cost -> trả `204 No Content`

#### Exception có thể trả về

- `400/404` tùy global exception handler hiện tại
  - `Cost with id ... does not exist`

## 6. Ghi chú cho frontend

- `paidStatus` hiện chưa có rule nghiệp vụ phức tạp ở service; backend chỉ lưu đúng enum được gửi lên
- `debt` hiện do frontend / nghiệp vụ gọi API quyết định, backend không tự suy ra từ `amount`

## 7. Danh sách endpoint tóm tắt

| Method | Path | Mục đích |
|------|------|------|
| GET | `/api/v1/costs` | Lấy danh sách cost |
| GET | `/api/v1/costs/{id}` | Lấy chi tiết cost |
| POST | `/api/v1/costs` | Tạo cost |
| PUT | `/api/v1/costs/{id}` | Cập nhật cost |
| DELETE | `/api/v1/costs/{id}` | Xóa cost |
