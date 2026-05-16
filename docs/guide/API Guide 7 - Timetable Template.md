# API Guide 7 - Timetable Template

## 1. Mục đích module

Module `Timetable Template` phục vụ quản lý template lịch học tuần.

Theo nghiệp vụ hiện tại:
- đây là template lịch học tuần, không phải `Lesson` thực tế
- template dùng để mô tả các khung giờ học có thể chọn trong tuần theo từng `Grade`
- `Period` có thể tham chiếu tới template này để học sinh xem option lịch học
- khi tạo `StudyWeek`, backend sẽ dựa vào `TimetableTemplate` đang hiệu lực để sinh ra `Lesson` thực tế

## 2. Ghi chú nghiệp vụ quan trọng

- `TimetableTemplate` độc lập với `Lesson`
- sửa template không được làm thay đổi ngược các `Lesson` đã tồn tại trước đó
- mỗi template gắn với:
  - `Grade`
  - `schoolYear`
  - `applyFrom`
  - `active`
- mỗi item trong template mô tả:
  - `LessonType`
  - `dayOfWeek`
  - `startTime`
  - `sortOrder`
- nếu update có gửi `items`, backend sẽ thay toàn bộ danh sách item cũ, không merge từng item
- không được xóa `TimetableTemplate` nếu đã có `Period` đang gắn template đó

## 3. Ghi chú chung cho frontend

- Base path của module: `/api/v1/timetable-templates`
- Response thành công được bọc theo `RestResponse`
- Module này hiện trả danh sách toàn bộ, chưa có phân trang
- Có liên quan trực tiếp tới:
  - `Grade`
  - `LessonType`
  - `Period`
  - `StudyWeek`
  - `Lesson`

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

### 4.2 Cấu trúc `ResTimetableTemplateDTO`

```json
{
  "timetable_template_uuid": "019dc333-d60d-7607-b06c-baea94cdf4c9",
  "timetable_template_name": "K12-2026-DEFAULT",
  "grade": {
    "id": 3,
    "name": "K12"
  },
  "school_year": 2026,
  "apply_from": "2026-01-01",
  "active": true,
  "items": [
    {
      "timetable_template_item_uuid": "019dc444-d60d-7607-b06c-baea94cdf4c9",
      "lesson_type_uuid": "019dc555-d60d-7607-b06c-baea94cdf4c9",
      "lesson_type_name": "Đại số 12",
      "day_of_week": "SUNDAY",
      "start_time": "07:15:00",
      "sort_order": 1
    }
  ],
  "created_at": "2026-05-16T10:00:00Z",
  "updated_at": "2026-05-16T10:00:00Z",
  "created_by": "system",
  "updated_by": "system"
}
```

### 4.3 Cấu trúc item trong request

```json
{
  "lessonTypeId": "019dc555-d60d-7607-b06c-baea94cdf4c9",
  "dayOfWeek": "SUNDAY",
  "startTime": "07:15:00",
  "sortOrder": 1
}
```

## 5. Danh sách API

### 5.1 GET `/api/v1/timetable-templates`

#### Mục đích
Lấy toàn bộ danh sách `TimetableTemplate`.

#### Input format

Không có request body.

#### Output format

Response là mảng `ResTimetableTemplateDTO`.

#### Mô tả luồng

Nhận request -> truy vấn toàn bộ bảng `TIMETABLE_TEMPLATE` -> map từng template sang `ResTimetableTemplateDTO` -> sort `items` theo `sortOrder` -> trả kết quả

#### Exception có thể trả về

- Hiện tại API này không có validate nghiệp vụ riêng

---

### 5.2 GET `/api/v1/timetable-templates/{id}`

#### Mục đích
Lấy chi tiết một `TimetableTemplate` theo `UUID`.

#### Input format

Path variable:
- `id`: `UUID` của template

#### Output format

Response là một `ResTimetableTemplateDTO`.

#### Mô tả luồng

Nhận `timetableTemplateUuid` -> tìm template trong DB theo id -> map sang `ResTimetableTemplateDTO` -> sort `items` theo `sortOrder` -> trả kết quả

