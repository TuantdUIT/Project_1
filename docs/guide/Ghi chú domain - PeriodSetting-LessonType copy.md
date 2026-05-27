# Ghi chú domain - PeriodSetting-LessonType

## 1. `PeriodSetting-LessonType` là gì

`PeriodSetting-LessonType` là cách gọi ngắn cho entity:
- `PeriodSettingLessonType`

Đây là bảng / entity trung gian nối giữa:
- `PeriodSetting`
- `LessonType`

Trong code và response API, nó thường xuất hiện dưới tên:
- `lessonTypeConfigs`
- `ResPeriodSettingLessonTypeDTO`
- `ReqPeriodSettingLessonTypeItemDTO`

## 2. Nó dùng để làm gì

`PeriodSetting-LessonType` dùng để mô tả:
- một `PeriodSetting` gồm những `LessonType` nào
- với mỗi `LessonType`, mỗi tuần cần bao nhiêu buổi
- thứ tự hiển thị của từng loại nội dung học

Nói ngắn gọn:
- `PeriodSetting` định nghĩa template khóa học
- `PeriodSetting-LessonType` định nghĩa cấu trúc nội dung học bên trong template đó

## 3. Ví dụ nghiệp vụ

Ví dụ có một `PeriodSetting`:
- `K12-2026-12W`

Thì `PeriodSetting-LessonType` có thể là:
- `Đại số 12` -> `lessonsPerWeek = 4`, `sortOrder = 1`
- `Hình học` -> `lessonsPerWeek = 4`, `sortOrder = 2`

Ý nghĩa:
- khóa học này kéo dài 12 tuần
- trong cấu hình tuần của khóa học này có:
  - 4 buổi `Đại số 12`
  - 4 buổi `Hình học`

Điều này **không có nghĩa** là mỗi học sinh bắt buộc phải đi đủ cả 4 buổi của từng `LessonType` trong tuần.

Theo nghiệp vụ attendance hiện tại:
- với mỗi `LessonType` bắt buộc trong tuần, học sinh cần đi **ít nhất 1 buổi**

Ví dụ:
- tuần đó có 4 slot `Đại số 12`
- tuần đó có 4 slot `Hình học`
- học sinh chỉ cần đạt tối thiểu:
  - 1 attendance cho `Đại số 12`
  - 1 attendance cho `Hình học`

Rule này được dùng ở module:
- `Attendance`

## 4. Cấu trúc dữ liệu

### 4.1 Request item

Khi frontend gửi vào `Period Setting`, mỗi item có dạng:

```json
{
  "lessonTypeId": "019dc555-d60d-7607-b06c-baea94cdf4c9",
  "lessonsPerWeek": 4,
  "sortOrder": 1
}
```

### 4.2 Response item

Backend trả ra dạng:

```json
{
  "pslt_uuid": "019dc444-d60d-7607-b06c-baea94cdf4c9",
  "lesson_type_uuid": "019dc555-d60d-7607-b06c-baea94cdf4c9",
  "lesson_type_name": "Đại số 12",
  "lesson_time": 195,
  "lessons_per_week": 4,
  "sort_order": 1
}
```

## 5. Ai can thiệp vào `PeriodSetting-LessonType`

Hiện tại không có API CRUD riêng cho `PeriodSetting-LessonType`.

Người dùng can thiệp gián tiếp thông qua module:
- `Period Setting`

Cụ thể:
- khi tạo `PeriodSetting`, frontend gửi `lessonTypeConfigs`
- khi cập nhật `PeriodSetting`, frontend cũng gửi `lessonTypeConfigs`

Backend sẽ:
- tạo danh sách `PeriodSettingLessonType` mới
- hoặc thay toàn bộ danh sách cũ nếu request update có field `lessonTypeConfigs`

## 6. Ai là actor nghiệp vụ

Actor thực tế can thiệp vào dữ liệu này là:
- `Manager`
- hoặc người vận hành cấu hình khóa học

Học sinh không can thiệp vào `PeriodSetting-LessonType`.
Giáo viên / TA cũng không phải actor chính của dữ liệu này trong flow hiện tại.

## 7. Nó ảnh hưởng tới module nào

