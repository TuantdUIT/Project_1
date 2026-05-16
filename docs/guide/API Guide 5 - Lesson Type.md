# API Guide 5 - Lesson Type

## 1. Mục đích module

Module `Lesson Type` phục vụ quản lý loại buổi học / loại nội dung học.

Theo nghiệp vụ hiện tại, `LessonType` được dùng làm nền cho:
- `PeriodSettingLessonType`
- `TimetableTemplateItem`
- `Lesson`
- `Attendance`
- `RecordAttendance`

Ví dụ dữ liệu đang dùng trong hệ thống:
- `Đại số`
- `Đại số 12`
- `Hình học`
- `DGNL`
- `VDC`

## 2. Ghi chú nghiệp vụ quan trọng

- `LessonType` định nghĩa:
  - tên loại buổi học
  - thời lượng chuẩn của loại buổi học đó, đơn vị hiện tại là `phút`
- `LessonType` không phải lesson thực tế
- `LessonType` là danh mục nền dùng lại ở nhiều module
- `LessonType.lessonTime` khác với `Lesson.realLessonLength`
  - `lessonTime`: thời lượng chuẩn của loại buổi học
  - `realLessonLength`: thời lượng thực tế của từng lesson cụ thể

## 3. Ghi chú chung cho frontend

- Base path của module: `/api/v1/lesson-types`
- Response thành công được bọc theo `RestResponse`
- Module này hiện trả danh sách toàn bộ, chưa có phân trang

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

### 4.2 Cấu trúc `ResLessonTypeDTO`

```json
{
  "lesson_type_uuid": "019dc555-d60d-7607-b06c-baea94cdf4c9",
  "lesson_type_name": "Đại số 12",
  "lesson_time": 195,
  "created_at": "2026-05-16T10:00:00Z",
  "updated_at": "2026-05-16T10:00:00Z",
  "created_by": "system",
  "updated_by": "system"
}
```

## 5. Danh sách API

### 5.1 GET `/api/v1/lesson-types`

#### Mục đích
Lấy toàn bộ danh sách `LessonType`.

#### Input format

Không có request body.

#### Output format

Response là mảng `ResLessonTypeDTO`.

```json
{
  "statusCode": 200,
  "error": null,
  "message": "Lay danh sach lesson types",
  "data": [
    {
      "lesson_type_uuid": "019dc555-d60d-7607-b06c-baea94cdf4c9",
      "lesson_type_name": "Đại số",
      "lesson_time": 120
    },
    {
      "lesson_type_uuid": "019dc666-d60d-7607-b06c-baea94cdf4c9",
      "lesson_type_name": "Hình học",
      "lesson_time": 90
    }
  ]
}
```

#### Mô tả luồng

Nhận request -> truy vấn toàn bộ bảng `LESSON_TYPE` -> map sang `ResLessonTypeDTO` -> trả kết quả

#### Exception có thể trả về

- Hiện tại API này không có validate nghiệp vụ riêng

#### Ghi chú cho frontend

- Đây là API phù hợp để load dropdown / select ở:
  - `Period Setting`
  - `Timetable Template`
  - `Lesson`

---

### 5.2 GET `/api/v1/lesson-types/{id}`

#### Mục đích
Lấy chi tiết một `LessonType` theo `UUID`.

#### Input format

Path variable:
- `id`: `UUID` của lesson type

#### Output format

Response là một `ResLessonTypeDTO`.

#### Mô tả luồng

Nhận `lessonTypeUuid` -> tìm lesson type trong DB theo id -> map sang `ResLessonTypeDTO` -> trả kết quả

#### Exception có thể trả về

- `400/404` tùy global exception handler hiện tại
  - `Lesson type with id ... does not exist`

---

### 5.3 POST `/api/v1/lesson-types`

#### Mục đích
Tạo mới một `LessonType`.

#### Input format

Request body:

```json
{
  "name": "Đại số 12",
  "lessonTime": 195
}
```

#### Validate input

- `name`: bắt buộc
- `lessonTime`: bắt buộc, `>= 1`
- `name`: không được trùng với lesson type đã có

#### Output format

Response là một `ResLessonTypeDTO`.

#### Mô tả luồng

