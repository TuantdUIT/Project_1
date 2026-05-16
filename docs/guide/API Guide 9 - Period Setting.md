# API Guide 9 - Period Setting

## 1. Mục đích module

Module `Period Setting` phục vụ quản lý template khóa học.

Theo nghiệp vụ hiện tại:
- `PeriodSetting` là template của `Period`
- dùng để định nghĩa trước:
  - tên cấu hình khóa học
  - số tuần học
  - khối học
  - năm học
  - học phí
  - danh sách `LessonType` và số buổi mỗi tuần

Frontend thường dùng module này khi:
- cấu hình mẫu khóa học trước
- tạo `Period` từ template thay vì nhập tay toàn bộ

## 2. Ghi chú nghiệp vụ quan trọng

- `PeriodSetting` không phải là `Period` thực tế
- Một `PeriodSetting` có thể có nhiều `lessonTypeConfigs`
- Mỗi `lessonTypeConfig` cho biết:
  - `lessonType` nào thuộc khóa học
  - mỗi tuần cần bao nhiêu buổi của `lessonType` đó
  - thứ tự hiển thị
- Nếu `Period` được tạo từ `PeriodSetting`, backend sẽ lấy mặc định:
  - `grade`
  - `numberOfWeek`
  - `schoolYear`
  - `tuition`
- Không được xóa `PeriodSetting` nếu đã có `Period` đang dùng setting đó

## 3. Ghi chú chung cho frontend

- Base path của module: `/api/v1/period-settings`
- Response thành công được bọc theo `RestResponse`
- Module này hiện trả danh sách toàn bộ, chưa có phân trang
- Có liên quan trực tiếp tới:
  - `Grade`
  - `LessonType`
  - `Period`

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

### 4.2 Cấu trúc `ResPeriodSettingDTO`

```json
{
  "uuid_period_setting": "019dc222-d60d-7607-b06c-baea94cdf4c9",
  "period_setting_name": "K12-2026-12W",
  "number_of_week": 12,
  "grade": {
    "id": 3,
    "name": "K12"
  },
  "apply_from": "2026-05-01",
  "school_year": 2026,
  "tuition": 3600000,
  "lesson_type_configs": [
    {
      "pslt_uuid": "019dc444-d60d-7607-b06c-baea94cdf4c9",
      "lesson_type_uuid": "019dc555-d60d-7607-b06c-baea94cdf4c9",
      "lesson_type_name": "Đại số 12",
      "lesson_time": 195,
      "lessons_per_week": 4,
      "sort_order": 1
    },
    {
      "pslt_uuid": "019dc666-d60d-7607-b06c-baea94cdf4c9",
      "lesson_type_uuid": "019dc777-d60d-7607-b06c-baea94cdf4c9",
      "lesson_type_name": "Hình học",
      "lesson_time": 90,
      "lessons_per_week": 4,
      "sort_order": 2
    }
  ],
  "created_at": "2026-05-16T10:00:00Z",
  "updated_at": "2026-05-16T10:00:00Z",
  "created_by": "system",
  "updated_by": "system"
}
```

### 4.3 Cấu trúc item `lesson_type_configs`

Request item:

```json
{
  "lessonTypeId": "019dc555-d60d-7607-b06c-baea94cdf4c9",
  "lessonsPerWeek": 4,
  "sortOrder": 1
}
```

Ý nghĩa:
- `lessonTypeId`: loại buổi học
- `lessonsPerWeek`: số buổi của loại đó trong 1 tuần
- `sortOrder`: thứ tự hiển thị

## 5. Danh sách API

### 5.1 GET `/api/v1/period-settings`

#### Mục đích
Lấy toàn bộ danh sách `PeriodSetting`.

#### Input format

Không có request body.

#### Output format

Response là mảng `ResPeriodSettingDTO`.

```json
{
  "statusCode": 200,
  "error": null,
  "message": "Lay danh sach period settings",
  "data": [
    {
      "uuid_period_setting": "019dc222-d60d-7607-b06c-baea94cdf4c9",
      "period_setting_name": "K12-2026-12W",
      "number_of_week": 12,
      "grade": {
        "id": 3,
        "name": "K12"
      },
      "apply_from": "2026-05-01",
      "school_year": 2026,
      "tuition": 3600000,
      "lesson_type_configs": []
    }
  ]
}
```

#### Mô tả luồng

Nhận request -> truy vấn toàn bộ bảng `PERIOD_SETTING` -> map từng setting sang `ResPeriodSettingDTO` -> sort `lesson_type_configs` theo `sortOrder` -> trả kết quả

#### Exception có thể trả về

