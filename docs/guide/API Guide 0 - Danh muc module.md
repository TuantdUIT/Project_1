# API Guide 0 - Danh mục module

## Mục đích

Tài liệu này là mục lục cho bộ frontend API guide mới trong thư mục `.github/guide`.

Nguyên tắc viết:
- Mỗi module có 1 file `.md` riêng.
- Chỉ viết chi tiết module khi có yêu cầu tiếp theo.
- Không gộp toàn bộ module vào cùng 1 file guide chi tiết.

Mỗi file guide module sẽ có các phần sau:
- Danh sách API của module
- Đường dẫn API
- Input format
- Output format
- Các exception có thể trả về
- Mô tả luồng ngắn gọn của từng API
- Ghi chú ngắn về luồng liên quan sang module khác nếu có

## Danh sách module hiện có

### 1. Authentication
- File dự kiến: `API Guide 1 - Authentication.md`
- Controller liên quan:
  - `AuthController`

### 2. User
- File dự kiến: `API Guide 2 - User.md`
- Controller liên quan:
  - `UserController`

### 3. Student
- File dự kiến: `API Guide 3 - Student.md`
- Controller liên quan:
  - `StudentController`

### 4. Grade
- File dự kiến: `API Guide 4 - Grade.md`
- Controller liên quan:
  - `GradeController`

### 5. Lesson Type
- File dự kiến: `API Guide 5 - Lesson Type.md`
- Controller liên quan:
  - `LessonTypeController`

### 6. Study Week
- File dự kiến: `API Guide 6 - Study Week.md`
- Controller liên quan:
  - `StudyWeekController`

### 7. Timetable Template
- File dự kiến: `API Guide 7 - Timetable Template.md`
- Controller liên quan:
  - `TimetableTemplateController`

### 8. Lesson
- File dự kiến: `API Guide 8 - Lesson.md`
- Controller liên quan:
  - `LessonController`

### 9. Period Setting
- File dự kiến: `API Guide 9 - Period Setting.md`
- Controller liên quan:
  - `PeriodSettingController`

### 10. Period
- File dự kiến: `API Guide 10 - Period.md`
- Controller liên quan:
  - `PeriodController`

### 11. Attendance
- File dự kiến: `API Guide 11 - Attendance.md`
- Controller liên quan:
  - `AttendanceController`

### 12. Record Attendance
- File dự kiến: `API Guide 12 - Record Attendance.md`
- Controller liên quan:
  - `RecordAttendanceController`

### 13. Penalty Tag
- File dự kiến: `API Guide 13 - Penalty Tag.md`
- Controller liên quan:
  - `PenaltyTagController`

### 14. Penalty
- File dự kiến: `API Guide 14 - Penalty.md`
- Controller liên quan:
  - `PenaltyController`

### 15. Cost Tag
- File dự kiến: `API Guide 15 - Cost Tag.md`
- Controller liên quan:
  - `CostTagController`

### 16. Cost
- File dự kiến: `API Guide 16 - Cost.md`
- Controller liên quan:
  - `CostController`

### 17. Online Lecture
- File dự kiến: `API Guide 17 - Online Lecture.md`
- Controller liên quan:
  - `OnlineLectureController`

### 18. Learning File
- File dự kiến: `API Guide 18 - Learning File.md`
- Controller liên quan:
  - `LearningFileController`

## Thứ tự nên viết guide chi tiết

Nếu viết theo luồng frontend, thứ tự hợp lý là:
1. Authentication
2. Student
3. Grade
4. Lesson Type
5. Study Week
6. Timetable Template
7. Lesson
8. Period Setting
9. Period
10. Attendance
11. Record Attendance
12. Penalty Tag
13. Penalty
14. Cost Tag
15. Cost
16. Online Lecture
17. Learning File
18. User

## Ghi chú

- Một số API có phụ thuộc sang module khác. Trong guide chi tiết của từng module, phần mô tả luồng sẽ ghi ngắn gọn các bước gọi logic liên quan.
- Ví dụ:
  - `Study Week` có liên quan tới `Lesson`
  - `Period` có liên quan tới `Student`, `Period Setting`, `Timetable Template`
  - `Attendance` có liên quan tới `Lesson`, `Student`, `Period`
  - `Online Lecture` và `Learning File` có liên quan tới `Student`, `Grade`, `Period`
