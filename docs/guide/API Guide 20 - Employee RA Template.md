# API Guide 20 - Employee RA Template

## 1. Mục đích

`Employee RA Template` dùng để cấu hình **phân công nhân sự mẫu** cho từng slot trong `TimetableTemplate`.

Nó **không phải** dữ liệu chấm công thực tế.

Phân biệt:
- `EmployeeRATemplate`: template phân công
- `LessonEmployeeAssignment`: phân công thực tế được sinh ra khi tạo `StudyWeek`
- `RecordAttendance`: điểm danh / chấm công thực tế sau khi buổi học diễn ra

---

## 2. Quan hệ nghiệp vụ

- Mỗi `Employee RA Template` gắn với đúng `1 TimetableTemplate`
- Mỗi `TimetableTemplate` hiện chỉ có tối đa `1 Employee RA Template`
- Mỗi item của template nhân sự mô tả:
  - `lessonType`
  - `dayOfWeek`
  - `startTime`
  - `userUuid`
  - `sortOrder`

Rule quan trọng:
- Item của `Employee RA Template` phải khớp với một slot đã tồn tại trong `TimetableTemplate`
- `userUuid` phải là user **không phải `STUDENT`**
- Khi tạo `StudyWeek`, backend sẽ:
  1. sinh `Lesson` từ `TimetableTemplate`
  2. dò `Employee RA Template`
  3. sinh `LessonEmployeeAssignment` cho từng lesson tương ứng

---

## 3. API danh sách

### GET `/api/v1/employee-ra-templates`

#### Mục đích
Lấy toàn bộ `Employee RA Template`

#### Input format
Không có request body, không có query param

#### Output format

```json
[
  {
    "employee_ra_template_uuid": "uuid",
    "employee_ra_template_name": "K12 2026 TA Template",
    "timetable_template_uuid": "uuid",
    "timetable_template_name": "K12-2026-DEFAULT",
    "items": [
      {
        "employee_ra_template_item_uuid": "uuid",
        "lesson_type_uuid": "uuid",
        "lesson_type_name": "Đại số 12",
        "user_uuid": "uuid",
        "full_name": "Nguyen Van A",
        "email": "a@example.com",
        "role_name": "TA",
        "day_of_week": "SUNDAY",
        "start_time": "07:15:00",
        "sort_order": 1
      }
    ],
    "created_at": "2026-05-25T10:00:00Z",
    "updated_at": null,
    "created_by": "manager@ms.local",
    "updated_by": null
  }
]
```

#### Mô tả luồng
Nhận request -> lấy toàn bộ `EmployeeRATemplate` từ DB -> map item và thông tin user / lesson type / timetable template -> trả response

#### Exception có thể trả về
Thông thường không có exception nghiệp vụ riêng

---

## 4. API chi tiết theo id

### GET `/api/v1/employee-ra-templates/{id}`

#### Mục đích
Lấy chi tiết một `Employee RA Template`

#### Input format

Path variable:
- `id`: UUID của `Employee RA Template`

#### Output format
Giống cấu trúc phần danh sách nhưng chỉ trả 1 object

#### Mô tả luồng
Nhận request -> tìm `EmployeeRATemplate` theo `id` -> nếu tồn tại thì map DTO và trả kết quả

#### Exception có thể trả về
- `Employee RA template with id ... does not exist`

---

## 5. API chi tiết theo Timetable Template

### GET `/api/v1/employee-ra-templates/timetable-template/{timetableTemplateId}`

#### Mục đích
Lấy `Employee RA Template` đang gắn với một `TimetableTemplate`

#### Input format

Path variable:
- `timetableTemplateId`: UUID của `TimetableTemplate`

#### Output format
Giống cấu trúc response chi tiết

#### Mô tả luồng
Nhận request -> tìm `EmployeeRATemplate` theo `timetableTemplateId` -> nếu tồn tại thì trả kết quả

#### Exception có thể trả về
- `Employee RA template with timetableTemplateId ... does not exist`

---

## 6. API tạo mới

### POST `/api/v1/employee-ra-templates`

#### Mục đích
Tạo mới template phân công nhân sự cho một `TimetableTemplate`

#### Input format

```json
{
  "name": "K12 2026 TA Template",
  "timetableTemplateId": "uuid",
  "items": [
    {
      "lessonTypeId": "uuid-dai-so-12",
      "userUuid": "uuid-ta-1",
      "dayOfWeek": "SUNDAY",
      "startTime": "07:15:00",
      "sortOrder": 1
    },
    {
      "lessonTypeId": "uuid-hinh-hoc",
      "userUuid": "uuid-ta-2",
      "dayOfWeek": "THURSDAY",
      "startTime": "15:00:00",
      "sortOrder": 2
    }
  ]
}
```

#### Field bắt buộc
- `name`
- `timetableTemplateId`

Item:
- `lessonTypeId`
- `userUuid`
- `dayOfWeek`
- `startTime`
- `sortOrder`

#### Output format

