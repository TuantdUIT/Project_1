# API Guide 10 - Period

## 1. Mục đích module

Module `Period` phục vụ quản lý khóa học thực tế gắn với từng học sinh.

Theo nghiệp vụ hiện tại:
- `PeriodSetting` là template của `Period`
- `Period` là instance thực tế mà học sinh đăng ký
- một học sinh có thể có nhiều `Period`
- `Student.debt` được tính từ tổng `debt` của tất cả `Period`
- `student_first_enroll_date` được set đúng 1 lần khi tạo `Period` đầu tiên

## 2. Ghi chú nghiệp vụ quan trọng

- `Period` có thể được tạo theo 2 cách:
  - dùng `periodSettingId`
  - không dùng `periodSettingId`, nhập tay các field bắt buộc
- `estimate_expire_date` được backend tự tính từ:
  - `enrollDate`
  - `numberOfWeek`
  - `useStudyWeekStartDate`
- `period_start_week`:
  - nếu request có truyền thì dùng giá trị đó
  - nếu không truyền thì backend tự suy ra từ `StudyWeek` chứa ngày bắt đầu hiệu lực
- `useStudyWeekStartDate`:
  - mặc định là `true`
  - nếu `true`, ngày bắt đầu hiệu lực là `Chủ nhật` của tuần chứa `enrollDate`
  - nếu `false`, ngày bắt đầu hiệu lực là chính `enrollDate`
- `debt`:
  - nếu request có truyền thì dùng giá trị đó
  - nếu không truyền:
    - `PAID` -> `0`
    - `UNPAID` -> `tuition`
    - `PARTIAL` -> `tuition`
- `is_editted_from_setting` do backend tự xác định

## 3. Ghi chú chung cho frontend

- Base path của module: `/api/v1/periods`
- Response thành công được bọc theo `RestResponse`
- Module này hiện trả danh sách toàn bộ, chưa có phân trang
- `Period` có liên quan trực tiếp tới:
  - `Student`
  - `Grade`
  - `StudyWeek`
  - `PeriodSetting`
  - `TimetableTemplate`

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

### 4.2 Cấu trúc `ResPeriodDTO`

```json
{
  "period_uuid": "019dc111-d60d-7607-b06c-baea94cdf4c9",
  "user_uuid": "019dbfff-d60d-7607-b06c-baea94cdf4c9",
  "student_id": "10013",
  "week_left": 12,
  "number_of_week": 12,
  "grade": {
    "id": 3,
    "name": "K12"
  },
  "school_year": 2026,
  "tuition": 3600000,
  "tuition_status": "UNPAID",
  "enroll_date": "2026-05-16",
  "estimate_expire_date": "2026-08-08",
  "debt": 3600000,
  "note": "Hoc sinh hoc thu",
  "period_start_week": 20,
  "period_setting": {
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
  },
  "timetable_template": {
    "timetable_template_uuid": "019dc333-d60d-7607-b06c-baea94cdf4c9",
    "timetable_template_name": "K12-2026-DEFAULT",
    "grade": {
      "id": 3,
      "name": "K12"
    },
    "school_year": 2026,
    "apply_from": "2026-01-01",
    "active": true,
    "items": []
  },
  "is_editted_from_setting": false,
  "use_study_week_start_date": true,
  "created_at": "2026-05-16T10:00:00Z",
  "updated_at": "2026-05-16T10:00:00Z",
  "created_by": "system",
  "updated_by": "system"
}
```

## 5. Danh sách API

### 5.1 GET `/api/v1/periods`

#### Mục đích
Lấy toàn bộ danh sách `Period`.

#### Input format

Không có request body.

#### Output format

Response là mảng `ResPeriodDTO`.

```json
{
  "statusCode": 200,
  "error": null,
  "message": "Lay danh sach periods",
  "data": [
    {
      "period_uuid": "019dc111-d60d-7607-b06c-baea94cdf4c9",
      "user_uuid": "019dbfff-d60d-7607-b06c-baea94cdf4c9",
      "student_id": "10013",
      "week_left": 12,
      "number_of_week": 12,
      "school_year": 2026
    }
  ]
}
```