Tạo lesson type -> validate request body -> kiểm tra tên lesson type đã tồn tại chưa -> tạo entity `LessonType` -> lưu xuống DB -> map sang `ResLessonTypeDTO` -> trả kết quả

#### Exception có thể trả về

- `400 Bad Request`
  - `Ten loai buoi hoc khong duoc de trong`
  - `Thoi luong khong duoc de trong`
  - `Thoi luong phai lon hon 0`
  - `Lesson type with name '...' already exists`

---

### 5.4 PUT `/api/v1/lesson-types/{id}`

#### Mục đích
Cập nhật một `LessonType`.

#### Input format

Path variable:
- `id`: `UUID` của lesson type

Request body:

```json
{
  "name": "Đại số 12",
  "lessonTime": 195
}
```

#### Validate input

- `name`: bắt buộc
- `lessonTime`: bắt buộc, `>= 1`
- nếu tên mới khác tên cũ thì không được trùng với lesson type khác

#### Output format

Response là một `ResLessonTypeDTO`.

#### Mô tả luồng

Cập nhật lesson type -> tìm lesson type hiện tại theo id -> validate request body -> nếu tên mới khác tên cũ thì kiểm tra trùng -> cập nhật `name` và `lessonTime` -> lưu DB -> trả kết quả

#### Exception có thể trả về

- `400 Bad Request`
  - `Ten loai buoi hoc khong duoc de trong`
  - `Thoi luong khong duoc de trong`
  - `Thoi luong phai lon hon 0`
  - `Lesson type with name '...' already exists`
- `400/404` tùy global exception handler hiện tại
  - `Lesson type with id ... does not exist`

---

### 5.5 DELETE `/api/v1/lesson-types/{id}`

#### Mục đích
Xóa một `LessonType`.

#### Input format

Path variable:
- `id`: `UUID` của lesson type

#### Output format

HTTP status:
- `204 No Content`

Body:
- không có body

#### Mô tả luồng

Nhận `lessonTypeUuid` -> tìm lesson type trong DB -> xóa lesson type -> trả `204 No Content`

#### Exception có thể trả về

- `400/404` tùy global exception handler hiện tại
  - `Lesson type with id ... does not exist`
- Ngoài ra, nếu DB có ràng buộc dữ liệu đang dùng `LessonType` ở:
  - `PeriodSettingLessonType`
  - `TimetableTemplateItem`
  - `Lesson`
  thì thao tác xóa có thể fail ở tầng persistence / database

#### Ghi chú cho frontend

- Service hiện tại chưa chủ động chặn xóa lesson type đang được dùng
- Nếu muốn an toàn, frontend nên chỉ cho xóa khi chắc chắn lesson type chưa bị tham chiếu ở module khác

## 6. Dữ liệu seed mặc định hiện có

Theo `data.sql`, hệ thống hiện đã seed sẵn các `LessonType`:
- `Đại số`
- `Đại số 12`
- `Hình học`
- `DGNL`
- `VDC`

Frontend có thể kỳ vọng môi trường mới khởi tạo DB sẽ có sẵn các giá trị này.

## 7. Luồng frontend đề xuất

### 7.1 Dùng làm danh mục nền

1. Gọi `GET /api/v1/lesson-types`
2. Dùng danh sách này để render:
   - cấu hình `Period Setting`
   - cấu hình `Timetable Template`
   - tạo `Lesson`

### 7.2 Màn hình CRUD lesson type

1. Danh sách:
   - gọi `GET /api/v1/lesson-types`
2. Tạo:
   - gọi `POST /api/v1/lesson-types`
3. Cập nhật:
   - gọi `PUT /api/v1/lesson-types/{id}`
4. Xóa:
   - gọi `DELETE /api/v1/lesson-types/{id}`

## 8. Danh sách endpoint tóm tắt

| Method | Path | Mục đích |
|------|------|------|
| GET | `/api/v1/lesson-types` | Lấy danh sách lesson type |
| GET | `/api/v1/lesson-types/{id}` | Lấy chi tiết lesson type |
| POST | `/api/v1/lesson-types` | Tạo lesson type |
| PUT | `/api/v1/lesson-types/{id}` | Cập nhật lesson type |
| DELETE | `/api/v1/lesson-types/{id}` | Xóa lesson type |
