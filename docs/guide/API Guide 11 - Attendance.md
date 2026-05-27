# API Guide 11 - Attendance

## 1. Mục đích module

`Attendance` dùng để điểm danh học sinh theo từng `Lesson`.

Theo nghiệp vụ hiện tại:
- mỗi học sinh chỉ được điểm danh 1 lần cho cùng 1 lesson
- trong mỗi tuần, học sinh cần đi **ít nhất 1 buổi** cho mỗi `LessonType` bắt buộc
- hệ thống không cấm học sinh đi nhiều lesson cùng một `LessonType` trong cùng tuần

## 2. Ghi chú nghiệp vụ quan trọng

- `Attendance` chỉ áp dụng cho `Student`
- khi tạo hoặc cập nhật attendance, backend kiểm tra:
  - học sinh tồn tại
  - lesson tồn tại
  - học sinh chưa bị điểm danh trùng cho lesson đó
  - học sinh có `Period` hợp lệ cho lesson đó
- `Period` hợp lệ ở đây có nghĩa:
  - cùng `schoolYear`
  - cùng `grade` với lesson
  - lesson nằm trong khoảng tuần active của period
  - `LessonType` của lesson được phép theo `Period`

Rule xác định `LessonType` được phép:
- ưu tiên lấy từ `PeriodSetting.lessonTypeConfigs`
- nếu không có thì fallback sang `TimetableTemplate.items`

## 3. Base path

`/api/v1/attendances`

## 4. Cấu trúc dữ liệu chính

### 4.1 `ResAttendanceDTO`

```json
{
  "attendance_uuid": "uuid",
  "attendance_time": "2026-05-16T18:00:00",
  "student": {
    "user_uuid": "uuid",
    "student_id": "10013",
    "user_fullname": "Nguyen Van A"
  },
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
  "previous_same_week_lesson_type_attendance": {
    "attendance_uuid": "uuid",
    "lesson_uuid": "uuid",
    "attendance_time": "2026-05-15T18:00:00",
    "lesson_date": "2026-05-14",
    "lesson_start_time": "17:45:00"
  }
}
```

### 4.2 `ResAttendanceWeeklySummaryDTO`

```json
{
  "user_uuid": "uuid",
  "student_id": "10013",
  "user_fullname": "Nguyen Van A",
  "week_uuid": "uuid",
  "week_number": 20,
  "school_year": 2026,
  "week_start_date": "2026-05-17",
  "week_end_date": "2026-05-23",
  "total_required_lesson_types": 2,
  "attended_lesson_types": 1,
  "absent_lesson_types": 1,
  "lesson_type_summaries": [
    {
      "lesson_type_uuid": "uuid",
      "lesson_type_name": "Đại số 12",
      "required_minimum": 1,
      "attendance_count": 2,
      "attended": true,
      "attendance_records": []
    }
  ]
}
```

### 4.3 `ResBulkAttendanceDTO`

```json
{
  "lesson_uuid": "uuid",
  "school_year": 2026,
  "week_number": 20,
  "requested_student_ids": ["10013", "10014", "10015"],
  "success_count": 2,
  "failure_count": 1,
  "successes": [],
  "failures": [
    {
      "student_id": "10015",
      "message": "Hoc sinh da duoc diem danh cho lesson nay"
    }
  ]
}
```

### 4.4 `ResLessonAttendanceCandidateDTO`

```json
{
  "user_uuid": "uuid",
  "student_id": "10013",
  "user_fullname": "Nguyen Van A",
  "week_left": 5,
  "previous_same_week_lesson_type_attendance": {
    "attendance_uuid": "uuid",
    "lesson_uuid": "uuid",
    "attendance_time": "2026-05-15T18:00:00",
    "lesson_date": "2026-05-14",
    "lesson_start_time": "17:45:00"
  }
}
```

## 5. Danh sách API

### 5.1 GET `/api/v1/attendances`

Mục đích:
- lấy toàn bộ danh sách `Attendance`

Output format:
- mảng `ResAttendanceDTO`

Luồng ngắn:
- truy vấn toàn bộ attendance -> map DTO -> với mỗi record, tìm thêm attendance gần nhất trước đó trong cùng `{studyWeek, lessonType}` nếu có -> trả kết quả

### 5.2 GET `/api/v1/attendances/{id}`

Mục đích:
- lấy chi tiết một `Attendance`

Input format:
- path variable `id`

Output format:
- `ResAttendanceDTO`