#### Mô tả luồng

Nhận request -> truy vấn toàn bộ bảng `PERIOD` -> map từng bản ghi sang `ResPeriodDTO` -> trả kết quả

#### Exception có thể trả về

- Hiện tại API này không có validate nghiệp vụ riêng

---

### 5.2 GET `/api/v1/periods/{id}`

#### Mục đích
Lấy chi tiết một `Period` theo `UUID`.

#### Input format

Path variable:
- `id`: `UUID` của period

#### Output format

Response là một `ResPeriodDTO`.

#### Mô tả luồng

Nhận `periodUuid` -> tìm `Period` trong DB theo id -> map sang `ResPeriodDTO` -> trả kết quả

#### Exception có thể trả về

- `400/404` tùy global exception handler hiện tại
  - `Period with id ... does not exist`

---

### 5.3 POST `/api/v1/periods`

#### Mục đích
Tạo mới một `Period` cho học sinh.

#### Input format

Request body mẫu khi dùng `periodSettingId`:

```json
{
  "userUuid": "019dbfff-d60d-7607-b06c-baea94cdf4c9",
  "periodSettingId": "019dc222-d60d-7607-b06c-baea94cdf4c9",
  "timetableTemplateId": "019dc333-d60d-7607-b06c-baea94cdf4c9",
  "tuitionStatus": "UNPAID",
  "enrollDate": "2026-05-16",
  "debt": 1800000,
  "note": "Dang ky khoa hoc moi",
  "periodStartWeek": 20,
  "useStudyWeekStartDate": true
}
```

Request body mẫu khi không dùng `periodSettingId`:

```json
{
  "userUuid": "019dbfff-d60d-7607-b06c-baea94cdf4c9",
  "timetableTemplateId": "019dc333-d60d-7607-b06c-baea94cdf4c9",
  "gradeId": 3,
  "weekLeft": 12,
  "numberOfWeek": 12,
  "schoolYear": 2026,
  "tuition": 3600000,
  "tuitionStatus": "UNPAID",
  "enrollDate": "2026-05-16",
  "debt": 3600000,
  "note": "Nhap tay period",
  "periodStartWeek": 20,
  "useStudyWeekStartDate": true
}
```

#### Validate input cơ bản

- `userUuid`: bắt buộc
- `tuitionStatus`: bắt buộc
  - `PAID`
  - `UNPAID`
  - `PARTIAL`
- `enrollDate`: bắt buộc
- `weekLeft`: nếu có thì phải `>= 1`
- `numberOfWeek`: nếu có thì phải `>= 1`

#### Validate nghiệp vụ khi tạo

##### Trường hợp có `periodSettingId`

Backend sẽ lấy mặc định từ `PeriodSetting` nếu request không truyền:
- `grade`
- `numberOfWeek`
- `schoolYear`
- `tuition`

##### Trường hợp không có `periodSettingId`

Request bắt buộc phải có:
- `gradeId`
- `numberOfWeek`
- `schoolYear`
- `tuition`

Nếu thiếu sẽ lỗi:
- `gradeId khong duoc de trong khi khong su dung period setting`
- `numberOfWeek khong duoc de trong khi khong su dung period setting`
- `schoolYear khong duoc de trong khi khong su dung period setting`
- `tuition khong duoc de trong khi khong su dung period setting`

#### Output format

Response là một `ResPeriodDTO`.

#### Mô tả luồng

