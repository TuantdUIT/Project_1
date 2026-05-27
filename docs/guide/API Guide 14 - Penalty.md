# API Guide 14 - Penalty

## 1. Mục đích module

Module `Penalty` phục vụ ghi nhận phạt cho đối tượng không phải học sinh theo từng `Lesson`.

Theo nghiệp vụ hiện tại:
- `Penalty` không áp dụng cho `STUDENT`
- một penalty gắn với:
  - một `Lesson`
  - một `User`
  - nội dung phạt
  - tập `PenaltyTag`

## 2. Ghi chú nghiệp vụ quan trọng

- user bị ghi penalty phải là non-student user
- `Penalty` có thể gắn nhiều `PenaltyTag`
- `tagIds` trong request là optional
- hiện tại service không chặn trùng penalty theo `user + lesson + content`

## 3. Ghi chú chung cho frontend

- Base path của module: `/api/v1/penalties`
- Response thành công được bọc theo `RestResponse`
- Module này trả danh sách toàn bộ, chưa có phân trang
- `PenaltyTag` là domain riêng, không dùng chung với `CostTag`

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

### 4.2 Cấu trúc `ResPenaltyDTO`

```json
{
  "penalty_uuid": "019aa111-d60d-7607-b06c-baea94cdf4c9",
  "lesson": {
    "lesson_uuid": "019dc999-d60d-7607-b06c-baea94cdf4c9",
    "week_uuid": "019dc888-d60d-7607-b06c-baea94cdf4c9",
    "week_number": 20,
    "school_year": 2026,
    "lesson_type_uuid": "019dc555-d60d-7607-b06c-baea94cdf4c9",
    "lesson_type_name": "Đại số 12",
    "lesson_date": "2026-05-17",
    "lesson_start_time": "07:15:00"
  },
  "user": {
    "user_uuid": "019ee000-d60d-7607-b06c-baea94cdf4c9",
    "user_fullname": "Tran Van B",
    "user_email": "ta1@example.com",
    "role_name": "TA"
  },
  "content": "Di tre",
  "tags": [
    {
      "id": 1,
      "name": "Ky luat",
      "description": "Vi pham ky luat"
    }
  ],
  "created_at": "2026-05-16T10:00:00Z",
  "updated_at": "2026-05-16T10:00:00Z",
  "created_by": "system",
  "updated_by": "system"
}
```

## 5. Danh sách API

### 5.1 GET `/api/v1/penalties`

#### Mục đích
Lấy toàn bộ danh sách `Penalty`.

#### Input format

Không có request body.

#### Output format

Response là mảng `ResPenaltyDTO`.

#### Mô tả luồng

Nhận request -> truy vấn toàn bộ bảng `PENALTY` -> resolve lesson, user và tags -> map sang `ResPenaltyDTO` -> trả kết quả

#### Exception có thể trả về

- Hiện tại API này không có validate nghiệp vụ riêng

---

### 5.2 GET `/api/v1/penalties/{id}`

#### Mục đích
Lấy chi tiết một `Penalty`.

#### Input format

Path variable:
- `id`: `UUID` của penalty

#### Output format

Response là một `ResPenaltyDTO`.

#### Mô tả luồng

Nhận `penaltyUuid` -> tìm penalty theo id -> map sang `ResPenaltyDTO` -> trả kết quả

#### Exception có thể trả về

- `400/404` tùy global exception handler hiện tại
  - `Penalty with id ... does not exist`

---

### 5.3 POST `/api/v1/penalties`

#### Mục đích
Tạo mới một `Penalty`.

#### Input format

Request body:

```json
{
  "lessonUuid": "019dc999-d60d-7607-b06c-baea94cdf4c9",
  "userUuid": "019ee000-d60d-7607-b06c-baea94cdf4c9",
  "content": "Di tre",
  "tagIds": [1, 2]
}
```

#### Validate input

- `lessonUuid`: bắt buộc
- `userUuid`: bắt buộc
- `content`: bắt buộc
- `tagIds`: optional