Exception có thể trả về:
- `Attendance with id ... does not exist`

### 5.3 POST `/api/v1/attendances`

Mục đích:
- tạo attendance cho 1 học sinh

Input format:

```json
{
  "userUuid": "uuid",
  "lessonUuid": "uuid",
  "attendanceTime": "2026-05-16T18:00:00"
}
```

Ghi chú:
- `attendanceTime` là optional
- nếu không truyền, backend dùng `LocalDateTime.now()`

Output format:
- `ResAttendanceDTO`

Luồng ngắn:
- validate body -> resolve student -> resolve lesson -> kiểm tra trùng `student + lesson` -> kiểm tra `Period` hợp lệ -> lưu attendance -> trả kết quả kèm `previous_same_week_lesson_type_attendance` nếu có

Exception có thể trả về:
- `userUuid khong duoc de trong`
- `lessonUuid khong duoc de trong`
- `Hoc sinh da duoc diem danh cho lesson nay`
- `Hoc sinh khong co period hop le cho lesson nay trong study week tuong ung`
- `Student with user_uuid ... does not exist`
- `Lesson with id ... does not exist`

### 5.4 POST `/api/v1/attendances/bulk`

Mục đích:
- tạo attendance cho nhiều học sinh cùng lúc

Input format:

```json
{
  "lessonUuid": "uuid",
  "studentIds": "10013,10014\n10015;10016",
  "attendanceTime": "2026-05-16T18:00:00"
}
```

Ghi chú:
- `studentIds` là chuỗi
- backend tách theo:
  - dấu phẩy
  - dấu chấm phẩy
  - khoảng trắng
  - xuống dòng

Output format:
- `ResBulkAttendanceDTO`

Luồng ngắn:
- validate body -> resolve lesson -> parse chuỗi `studentIds` -> tìm học sinh theo `studentId + schoolYear` của lesson -> với từng student:
  - kiểm tra tồn tại
  - kiểm tra trùng attendance
  - kiểm tra period hợp lệ
  - nếu hợp lệ thì tạo attendance
  - nếu lỗi thì ghi vào danh sách `failures`
- trả kết quả theo kiểu partial success

Exception có thể trả về ở mức request:
- `lessonUuid khong duoc de trong`
- `studentIds khong duoc de trong`
- `Lesson with id ... does not exist`

Ghi chú frontend:
- đây là API phù hợp cho màn quét nhanh danh sách SID
- một học sinh lỗi không chặn cả request

### 5.5 PUT `/api/v1/attendances/{id}`

Mục đích:
- cập nhật một `Attendance`

Input format:
- path variable `id`
- body partial update

Output format:
- `ResAttendanceDTO`

Luồng ngắn:
- tìm attendance hiện tại -> resolve student/lesson mới nếu có -> kiểm tra trùng -> kiểm tra period hợp lệ -> lưu lại -> trả DTO

Exception có thể trả về:
- `Attendance with id ... does not exist`
- `Hoc sinh da duoc diem danh cho lesson nay`
- `Hoc sinh khong co period hop le cho lesson nay trong study week tuong ung`
- `Student with user_uuid ... does not exist`
- `Lesson with id ... does not exist`

### 5.6 DELETE `/api/v1/attendances/{id}`

Mục đích:
- xóa một `Attendance`

Input format:
- path variable `id`

Output format:
- `204 No Content`

Exception có thể trả về:
- `Attendance with id ... does not exist`

### 5.7 GET `/api/v1/attendances/lesson/{lessonUuid}/attendance-candidates`

Mục đích:
- lấy nhanh danh sách học sinh đủ điều kiện để điểm danh cho một lesson

Input format:
- path variable `lessonUuid`

Output format:
- mảng `ResLessonAttendanceCandidateDTO`

Luồng ngắn:
- resolve lesson -> lấy các học sinh thuộc `grade` của lesson -> kiểm tra học sinh có `Period` hợp lệ cho:
  - `lessonType`
  - `weekNumber`
  - `schoolYear`
- chỉ giữ các học sinh có `weekLeft > 0`
- trả:
  - họ tên
  - SID
  - `weekLeft`
  - `previous_same_week_lesson_type_attendance` nếu có

Exception có thể trả về:
- `Lesson with id ... does not exist`

Ghi chú frontend:
- API này dành cho màn hình điểm danh nhanh
- `previousAttendance` giúp cảnh báo học sinh đã được điểm danh ở lesson khác cùng `{lessonType, weekNumber, schoolYear}`