Tạo period -> validate request body -> tìm `Student` theo `userUuid` -> nếu có `periodSettingId` thì lấy `PeriodSetting`, nếu có `timetableTemplateId` thì lấy `TimetableTemplate` -> resolve `grade`, `numberOfWeek`, `schoolYear`, `tuition` từ request hoặc từ `PeriodSetting` -> xác định `useStudyWeekStartDate` mặc định là `true` nếu request không truyền -> tính `estimate_expire_date` -> xác định `period_start_week`, nếu request không truyền thì tự dò `StudyWeek` phù hợp -> xác định `week_left`, nếu request không truyền thì mặc định bằng `numberOfWeek` -> xác định `debt` theo request hoặc theo `tuitionStatus` -> xác định `is_editted_from_setting` -> lưu `Period` xuống DB -> nếu học sinh chưa có `student_first_enroll_date` thì set bằng `enrollDate` của period đầu tiên -> cộng lại toàn bộ `debt` của các period để cập nhật `Student.debt` -> trả kết quả

#### Exception có thể trả về

- `400 Bad Request`
  - `userUuid khong duoc de trong`
  - `tuitionStatus khong duoc de trong`
  - `enrollDate khong duoc de trong`
  - `weekLeft phai lon hon 0`
  - `numberOfWeek phai lon hon 0`
  - các lỗi thiếu field khi không dùng `periodSettingId`
- `400/404` tùy global exception handler hiện tại
  - `Student with user_uuid ... does not exist`
  - `Grade with id ... does not exist`
  - lỗi từ `PeriodSettingService` nếu `periodSettingId` không tồn tại
  - lỗi từ `TimetableTemplateService` nếu `timetableTemplateId` không tồn tại
  - `Khong tim thay study week phu hop voi enrollDate ...`

#### Ghi chú liên quan module khác

- Có liên quan `Student`:
  - set `student_first_enroll_date` lần đầu
  - cập nhật `Student.debt`
- Có liên quan `StudyWeek`:
  - tự suy ra `period_start_week`
- Có liên quan `PeriodSetting`:
  - period có thể sinh từ template
- Có liên quan `TimetableTemplate`:
  - period giữ template lịch tuần để học sinh xem option lịch học

---

### 5.4 PUT `/api/v1/periods/{id}`

#### Mục đích
Cập nhật một `Period`.

#### Input format

Path variable:
- `id`: `UUID` của period

Request body:

```json
{
  "periodSettingId": "019dc222-d60d-7607-b06c-baea94cdf4c9",
  "timetableTemplateId": "019dc333-d60d-7607-b06c-baea94cdf4c9",
  "gradeId": 3,
  "weekLeft": 10,
  "numberOfWeek": 12,
  "schoolYear": 2026,
  "tuition": 3600000,
  "tuitionStatus": "PARTIAL",
  "enrollDate": "2026-05-16",
  "debt": 1800000,
  "note": "Cap nhat hoc phi",
  "periodStartWeek": 20,
  "useStudyWeekStartDate": false
}
```

#### Validate input

- `weekLeft`: nếu có thì phải `>= 1`
- `numberOfWeek`: nếu có thì phải `>= 1`
- các field còn lại là optional

#### Validate nghiệp vụ khi update

- nếu request đổi `periodSettingId`, backend sẽ lấy dữ liệu mới từ setting đó làm nguồn mặc định
- nếu request đổi `gradeId`, `numberOfWeek`, `schoolYear`, `tuition`, các giá trị này sẽ override template
- `estimate_expire_date` luôn được tính lại sau update
- `period_start_week` luôn được resolve lại:
  - dùng request nếu có truyền
  - nếu không thì tự dò theo `StudyWeek`
- `Student.debt` được cộng lại sau khi update period

#### Output format

Response là một `ResPeriodDTO`.

#### Mô tả luồng

Cập nhật period -> tìm period hiện tại theo id -> resolve lại toàn bộ giá trị sau update từ request, từ period cũ và từ `PeriodSetting` mới nếu có -> tính lại `estimate_expire_date` -> tính lại `period_start_week` -> tính lại `debt` -> xác định lại `is_editted_from_setting` -> lưu `Period` -> cộng lại toàn bộ `debt` của học sinh -> trả kết quả

#### Exception có thể trả về