### 7.1 Ảnh hưởng tới `Period`

Khi tạo `Period` từ `PeriodSetting`:
- `Period` thừa hưởng cấu hình template từ `PeriodSetting`
- trong đó `PeriodSetting-LessonType` cho biết period này về mặt nội dung học gồm những loại buổi nào

### 7.2 Ảnh hưởng tới `Attendance`

Trong thống kê attendance theo tuần của học sinh:
- backend cần biết trong tuần đó học sinh bắt buộc phải học những `LessonType` nào
- hiện tại ưu tiên lấy từ `PeriodSetting.lessonTypeConfigs`

Điều này rất quan trọng vì rule attendance của hệ thống là:
- mỗi tuần, học sinh phải đi ít nhất 1 `Lesson` cho mỗi `LessonType` bắt buộc

Nghĩa là:
- nếu `PeriodSetting` có `Đại số 12` và `Hình học`
- và template / lesson thực tế trong tuần tạo ra nhiều slot cho mỗi loại
- thì tuần đó học sinh vẫn chỉ cần tối thiểu:
  - 1 attendance cho `Đại số 12`
  - 1 attendance cho `Hình học`

### 7.3 Không trực tiếp sinh `Lesson`

`PeriodSetting-LessonType` không trực tiếp sinh `Lesson`.

Việc sinh `Lesson` thực tế thuộc về:
- `StudyWeek`
- dựa trên `TimetableTemplate`

Nên cần phân biệt rõ:
- `PeriodSetting-LessonType` trả lời câu hỏi: "khóa học này cần học những loại nội dung nào"
- `TimetableTemplateItem` trả lời câu hỏi: "trong tuần có những slot nào để học các nội dung đó"

## 8. Phân biệt với `TimetableTemplateItem`

Đây là hai khái niệm rất dễ nhầm.

### `PeriodSetting-LessonType`

Mô tả:
- loại nội dung học trong khóa
- số buổi mỗi tuần theo từng loại nội dung

Trọng tâm:
- cấu trúc học thuật / cấu trúc khóa học

### `TimetableTemplateItem`

Mô tả:
- thứ trong tuần
- giờ bắt đầu
- lesson type của slot đó

Trọng tâm:
- khung lịch học tuần / slot thực tế

Ví dụ:
- `PeriodSetting-LessonType`: `Đại số 12` cần 4 buổi / tuần
- `TimetableTemplateItem`: `Đại số 12` có các slot vào `CN 07:15`, `T2 17:45`, `T3 17:45`, `T4 14:00`

## 9. Hành vi update hiện tại

Đây là điểm frontend cần lưu ý:

- Nếu update `PeriodSetting` mà **không gửi** `lessonTypeConfigs`
  - backend giữ nguyên danh sách cũ

- Nếu update `PeriodSetting` mà **có gửi** `lessonTypeConfigs`
  - backend xóa toàn bộ config cũ trong collection
  - rồi tạo lại toàn bộ config mới từ request

Nghĩa là:
- không có update từng item riêng lẻ ở API hiện tại
- frontend nên coi `lessonTypeConfigs` là một danh sách replace toàn phần

## 10. Rủi ro / giới hạn hiện tại

Theo code hiện tại:
- chưa có API CRUD riêng cho `PeriodSetting-LessonType`
- chưa chặn trùng `lessonTypeId` trong cùng một `PeriodSetting`
- chưa kiểm tra tổng `lessonsPerWeek` có khớp hay mâu thuẫn gì với `TimetableTemplate` hay không

Vì vậy frontend nên hỗ trợ validate sớm:
- không chọn trùng `lessonType`
- `lessonsPerWeek >= 1`
- `sortOrder >= 1`

## 11. Kết luận ngắn

`PeriodSetting-LessonType` là phần cấu hình nội dung học của template khóa học.

Nó trả lời 3 câu hỏi:
- khóa học này gồm những loại nội dung nào
- mỗi loại cần bao nhiêu buổi / tuần
- hiển thị theo thứ tự nào

Người chỉnh nó là:
- manager / người vận hành

Nơi chỉnh nó là:
- form `Period Setting`
