# Ghi chú domain - EmployeeRATemplate-LessonEmployeeAssignment

## 1. Mục đích của ghi chú này

Ghi chú này dùng để giải thích rõ 3 khái niệm dễ bị nhầm:
- `EmployeeRATemplate`
- `LessonEmployeeAssignment`
- `RecordAttendance`

Ba khái niệm này liên quan tới cùng một bài toán nhân sự, nhưng không mang cùng ý nghĩa nghiệp vụ.

---

## 2. EmployeeRATemplate là gì

`EmployeeRATemplate` là **template phân công nhân sự mẫu** đi kèm với `TimetableTemplate`.

Nó trả lời câu hỏi:
- với slot học này trong tuần
- nhân sự nào thường được phân công phụ trách

Ví dụ:
- `Đại số 12` vào `SUNDAY 07:15` -> `TA Nguyen Van A`
- `Hình học` vào `THURSDAY 15:00` -> `TA Tran Thi B`

Điểm quan trọng:
- nó là dữ liệu **mẫu**
- chưa phải dữ liệu lesson thực tế
- chưa phải dữ liệu điểm danh / chấm công

---

## 3. LessonEmployeeAssignment là gì

`LessonEmployeeAssignment` là **dữ liệu phân công thực tế** của một `Lesson` cụ thể.

Nó được sinh ra từ `EmployeeRATemplate` khi backend tạo `Lesson`.

Nó trả lời câu hỏi:
- lesson thực tế của tuần này
- đang được phân công cho những ai

Ví dụ:
- tuần 21 sinh ra lesson `Đại số 12 - CN 07:15`
- backend tạo:
  - `LessonEmployeeAssignment(lesson_uuid=..., user_uuid=TA A)`

Điểm quan trọng:
- nó gắn với `Lesson`
- nó là dữ liệu thực tế theo tuần
- nhưng vẫn **chưa phải chấm công**

---

## 4. RecordAttendance là gì

`RecordAttendance` là dữ liệu **điểm danh / chấm công thực tế** của user không phải student.

Nó trả lời câu hỏi:
- nhân sự đó có tham gia lesson hay không
- thời gian được tính là bao nhiêu
- có overtime hay không

Nói cách khác:
- `LessonEmployeeAssignment` = được phân công
- `RecordAttendance` = đã tham gia thật và được ghi nhận

---

## 5. Quan hệ giữa 3 lớp dữ liệu

Luồng đúng của hệ thống là:

1. `TimetableTemplate`
2. `EmployeeRATemplate`
3. `StudyWeek`
4. `Lesson`
5. `LessonEmployeeAssignment`
6. `RecordAttendance`

Giải thích:

1. `TimetableTemplate` định nghĩa slot học trong tuần
2. `EmployeeRATemplate` định nghĩa nhân sự mẫu cho từng slot
3. Khi tạo `StudyWeek`, backend sinh `Lesson`
4. Từ `Lesson`, backend dò `EmployeeRATemplate`
5. Backend sinh `LessonEmployeeAssignment`
6. Khi lesson diễn ra thực tế, mới phát sinh `RecordAttendance`

---

## 6. Rule khớp slot

Một item của `EmployeeRATemplate` chỉ hợp lệ khi khớp với một slot đã tồn tại trong `TimetableTemplate`.

Backend đối chiếu theo bộ:
- `lessonType`
- `dayOfWeek`
- `startTime`

Điều này giúp đảm bảo:
- template nhân sự không tự tạo ra slot ngoài lịch học mẫu
- dữ liệu phân công luôn bám đúng khung giờ của timetable

---

## 7. Rule về user

`EmployeeRATemplate` không áp dụng cho `STUDENT`.

User được gán vào template nhân sự phải là user không phải student, ví dụ:
- `TA`
- `TEACHER`
- `COLAB_TEACHER`
- hoặc role vận hành khác nếu backend cho phép

Nếu user là `STUDENT`, backend sẽ từ chối.

---

## 8. Vì sao không sinh RecordAttendance luôn khi tạo StudyWeek

Vì đó sẽ làm sai nghĩa dữ liệu.

Nếu sinh `RecordAttendance` ngay lúc tạo tuần, hệ thống sẽ hiểu như:
- nhân sự đã được chấm công
- dù buổi học còn chưa diễn ra

Nghiệp vụ đúng là:
- tạo tuần -> sinh lesson -> sinh assignment
- đến lúc dạy thật -> mới ghi `RecordAttendance`

---

## 9. Ảnh hưởng khi sửa TimetableTemplate

`EmployeeRATemplate` gắn chặt với `TimetableTemplate`, nhưng `Lesson` và `LessonEmployeeAssignment` là snapshot thực tế theo tuần.

Nghĩa là:
- sửa template hôm nay
- không làm thay đổi ngược lesson cũ đã được sinh trước đó

Tư duy này giống hoàn toàn với quan hệ:
- `TimetableTemplate` -> `Lesson`

và mở rộng thêm cho:
- `EmployeeRATemplate` -> `LessonEmployeeAssignment`

---

## 10. Ảnh hưởng khi update StudyWeek

Khi `StudyWeek` update và backend sync lesson:

- lesson mới sinh thêm:
  - sẽ được sinh thêm `LessonEmployeeAssignment`
- lesson bị xóa:
  - assignment của lesson đó cũng bị xóa theo
- lesson đã bị khóa bởi dữ liệu vận hành:
  - lesson không bị đụng
  - assignment cũ của nó cũng giữ nguyên

---

## 11. Gợi ý cho frontend

Khi làm UI cho module này:
- nên hiển thị slot từ `TimetableTemplate` trước
- sau đó cho phép chọn user cho từng slot
- không nên để frontend nhập tự do `dayOfWeek/startTime` ngoài slot có sẵn

Khi hiển thị lesson:
- có thể dùng `employee_assignments` trong response của `Lesson`
- nếu sau này cần đối chiếu thực tế, so sánh tiếp với `RecordAttendance`

---

## 12. Tóm tắt ngắn

- `EmployeeRATemplate` = template phân công nhân sự theo slot
- `LessonEmployeeAssignment` = phân công thực tế cho lesson đã được sinh
- `RecordAttendance` = điểm danh / chấm công thực tế

Ba lớp này không thay thế nhau, mà đi theo đúng thứ tự nghiệp vụ:

`Template -> Assignment -> Attendance`