- `400 Bad Request`
  - `weekLeft phai lon hon 0`
  - `numberOfWeek phai lon hon 0`
- `400/404` tùy global exception handler hiện tại
  - `Period with id ... does not exist`
  - `Grade with id ... does not exist`
  - lỗi từ `PeriodSettingService` nếu `periodSettingId` không tồn tại
  - lỗi từ `TimetableTemplateService` nếu `timetableTemplateId` không tồn tại
  - `Khong tim thay study week phu hop voi enrollDate ...`

#### Ghi chú cho frontend

- Đây là update kiểu partial update
- Field không truyền lên sẽ được suy từ:
  - period hiện tại
  - hoặc `PeriodSetting` mới nếu request có đổi template

---

### 5.5 DELETE `/api/v1/periods/{id}`

#### Mục đích
Xóa một `Period`.

#### Input format

Path variable:
- `id`: `UUID` của period

#### Output format

HTTP status:
- `204 No Content`

Body:
- không có body

#### Mô tả luồng

Nhận `periodUuid` -> tìm period hiện tại -> lưu lại `studentId` -> xóa period khỏi DB -> cộng lại `Student.debt` từ các period còn lại -> trả `204 No Content`

#### Exception có thể trả về

- `400/404` tùy global exception handler hiện tại
  - `Period with id ... does not exist`

## 6. Giải thích ngắn về `is_editted_from_setting`

Field `is_editted_from_setting` do backend tự tính.

Nếu `Period` có `PeriodSetting`, backend sẽ so sánh các field lõi:
- `grade`
- `numberOfWeek`
- `schoolYear`
- `tuition`

Nếu khác template ở một trong các field trên:
- `is_editted_from_setting = true`

Nếu không khác:
- `is_editted_from_setting = false`

## 7. Giải thích ngắn về cách tính `estimate_expire_date`

### Trường hợp `useStudyWeekStartDate = true`

- backend lấy `Chủ nhật` của tuần chứa `enrollDate`
- từ đó cộng `numberOfWeek`
- rồi trừ `1 ngày`

Ví dụ:
- `enrollDate = 2026-05-20` là Thứ tư
- `numberOfWeek = 12`
- ngày hiệu lực tính từ Chủ nhật tuần đó
- `estimate_expire_date` sẽ rơi vào Thứ bảy của tuần cuối

### Trường hợp `useStudyWeekStartDate = false`

- backend lấy chính `enrollDate`
- cộng `numberOfWeek`
- rồi trừ `1 ngày`

## 8. Luồng frontend đề xuất

### 8.1 Tạo period từ template

1. Chọn học sinh
2. Chọn `PeriodSetting`
3. Chọn `TimetableTemplate` nếu cần cho học sinh xem lịch
4. Nhập:
   - `tuitionStatus`
   - `enrollDate`
   - `debt` nếu muốn override
   - `note`
   - `periodStartWeek` nếu muốn chỉ định tay
   - `useStudyWeekStartDate`
5. Gọi `POST /api/v1/periods`

### 8.2 Tạo period nhập tay

1. Chọn học sinh
2. Không gửi `periodSettingId`
3. Bắt buộc nhập:
   - `gradeId`
   - `numberOfWeek`
   - `schoolYear`
   - `tuition`
4. Nhập các field còn lại
5. Gọi `POST /api/v1/periods`

### 8.3 Màn hình chi tiết period

1. Gọi `GET /api/v1/periods/{id}`
2. Dùng các object lồng:
   - `period_setting`
   - `timetable_template`
   để hiển thị nguồn template nếu có

## 9. Danh sách endpoint tóm tắt

| Method | Path | Mục đích |
|------|------|------|
| GET | `/api/v1/periods` | Lấy danh sách period |
| GET | `/api/v1/periods/{id}` | Lấy chi tiết period |
| POST | `/api/v1/periods` | Tạo period |
| PUT | `/api/v1/periods/{id}` | Cập nhật period |
| DELETE | `/api/v1/periods/{id}` | Xóa period |