#### Exception có thể trả về

- `400/404` tùy global exception handler hiện tại
  - `Timetable template with id ... does not exist`

---

### 5.3 POST `/api/v1/timetable-templates`

#### Mục đích
Tạo mới một `TimetableTemplate`.

#### Input format

Request body:

```json
{
  "name": "K12-2026-DEFAULT",
  "gradeId": 3,
  "schoolYear": 2026,
  "applyFrom": "2026-01-01",
  "active": true,
  "items": [
    {
      "lessonTypeId": "019dc555-d60d-7607-b06c-baea94cdf4c9",
      "dayOfWeek": "SUNDAY",
      "startTime": "07:15:00",
      "sortOrder": 1
    },
    {
      "lessonTypeId": "019dc555-d60d-7607-b06c-baea94cdf4c9",
      "dayOfWeek": "MONDAY",
      "startTime": "17:45:00",
      "sortOrder": 2
    }
  ]
}
```

#### Validate input

- `name`: bắt buộc
- `gradeId`: bắt buộc
- `schoolYear`: bắt buộc
- `applyFrom`: bắt buộc
- `active`: không bắt buộc
- `items`: không bắt buộc

Nếu có `items`, mỗi item phải có:
- `lessonTypeId`: bắt buộc
- `dayOfWeek`: bắt buộc
- `startTime`: bắt buộc
- `sortOrder`: bắt buộc, `>= 1`

#### Output format

Response là một `ResTimetableTemplateDTO`.

#### Mô tả luồng

Tạo timetable template -> validate request body -> kiểm tra `gradeId` tồn tại -> tạo entity `TimetableTemplate` -> nếu có `items` thì lặp từng item, validate `lessonTypeId`, tạo `TimetableTemplateItem` -> gắn danh sách item vào template -> lưu xuống DB -> map sang `ResTimetableTemplateDTO` -> sort `items` theo `sortOrder` -> trả kết quả

#### Exception có thể trả về

- `400 Bad Request`
  - `Ten timetable template khong duoc de trong`
  - `gradeId khong duoc de trong`
  - `schoolYear khong duoc de trong`
  - `applyFrom khong duoc de trong`
  - trong từng item:
    - `lessonTypeId khong duoc de trong`
    - `dayOfWeek khong duoc de trong`
    - `startTime khong duoc de trong`
    - `sortOrder khong duoc de trong`
    - `sortOrder phai lon hon 0`
- `400/404` tùy global exception handler hiện tại
  - `Grade with id ... does not exist`
  - `Lesson type with id ... does not exist`

#### Ghi chú cho frontend

- Service hiện tại không chặn trùng slot
- Tức là về mặt code hiện tại, frontend có thể gửi 2 item trùng hoàn toàn:
  - cùng `lessonTypeId`
  - cùng `dayOfWeek`
  - cùng `startTime`
- Nếu muốn dữ liệu sạch, frontend nên tự chặn trùng trước ở UI

---

### 5.4 PUT `/api/v1/timetable-templates/{id}`

#### Mục đích
Cập nhật một `TimetableTemplate`.

#### Input format

Path variable:
- `id`: `UUID` của template

Request body:

```json
{
  "name": "K12-2026-DEFAULT-V2",
  "gradeId": 3,
  "schoolYear": 2026,
  "applyFrom": "2026-06-01",
  "active": true,
  "items": [
    {
      "lessonTypeId": "019dc555-d60d-7607-b06c-baea94cdf4c9",
      "dayOfWeek": "SUNDAY",
      "startTime": "07:15:00",
      "sortOrder": 1
    }
  ]
}
```

#### Validate input

- các field đều optional
- nếu có `items`, từng item phải validate như API create

#### Hành vi update quan trọng

- Update là partial update cho các field chính
- Riêng `items`:
  - nếu **không truyền** thì backend giữ nguyên item cũ
  - nếu **có truyền** thì backend:
    - xóa toàn bộ item cũ trong collection
    - tạo lại toàn bộ item mới từ request

#### Output format