### 5.8 GET `/api/v1/attendances/student/{userUuid}/weekly-summary`

Mục đích:
- thống kê theo tuần cho 1 học sinh, theo kiểu path variable cũ

Input format:
- path variable `userUuid`
- query params:
  - `schoolYear`
  - `weekNumber` optional

Output format:
- mảng `ResAttendanceWeeklySummaryDTO`

Ghi chú:
- endpoint cũ
- nên ưu tiên endpoint mới ở mục `5.9`

### 5.9 GET `/api/v1/attendances/weekly-summary/student?studentUuid=...&schoolYear=...`

Mục đích:
- thống kê theo tuần cho 1 học sinh, theo kiểu request param

Input format:
- query params:
  - `studentUuid`
  - `schoolYear`
  - `weekNumber` optional

Output format:
- mảng `ResAttendanceWeeklySummaryDTO`

Luồng ngắn:
- tìm học sinh -> lấy attendance trong `schoolYear` -> xác định các `StudyWeek` cần thống kê -> build summary theo từng tuần

### 5.10 GET `/api/v1/attendances/student/{userUuid}/weekly-summary/range`

Mục đích:
- thống kê theo khoảng tuần, kiểu path variable cũ

Input format:
- path variable `userUuid`
- query params:
  - `schoolYear`
  - `fromWeekNumber`
  - `toWeekNumber`

Output format:
- mảng `ResAttendanceWeeklySummaryDTO`

### 5.11 GET `/api/v1/attendances/weekly-summary/student/range?studentUuid=...&schoolYear=...&fromWeekNumber=...&toWeekNumber=...`

Mục đích:
- thống kê theo khoảng tuần, kiểu request param

Input format:
- query params:
  - `studentUuid`
  - `schoolYear`
  - `fromWeekNumber`
  - `toWeekNumber`

Output format:
- mảng `ResAttendanceWeeklySummaryDTO`

Exception có thể trả về cho 5.10 và 5.11:
- `fromWeekNumber khong duoc lon hon toWeekNumber`
- `Student with user_uuid ... does not exist`

### 5.12 GET `/api/v1/attendances/weekly-summary`

Mục đích:
- thống kê tuần cho toàn bộ học sinh

Input format:
- query params:
  - `schoolYear`
  - `weekNumber`
  - `gradeId` optional

Output format:
- mảng `ResAttendanceWeeklySummaryDTO`

Luồng ngắn:
- tìm `StudyWeek` theo `{weekNumber, schoolYear}` -> lấy attendance của cả năm học -> nếu có `gradeId` thì lọc học sinh theo grade -> build summary cho từng học sinh

Exception có thể trả về:
- `Study week with weekNumber ... and schoolYear ... does not exist`

### 5.13 GET `/api/v1/attendances/weekly-summary/absent`

Mục đích:
- chỉ lấy các học sinh đang thiếu ít nhất 1 `LessonType` trong tuần

Input format:
- query params:
  - `schoolYear`
  - `weekNumber`
  - `gradeId` optional

Output format:
- mảng `ResAttendanceWeeklySummaryDTO`

Luồng ngắn:
- build weekly summary cho toàn bộ học sinh -> lọc lại `absentLessonTypes > 0` -> trả kết quả

### 5.14 GET `/api/v1/attendances/weekly-summary/absent/export`

Mục đích:
- xuất danh sách học sinh vắng trong tuần ra file Excel

Input format:
- query params:
  - `schoolYear`
  - `weekNumber`
  - `gradeId` optional

Output format:
- file `.xlsx`

Luồng ngắn:
- tìm `StudyWeek`
- lấy danh sách absent từ endpoint summary vắng
- tạo workbook Excel
- đầu file có:
  - năm học
  - tuần
  - ngày bắt đầu
  - ngày kết thúc
  - ngày xuất báo cáo
  - `gradeId` nếu có
- từ dòng 8:
  - cột A: `Họ và tên`
  - cột B: `Student ID`
  - các cột tiếp theo là từng `LessonType`
  - giá trị mỗi ô là `Đã học` hoặc `Vắng`
  - cuối dòng có:
    - `Tổng loại ca bắt buộc`
    - `Số loại ca đã học`
    - `Số loại ca vắng`

Exception có thể trả về:
- `Study week with weekNumber ... and schoolYear ... does not exist`
- `Khong the xuat file Excel bao cao hoc sinh vang theo tuan`