- Hiện tại API này không có validate nghiệp vụ riêng

---

### 5.2 GET `/api/v1/period-settings/{id}`

#### Mục đích
Lấy chi tiết một `PeriodSetting` theo `UUID`.

#### Input format

Path variable:
- `id`: `UUID` của period setting

#### Output format

Response là một `ResPeriodSettingDTO`.

#### Mô tả luồng

Nhận `periodSettingUuid` -> tìm setting trong DB theo id -> map sang `ResPeriodSettingDTO` -> sort `lesson_type_configs` theo `sortOrder` -> trả kết quả

#### Exception có thể trả về

- `400/404` tùy global exception handler hiện tại
  - `Period setting with id ... does not exist`

---

### 5.3 POST `/api/v1/period-settings`

#### Mục đích
Tạo mới một `PeriodSetting`.

#### Input format

Request body:

```json
{
  "name": "K12-2026-12W",
  "numberOfWeek": 12,
  "gradeId": 3,
  "applyFrom": "2026-05-01",
  "schoolYear": 2026,
  "tuition": 3600000,
  "lessonTypeConfigs": [
    {
      "lessonTypeId": "019dc555-d60d-7607-b06c-baea94cdf4c9",
      "lessonsPerWeek": 4,
      "sortOrder": 1
    },
    {
      "lessonTypeId": "019dc777-d60d-7607-b06c-baea94cdf4c9",
      "lessonsPerWeek": 4,
      "sortOrder": 2
    }
  ]
}
```

#### Validate input

- `name`: bắt buộc
- `numberOfWeek`: bắt buộc, `>= 1`
- `gradeId`: bắt buộc
- `applyFrom`: bắt buộc
- `schoolYear`: bắt buộc
- `tuition`: bắt buộc
- `lessonTypeConfigs`: không bắt buộc

Nếu có `lessonTypeConfigs`, mỗi item phải thỏa:
- `lessonTypeId`: bắt buộc
- `lessonsPerWeek`: bắt buộc, `>= 1`
- `sortOrder`: bắt buộc, `>= 1`

#### Output format

Response là một `ResPeriodSettingDTO`.

#### Mô tả luồng

Tạo period setting -> validate request body -> kiểm tra `gradeId` có tồn tại không -> tạo entity `PeriodSetting` -> nếu có `lessonTypeConfigs` thì lặp từng item, validate `lessonTypeId`, tạo các bản ghi `PeriodSettingLessonType` -> gắn danh sách config vào setting -> lưu `PeriodSetting` xuống DB -> map sang `ResPeriodSettingDTO` -> sort `lesson_type_configs` theo `sortOrder` -> trả kết quả

#### Exception có thể trả về

- `400 Bad Request`
  - `Ten period setting khong duoc de trong`
  - `numberOfWeek khong duoc de trong`
  - `numberOfWeek phai lon hon 0`
  - `gradeId khong duoc de trong`
  - `applyFrom khong duoc de trong`
  - `schoolYear khong duoc de trong`
  - `tuition khong duoc de trong`
  - trong từng item:
    - `lessonTypeId khong duoc de trong`
    - `lessonsPerWeek khong duoc de trong`
    - `lessonsPerWeek phai lon hon 0`
    - `sortOrder khong duoc de trong`
    - `sortOrder phai lon hon 0`
- `400/404` tùy global exception handler hiện tại
  - `Grade with id ... does not exist`
  - `Lesson type with id ... does not exist`

#### Ghi chú cho frontend

- Service hiện tại không kiểm tra trùng tên setting
- Service hiện tại cũng không chặn trùng `lessonTypeId` trong cùng một request
- Nếu frontend muốn dữ liệu sạch, nên chặn trùng `lessonTypeId` ngay trên UI

---

### 5.4 PUT `/api/v1/period-settings/{id}`

#### Mục đích
Cập nhật một `PeriodSetting`.

#### Input format

Path variable:
- `id`: `UUID` của setting

Request body:

```json
{
  "name": "K12-2026-12W-UPDATED",
  "numberOfWeek": 12,
  "gradeId": 3,
  "applyFrom": "2026-06-01",
  "schoolYear": 2026,
  "tuition": 3800000,
  "lessonTypeConfigs": [
    {
      "lessonTypeId": "019dc555-d60d-7607-b06c-baea94cdf4c9",
      "lessonsPerWeek": 4,
      "sortOrder": 1
    }
  ]
}
```

#### Validate input

- `numberOfWeek`: nếu có thì phải `>= 1`
- các field còn lại là optional
- nếu có `lessonTypeConfigs`, từng item vẫn phải validate như API create