Response là một `ResTimetableTemplateDTO`.

#### Mô tả luồng

Cập nhật timetable template -> tìm template hiện tại theo id -> update các field được truyền lên -> nếu đổi `gradeId` thì validate grade -> nếu có `items` thì clear toàn bộ collection item cũ và build lại toàn bộ item mới -> lưu DB -> map sang `ResTimetableTemplateDTO` -> sort `items` theo `sortOrder` -> trả kết quả

#### Exception có thể trả về

- `400 Bad Request`
  - lỗi validate từng item
- `400/404` tùy global exception handler hiện tại
  - `Timetable template with id ... does not exist`
  - `Grade with id ... does not exist`
  - `Lesson type with id ... does not exist`

#### Ghi chú cho frontend

- Nếu frontend chỉ sửa 1 item, nên load danh sách hiện tại, sửa trên client rồi gửi lại toàn bộ `items`

---

### 5.5 DELETE `/api/v1/timetable-templates/{id}`

#### Mục đích
Xóa một `TimetableTemplate`.

#### Input format

Path variable:
- `id`: `UUID` của template

#### Output format

HTTP status:
- `204 No Content`

Body:
- không có body

#### Mô tả luồng

Nhận `timetableTemplateUuid` -> tìm template trong DB -> kiểm tra có `Period` nào đang gắn template này không -> nếu đã có `Period` dùng template thì chặn xóa -> nếu chưa có thì xóa template -> trả `204 No Content`

#### Exception có thể trả về

- `400 Bad Request`
  - `Khong the xoa timetable template da duoc gan cho period`
- `400/404` tùy global exception handler hiện tại
  - `Timetable template with id ... does not exist`

## 6. Luồng liên quan sang module khác

### 6.1 Liên quan tới `Period`

`Period` có thể gắn `timetableTemplateId` để học sinh xem các khung giờ học có thể chọn trong tuần.

Luồng ngắn:
- tạo / cập nhật `Period`
- chọn `TimetableTemplate`
- `Period` lưu reference tới template này

### 6.2 Liên quan tới `StudyWeek` và `Lesson`

Đây là luồng quan trọng nhất của module này.

Khi tạo hoặc cập nhật `StudyWeek`, backend sẽ:
1. lấy tất cả `TimetableTemplate` có:
   - cùng `schoolYear`
   - `active = true`
   - `applyFrom <= week_start_date`
2. với mỗi `Grade`, chọn template mới nhất theo `applyFrom`
3. duyệt toàn bộ `items` trong template đó
4. tính `lessonDate` thực tế từ:
   - `StudyWeek`
   - `dayOfWeek`
5. tạo `Lesson` nếu chưa tồn tại

Kết quả:
- `TimetableTemplate` là nguồn sinh `Lesson`
- `Lesson` là snapshot thực tế, không tự động bị đổi ngược khi template bị sửa sau này

## 7. Luồng frontend đề xuất

### 7.1 Tạo template lịch tuần

1. Gọi `GET /api/v1/grades`
2. Gọi `GET /api/v1/lesson-types`
3. Người dùng chọn grade, năm học, ngày áp dụng
4. Thêm các item theo thứ, giờ, lesson type
5. Gửi `POST /api/v1/timetable-templates`

### 7.2 Cập nhật template lịch tuần

1. Gọi `GET /api/v1/timetable-templates/{id}`
2. Hiển thị danh sách item
3. Nếu sửa items, gửi lại toàn bộ danh sách mới
4. Gọi `PUT /api/v1/timetable-templates/{id}`

## 8. Danh sách endpoint tóm tắt

| Method | Path | Mục đích |
|------|------|------|
| GET | `/api/v1/timetable-templates` | Lấy danh sách timetable template |
| GET | `/api/v1/timetable-templates/{id}` | Lấy chi tiết timetable template |
| POST | `/api/v1/timetable-templates` | Tạo timetable template |
| PUT | `/api/v1/timetable-templates/{id}` | Cập nhật timetable template |
| DELETE | `/api/v1/timetable-templates/{id}` | Xóa timetable template |