```json
{
  "employee_ra_template_uuid": "uuid",
  "employee_ra_template_name": "K12 2026 TA Template",
  "timetable_template_uuid": "uuid",
  "timetable_template_name": "K12-2026-DEFAULT",
  "items": [
    {
      "employee_ra_template_item_uuid": "uuid",
      "lesson_type_uuid": "uuid-dai-so-12",
      "lesson_type_name": "Đại số 12",
      "user_uuid": "uuid-ta-1",
      "full_name": "Nguyen Van A",
      "email": "a@example.com",
      "role_name": "TA",
      "day_of_week": "SUNDAY",
      "start_time": "07:15:00",
      "sort_order": 1
    }
  ],
  "created_at": "2026-05-25T10:00:00Z",
  "updated_at": null,
  "created_by": "manager@ms.local",
  "updated_by": null
}
```

#### Mô tả luồng
Tạo employee RA template -> validate `timetableTemplateId` tồn tại -> kiểm tra timetable template đó chưa có employee RA template khác -> validate từng item:
- `lessonTypeId` tồn tại
- `userUuid` tồn tại và không phải `STUDENT`
- `{lessonTypeId, dayOfWeek, startTime}` phải khớp với một slot trong `TimetableTemplate`

Sau đó:
- lưu `EmployeeRATemplate`
- lưu danh sách item
- trả kết quả

#### Exception có thể trả về
- `Timetable template with id ... does not exist`
- `Timetable template nay da co employee RA template`
- `Lesson type with id ... does not exist`
- `User with user_uuid ... does not exist`
- `User chua co role, khong the dua vao employee RA template`
- `Employee RA template khong ap dung cho student`
- `Employee RA template item phai khop voi mot slot da ton tai trong timetable template`

---

## 7. API cập nhật

### PUT `/api/v1/employee-ra-templates/{id}`

#### Mục đích
Cập nhật template phân công nhân sự

#### Input format

```json
{
  "name": "K12 2026 TA Template Updated",
  "timetableTemplateId": "uuid",
  "items": [
    {
      "lessonTypeId": "uuid-dai-so-12",
      "userUuid": "uuid-ta-3",
      "dayOfWeek": "MONDAY",
      "startTime": "17:45:00",
      "sortOrder": 1
    }
  ]
}
```

#### Rule update
- request là partial update
- nếu có `items`, backend sẽ:
  - xóa toàn bộ item cũ trong template
  - tạo lại toàn bộ item mới từ request
- không merge từng item riêng lẻ

#### Output format
Giống response chi tiết

#### Mô tả luồng
Cập nhật employee RA template -> tìm template theo `id` -> nếu đổi `timetableTemplateId` thì validate template mới chưa bị gắn với template nhân sự khác -> nếu có `items` thì validate toàn bộ item mới -> thay toàn bộ danh sách cũ -> lưu DB -> trả kết quả

#### Exception có thể trả về
- `Employee RA template with id ... does not exist`
- `Timetable template with id ... does not exist`
- `Timetable template nay da co employee RA template`
- `Lesson type with id ... does not exist`
- `User with user_uuid ... does not exist`
- `User chua co role, khong the dua vao employee RA template`
- `Employee RA template khong ap dung cho student`
- `Employee RA template item phai khop voi mot slot da ton tai trong timetable template`

---

## 8. API xóa

### DELETE `/api/v1/employee-ra-templates/{id}`

#### Mục đích
Xóa một template phân công nhân sự

#### Input format

Path variable:
- `id`: UUID của template

#### Output format
HTTP `204 No Content`

#### Mô tả luồng
Nhận request -> tìm template theo `id` -> xóa template và các item con -> trả `204`

#### Exception có thể trả về
- `Employee RA template with id ... does not exist`

---

## 9. Ảnh hưởng sang module khác

### 9.1 Ảnh hưởng tới Study Week

Khi gọi:
- `POST /api/v1/study-weeks`
- hoặc update `StudyWeek` làm phát sinh lesson mới

backend sẽ:
1. chọn `TimetableTemplate` hiệu lực
2. sinh `Lesson`
3. dò `Employee RA Template` gắn với `TimetableTemplate`
4. tìm các item có cùng:
   - `lessonType`
   - `dayOfWeek`
   - `startTime`
5. sinh `LessonEmployeeAssignment` cho lesson đó

### 9.2 Ảnh hưởng tới Lesson

`GET Lesson` hiện trả thêm:
- `employee_assignments`

Tức là frontend có thể nhìn ngay lesson nào đang được phân công cho ai, mà không cần gọi thêm module `Record Attendance`

### 9.3 Ảnh hưởng tới Record Attendance

`LessonEmployeeAssignment` không phải `RecordAttendance`

Nghĩa là:
- được phân công trước không đồng nghĩa đã chấm công
- `RecordAttendance` vẫn là dữ liệu riêng, dùng khi ghi nhận thực tế nhân sự đã tham gia lesson

---

## 10. Gợi ý frontend

- Khi quản lý template nhân sự, frontend nên đọc `TimetableTemplate` trước, rồi chỉ cho phép người dùng gán nhân sự vào đúng các slot đã tồn tại
- UI nên chặn chọn `STUDENT`
- Khi update `items`, cần gửi toàn bộ danh sách mới vì backend đang dùng cơ chế replace toàn bộ item cũ

