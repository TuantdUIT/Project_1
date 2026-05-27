# API Guide 12 - Record Attendance

## 1. Mục đích module

`RecordAttendance` dùng để ghi nhận **điểm danh / chấm công thực tế** cho user không phải học sinh.

Theo nghiệp vụ hiện tại:
- `Attendance` dùng cho học sinh
- `RecordAttendance` dùng cho:
  - `TEACHER`
  - `TA`
  - `COLAB_TEACHER`
  - và nói chung là mọi user có role khác `STUDENT`

Module này ghi nhận:
- ai tham gia lesson nào
- thời điểm chấm công
- số phút được tính công
- overtime

## 2. Phân biệt với assignment

Phân biệt rõ:
- `LessonEmployeeAssignment` = được phân công trước cho lesson
- `RecordAttendance` = đã tham gia thực tế và được chấm công

Nói ngắn:
- assignment là kế hoạch
- record attendance là dữ liệu phát sinh sau khi lesson diễn ra

## 3. Ghi chú nghiệp vụ quan trọng

- Không áp dụng cho `STUDENT`
- Mỗi cặp `user + lesson` chỉ có tối đa 1 record attendance
- `lessonTime >= 0`
- `overtime` được phép âm
- endpoint export Excel hiện đang làm tròn theo block 15 phút:
  - số dương: làm tròn lên
  - số âm: làm tròn về phía `0`
  - ví dụ:
    - `10 -> 15`
    - `16 -> 30`
    - `-10 -> 0`
    - `-20 -> -15`

## 4. Base path

`/api/v1/record-attendances`

## 5. Cấu trúc dữ liệu chính

### 5.1 `ResRecordAttendanceDTO`

```json
{
  "ra_attd_uuid": "uuid",
  "user": {
    "user_uuid": "uuid",
    "user_fullname": "Tran Van B",
    "user_email": "ta1@example.com",
    "role_name": "TA"
  },
  "ra_attd_time": "2026-05-16T17:40:00",
  "lesson": {
    "lesson_uuid": "uuid",
    "week_uuid": "uuid",
    "week_number": 20,
    "school_year": 2026,
    "lesson_type_uuid": "uuid",
    "lesson_type_name": "Đại số 12",
    "lesson_date": "2026-05-17",
    "lesson_start_time": "07:15:00"
  },
  "ra_lesson_time": 180,
  "ra_overtime": -15
}
```

### 5.2 `ResRecordAttendanceWeeklySummaryDTO`

```json
{
  "user_uuid": "uuid",
  "user_fullname": "Tran Van B",
  "user_email": "ta1@example.com",
  "role_name": "TA",
  "week_uuid": "uuid",
  "week_number": 20,
  "school_year": 2026,
  "lesson_type_summaries": [
    {
      "lesson_type_uuid": "uuid",
      "lesson_type_name": "Đại số 12",
      "record_count": 2,
      "total_lesson_time": 360,
      "total_overtime": -15,
      "records": []
    }
  ],
  "total_records": 3,
  "total_lesson_time": 540,
  "total_overtime": 0
}
```

## 6. Danh sách API

### 6.1 GET `/api/v1/record-attendances`

Mục đích:
- lấy toàn bộ `RecordAttendance`

Output format:
- mảng `ResRecordAttendanceDTO`

Luồng ngắn:
- truy vấn toàn bộ `RECORD_ATTENDANCE` -> map DTO -> trả kết quả

### 6.2 GET `/api/v1/record-attendances/{id}`

Mục đích:
- lấy chi tiết một `RecordAttendance`

Input format:
- path variable `id`

Output format:
- `ResRecordAttendanceDTO`

Exception có thể trả về:
- `Record attendance with id ... does not exist`

### 6.3 POST `/api/v1/record-attendances`

Mục đích:
- tạo mới một `RecordAttendance`

Input format:

```json
{
  "userUuid": "uuid",
  "lessonUuid": "uuid",
  "recordAttendanceTime": "2026-05-16T17:40:00",
  "lessonTime": 180,
  "overtime": -15
}
```

Ghi chú:
- `recordAttendanceTime` là optional
- nếu không truyền, backend tự gán `LocalDateTime.now()`

Output format:
- `ResRecordAttendanceDTO`

Luồng ngắn:
- validate body -> tìm user -> tìm lesson -> kiểm tra user khác `STUDENT` -> kiểm tra chưa có record trùng `user + lesson` -> lưu DB -> trả kết quả

Exception có thể trả về:
- `userUuid khong duoc de trong`
- `lessonUuid khong duoc de trong`
- `lessonTime khong duoc de trong`
- `lessonTime khong duoc nho hon 0`
- `overtime khong duoc de trong`
- `User chua co role, khong the ghi record attendance`
- `Record attendance khong ap dung cho student`
- `Nhan su da co record attendance cho lesson nay`
- `User with user_uuid ... does not exist`
- `Lesson with id ... does not exist`

### 6.4 PUT `/api/v1/record-attendances/{id}`

Mục đích:
- cập nhật một `RecordAttendance`

Input format:
- path variable `id`
- request body partial update

Output format:
- `ResRecordAttendanceDTO`

Luồng ngắn:
- tìm record hiện tại -> resolve user/lesson mới nếu có đổi -> validate user không phải student -> validate không trùng `user + lesson` -> cập nhật dữ liệu -> lưu DB -> trả kết quả