#### Hành vi update quan trọng

- Update là kiểu partial update cho các field chính
- Riêng `lessonTypeConfigs`:
  - nếu **không truyền** field này, backend giữ nguyên danh sách cũ
  - nếu **có truyền** field này, backend sẽ:
    - xóa toàn bộ config cũ trong collection hiện tại
    - tạo lại toàn bộ config mới từ request

Nghĩa là `lessonTypeConfigs` không phải merge từng dòng, mà là replace toàn bộ danh sách nếu field này xuất hiện trong request

#### Output format

Response là một `ResPeriodSettingDTO`.

#### Mô tả luồng

Cập nhật period setting -> tìm setting hiện tại theo id -> cập nhật các field được truyền lên -> nếu đổi `gradeId` thì validate grade -> nếu có `lessonTypeConfigs` thì xóa collection config cũ trong entity và build lại toàn bộ config mới từ request -> lưu `PeriodSetting` xuống DB -> map sang `ResPeriodSettingDTO` -> sort `lesson_type_configs` theo `sortOrder` -> trả kết quả

#### Exception có thể trả về

- `400 Bad Request`
  - `numberOfWeek phai lon hon 0`
  - lỗi validate từng item trong `lessonTypeConfigs`
- `400/404` tùy global exception handler hiện tại
  - `Period setting with id ... does not exist`
  - `Grade with id ... does not exist`
  - `Lesson type with id ... does not exist`

#### Ghi chú cho frontend

- Nếu frontend chỉ muốn sửa 1 item trong `lessonTypeConfigs`, tốt nhất vẫn lấy danh sách hiện tại, sửa trên client, rồi gửi lại toàn bộ danh sách mới

---

### 5.5 DELETE `/api/v1/period-settings/{id}`

#### Mục đích
Xóa một `PeriodSetting`.

#### Input format

Path variable:
- `id`: `UUID` của setting

#### Output format

HTTP status:
- `204 No Content`

Body:
- không có body

#### Mô tả luồng

Nhận `periodSettingUuid` -> tìm setting trong DB -> kiểm tra có `Period` nào đang tham chiếu setting này không -> nếu đã có `Period` sử dụng thì chặn xóa -> nếu chưa có thì xóa setting -> trả `204 No Content`

#### Exception có thể trả về

- `400 Bad Request`
  - `Khong the xoa period setting da duoc su dung boi period`
- `400/404` tùy global exception handler hiện tại
  - `Period setting with id ... does not exist`

## 6. Luồng frontend đề xuất

### 6.1 Tạo template khóa học

1. Gọi `GET /api/v1/grades` để lấy grade
2. Gọi `GET /api/v1/lesson-types` để lấy lesson type
3. Người dùng nhập:
   - tên setting
   - số tuần
   - grade
   - ngày áp dụng
   - năm học
   - học phí
   - danh sách lesson type config
4. Gửi `POST /api/v1/period-settings`

### 6.2 Cập nhật template khóa học

1. Gọi `GET /api/v1/period-settings/{id}`
2. Sửa dữ liệu trên UI
3. Nếu có chỉnh `lessonTypeConfigs`, frontend nên gửi lại toàn bộ danh sách
4. Gọi `PUT /api/v1/period-settings/{id}`

### 6.3 Tạo `Period` từ template

Luồng liên quan module khác:
1. Frontend chọn học sinh
2. Frontend chọn `PeriodSetting`
3. Gửi `POST /api/v1/periods` với `periodSettingId`
4. Backend sẽ lấy dữ liệu lõi từ `PeriodSetting` để sinh `Period`

## 7. Ghi chú liên quan module khác

- `PeriodSetting` là dữ liệu nguồn cho module `Period`
- `lessonTypeConfigs` là dữ liệu nguồn để:
  - xác định loại nội dung học của khóa
  - phục vụ thống kê attendance theo `LessonType`
- `TimetableTemplate` là template lịch tuần, tách riêng với `PeriodSetting`
- `PeriodSetting` không trực tiếp sinh `Lesson`; việc sinh `Lesson` diễn ra ở module `StudyWeek` dựa trên `TimetableTemplate`

## 8. Danh sách endpoint tóm tắt

| Method | Path | Mục đích |
|------|------|------|
| GET | `/api/v1/period-settings` | Lấy danh sách period setting |
| GET | `/api/v1/period-settings/{id}` | Lấy chi tiết period setting |
| POST | `/api/v1/period-settings` | Tạo period setting |
| PUT | `/api/v1/period-settings/{id}` | Cập nhật period setting |
| DELETE | `/api/v1/period-settings/{id}` | Xóa period setting |