#### Validate nghiệp vụ khi tạo

Backend kiểm tra:
- lesson tồn tại
- user tồn tại
- user có role khác `STUDENT`
- nếu có `tagIds` thì toàn bộ `PenaltyTag` phải tồn tại

#### Output format

Response là một `ResPenaltyDTO`.

#### Mô tả luồng

Tạo penalty -> validate request body -> resolve lesson -> resolve user -> kiểm tra user không phải student -> resolve toàn bộ penalty tag nếu có -> tạo entity `Penalty` -> lưu DB -> map sang `ResPenaltyDTO` -> trả kết quả

#### Exception có thể trả về

- `400 Bad Request`
  - `lessonUuid khong duoc de trong`
  - `userUuid khong duoc de trong`
  - `Noi dung phat khong duoc de trong`
  - `User chua co role, khong the ghi penalty`
  - `Penalty nay khong ap dung cho student`
- `400/404` tùy global exception handler hiện tại
  - `Lesson with id ... does not exist`
  - `User with user_uuid ... does not exist`
  - `Mot hoac nhieu penalty tag khong ton tai`

---

### 5.4 PUT `/api/v1/penalties/{id}`

#### Mục đích
Cập nhật một `Penalty`.

#### Input format

Path variable:
- `id`: `UUID` của penalty

Request body:

```json
{
  "lessonUuid": "019dc999-d60d-7607-b06c-baea94cdf4c9",
  "userUuid": "019ee000-d60d-7607-b06c-baea94cdf4c9",
  "content": "Di tre lan 2",
  "tagIds": [1]
}
```

#### Validate input

- tất cả field đều optional

#### Validate nghiệp vụ khi update

Backend kiểm tra:
- nếu có `lessonUuid` thì lesson tồn tại
- nếu có `userUuid` thì user tồn tại và không phải student
- nếu có `tagIds` thì toàn bộ penalty tag phải tồn tại

#### Output format

Response là một `ResPenaltyDTO`.

#### Mô tả luồng

Cập nhật penalty -> tìm penalty hiện tại theo id -> cập nhật lesson nếu có -> cập nhật user nếu có và validate non-student -> cập nhật content nếu có -> nếu có `tagIds` thì thay bằng tập tag mới -> lưu DB -> trả kết quả

#### Exception có thể trả về

- `400 Bad Request`
  - `User chua co role, khong the ghi penalty`
  - `Penalty nay khong ap dung cho student`
- `400/404` tùy global exception handler hiện tại
  - `Penalty with id ... does not exist`
  - `Lesson with id ... does not exist`
  - `User with user_uuid ... does not exist`
  - `Mot hoac nhieu penalty tag khong ton tai`

---

### 5.5 DELETE `/api/v1/penalties/{id}`

#### Mục đích
Xóa một `Penalty`.

#### Input format

Path variable:
- `id`: `UUID` của penalty

#### Output format

HTTP status:
- `204 No Content`

#### Mô tả luồng

Nhận `penaltyUuid` -> tìm penalty theo id -> xóa khỏi DB -> trả `204 No Content`

#### Exception có thể trả về

- `400/404` tùy global exception handler hiện tại
  - `Penalty with id ... does not exist`

## 6. Ghi chú liên quan module khác

- `Penalty` phụ thuộc:
  - `Lesson`
  - `User`
  - `PenaltyTag`
- Nếu frontend cần màn hình chọn tag, cần gọi module:
  - `/api/v1/penalty-tags`

## 7. Danh sách endpoint tóm tắt

| Method | Path | Mục đích |
|------|------|------|
| GET | `/api/v1/penalties` | Lấy danh sách penalty |
| GET | `/api/v1/penalties/{id}` | Lấy chi tiết penalty |
| POST | `/api/v1/penalties` | Tạo penalty |
| PUT | `/api/v1/penalties/{id}` | Cập nhật penalty |
| DELETE | `/api/v1/penalties/{id}` | Xóa penalty |