Exception có thể trả về:
- `lessonTime khong duoc nho hon 0`
- `User chua co role, khong the ghi record attendance`
- `Record attendance khong ap dung cho student`
- `Nhan su da co record attendance cho lesson nay`
- `Record attendance with id ... does not exist`
- `User with user_uuid ... does not exist`
- `Lesson with id ... does not exist`

### 6.5 DELETE `/api/v1/record-attendances/{id}`

Mục đích:
- xóa một `RecordAttendance`

Input format:
- path variable `id`

Output format:
- `204 No Content`

Exception có thể trả về:
- `Record attendance with id ... does not exist`

### 6.6 GET `/api/v1/record-attendances/user/{userUuid}/weekly-summary`

Mục đích:
- thống kê theo tuần cho một user không phải student

Input format:
- path variable `userUuid`
- query params:
  - `schoolYear`
  - `weekNumber`

Output format:
- `ResRecordAttendanceWeeklySummaryDTO`

Luồng ngắn:
- tìm user -> kiểm tra user không phải student -> lấy record attendance của user trong `schoolYear` -> lọc theo `weekNumber` -> nhóm theo `LessonType` -> tính:
  - `recordCount`
  - `totalLessonTime`
  - `totalOvertime`
-> trả kết quả

Exception có thể trả về:
- `User chua co role, khong the ghi record attendance`
- `Record attendance khong ap dung cho student`
- `User with user_uuid ... does not exist`

### 6.7 GET `/api/v1/record-attendances/weekly-summary`

Mục đích:
- thống kê theo tuần cho toàn bộ user không phải student

Input format:
- query params:
  - `schoolYear`
  - `weekNumber`

Output format:
- mảng `ResRecordAttendanceWeeklySummaryDTO`

Luồng ngắn:
- lấy toàn bộ record attendance trong `schoolYear` -> lấy danh sách user khác `STUDENT` -> build summary cho từng user theo `weekNumber` -> nhóm theo `LessonType` -> trả kết quả

Ghi chú:
- API này trả cả user không có record trong tuần

### 6.8 GET `/api/v1/record-attendances/weekly-summary/export`

Mục đích:
- xuất báo cáo chấm công theo tuần cho toàn bộ user không phải student ra file Excel

Input format:
- query params:
  - `schoolYear`
  - `weekNumber`

Output format:
- file `.xlsx`

Tên file:
- `record-attendance-weekly-summary-{schoolYear}-week-{weekNumber}.xlsx`

Luồng ngắn:
- tìm `StudyWeek` để lấy `startDate`, `endDate`
- gọi lại logic weekly summary hiện có
- tạo workbook Excel
- đầu file ghi:
  - `A1`: `BÁO CÁO CHẤM CÔNG THEO TUẦN`
  - `A2/B2`: `Năm học`
  - `A3/B3`: `Tuần`
  - `A4/B4`: `Ngày bắt đầu`
  - `A5/B5`: `Ngày kết thúc`
  - `A6/B6`: `Ngày xuất báo cáo`
- từ dòng 8:
  - cột A: `Họ và tên`
  - từ cột B trở đi: tên từng `lessonType`
  - ô giao có format:
    - `tổng giờ làm|tổng giờ OT`
  - sau các cột `lessonType` là:
    - `Tổng giờ làm`
    - `Tổng số ca có chấm công`
    - `Tổng giờ OT`

Rule làm tròn trong file Excel:
- mỗi record được làm tròn riêng theo block 15 phút trước khi cộng
- `lessonTime`:
  - số dương làm tròn lên
- `overtime`:
  - số dương làm tròn lên
  - số âm làm tròn về phía `0`

Exception có thể trả về:
- `Study week with weekNumber ... and schoolYear ... does not exist`
- `Khong the xuat file Excel bao cao cham cong theo tuan`

## 7. Gợi ý frontend

Luồng hợp lý:
1. frontend lấy `employeeAssignments` từ `Lesson`
2. dùng danh sách đó như gợi ý phân công
3. khi buổi học diễn ra thật, tạo `RecordAttendance`
4. khi cần báo cáo tuần, gọi:
   - `/weekly-summary`
   - hoặc `/weekly-summary/export`

Lưu ý:
- assignment chỉ là kế hoạch
- `RecordAttendance` mới là dữ liệu chấm công thực tế

## 8. Tóm tắt endpoint

| Method | Path | Mục đích |
|---|---|---|
| GET | `/api/v1/record-attendances` | Lấy danh sách record attendance |
| GET | `/api/v1/record-attendances/{id}` | Lấy chi tiết record attendance |
| POST | `/api/v1/record-attendances` | Tạo record attendance |
| PUT | `/api/v1/record-attendances/{id}` | Cập nhật record attendance |
| DELETE | `/api/v1/record-attendances/{id}` | Xóa record attendance |
| GET | `/api/v1/record-attendances/user/{userUuid}/weekly-summary` | Thống kê tuần cho một user |
| GET | `/api/v1/record-attendances/weekly-summary` | Thống kê tuần cho toàn bộ non-student user |
| GET | `/api/v1/record-attendances/weekly-summary/export` | Xuất báo cáo tuần ra file Excel |