### 5.15 GET `/api/v1/attendances/weekly-lesson-summary`

Mục đích:
- thống kê lesson trong tuần, nhóm theo `LessonType`

Input format:
- query params:
  - `schoolYear`
  - `weekNumber`
  - `gradeId` optional

Output format:
- `ResAttendanceWeeklyLessonGroupedDTO`

Luồng ngắn:
- tìm `StudyWeek` -> lấy các lesson trong tuần -> nếu có `gradeId` thì lọc theo grade -> nhóm theo `LessonType` -> đếm số attendance của từng lesson -> trả kết quả

Exception có thể trả về:
- `Study week with weekNumber ... and schoolYear ... does not exist`

## 6. Giải thích rule attendance

Đây là chỗ frontend rất dễ hiểu sai.

### 6.1 Không phải đi đủ mọi lesson

Ví dụ một tuần có:
- 4 lesson `Đại số 12`
- 4 lesson `Hình học`

Học sinh không bắt buộc phải đi đủ 8 lesson.

### 6.2 Rule đúng hiện tại

Học sinh cần đi:
- ít nhất 1 lesson của `Đại số 12`
- ít nhất 1 lesson của `Hình học`

Tức là attendance được tính theo:
- `LessonType`
- trên phạm vi từng tuần

### 6.3 Đi nhiều hơn vẫn hợp lệ

Nếu học sinh đi:
- 2 buổi `Đại số 12`
- 1 buổi `Hình học`

thì vẫn hợp lệ.

`attendanceCount` trong summary cho biết số lần attendance thực tế của `LessonType` đó trong tuần.

## 7. Gợi ý frontend

### 7.1 Điểm danh 1 học sinh
1. chọn học sinh
2. chọn lesson
3. gọi `POST /api/v1/attendances`
4. dùng `previous_same_week_lesson_type_attendance` để cảnh báo nếu học sinh đã có attendance trước đó trong cùng `{studyWeek, lessonType}`

### 7.2 Điểm danh hàng loạt
1. gọi `GET /api/v1/attendances/lesson/{lessonUuid}/attendance-candidates`
2. hiển thị danh sách học sinh còn period hợp lệ
3. nhập hoặc quét chuỗi SID
4. gọi `POST /api/v1/attendances/bulk`
5. hiển thị `successes` và `failures`

### 7.3 Báo cáo attendance
1. dùng `/weekly-summary/student` cho hồ sơ từng học sinh
2. dùng `/weekly-summary` cho dashboard cả tuần
3. dùng `/weekly-summary/absent` cho danh sách học sinh vắng
4. dùng `/weekly-summary/absent/export` để xuất Excel
5. dùng `/weekly-lesson-summary` cho dashboard theo lesson

## 8. Tóm tắt endpoint

| Method | Path | Mục đích |
|---|---|---|
| GET | `/api/v1/attendances` | Lấy danh sách attendance |
| GET | `/api/v1/attendances/{id}` | Lấy chi tiết attendance |
| POST | `/api/v1/attendances` | Tạo attendance cho 1 học sinh |
| POST | `/api/v1/attendances/bulk` | Tạo attendance cho nhiều học sinh |
| PUT | `/api/v1/attendances/{id}` | Cập nhật attendance |
| DELETE | `/api/v1/attendances/{id}` | Xóa attendance |
| GET | `/api/v1/attendances/lesson/{lessonUuid}/attendance-candidates` | Lấy danh sách học sinh đủ điều kiện để điểm danh nhanh |
| GET | `/api/v1/attendances/student/{userUuid}/weekly-summary` | Summary tuần theo path variable cũ |
| GET | `/api/v1/attendances/weekly-summary/student` | Summary tuần của 1 học sinh |
| GET | `/api/v1/attendances/student/{userUuid}/weekly-summary/range` | Summary range theo path variable cũ |
| GET | `/api/v1/attendances/weekly-summary/student/range` | Summary range của 1 học sinh |
| GET | `/api/v1/attendances/weekly-summary` | Summary tuần cho toàn bộ học sinh |
| GET | `/api/v1/attendances/weekly-summary/absent` | Chỉ lấy học sinh vắng trong tuần |
| GET | `/api/v1/attendances/weekly-summary/absent/export` | Xuất Excel danh sách học sinh vắng |
| GET | `/api/v1/attendances/weekly-lesson-summary` | Summary lesson trong tuần theo lesson type |
