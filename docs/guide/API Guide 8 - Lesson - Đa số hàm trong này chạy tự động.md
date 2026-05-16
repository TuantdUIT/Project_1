# API Guide 8 - Lesson - Đa số hàm trong này chạy tự động

## 1. Mục đích module

Module `Lesson` phục vụ quản lý buổi học thực tế.

Theo nghiệp vụ hiện tại:
- `Lesson` là snapshot lịch học thực tế
- `Lesson` thuộc về:
  - một `StudyWeek`
  - một `LessonType`
  - một `Grade`
- `Lesson` có ngày học, giờ bắt đầu và thời lượng thực tế

`Lesson` có thể được tạo theo 2 nguồn:
- tự động sinh từ `StudyWeek` dựa trên `TimetableTemplate`
- tạo / cập nhật thủ công qua API module này

## 2. Ghi chú nghiệp vụ quan trọng

- `Lesson` không bị bind cứng để tự đổi theo `TimetableTemplate`
- `realLessonLength` là thời lượng thực tế của buổi học
- với lesson chưa diễn ra, `realLessonLength` có thể bằng `0`
- unique key hiện tại của `Lesson` là:
  - `studyWeekId`
  - `lessonTypeId`
  - `lessonDate`
  - `lessonStartTime`
  - `gradeId`

Nghĩa là trong cùng một `StudyWeek`, không được có 2 lesson trùng hoàn toàn 5 field trên.

## 3. Ghi chú chung cho frontend

- Base path của module: `/api/v1/lessons`
- Response thành công được bọc theo `RestResponse`
- Module này hiện trả danh sách toàn bộ, chưa có phân trang và chưa có filter
- Có liên quan trực tiếp tới:
  - `StudyWeek`
  - `LessonType`
  - `Grade`
  - `Attendance`
  - `RecordAttendance`

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

### 4.2 Cấu trúc `ResLessonDTO`

```json
{
  "lesson_uuid": "019dc999-d60d-7607-b06c-baea94cdf4c9",
  "study_week": {
    "week_uuid": "019dc888-d60d-7607-b06c-baea94cdf4c9",
    "week_number": 20,
    "school_year": 2026,
    "week_start_date": "2026-05-17",
    "week_end_date": "2026-05-23"
  },
  "lesson_type": {
    "lesson_type_uuid": "019dc555-d60d-7607-b06c-baea94cdf4c9",
    "lesson_type_name": "Đại số 12",
    "lesson_time": 195
  },
  "grade": {
    "id": 3,
    "name": "K12"
  },
  "lesson_date": "2026-05-17",
  "lesson_start_time": "07:15:00",
  "real_lesson_length": 0,
  "created_at": "2026-05-16T10:00:00Z",
  "updated_at": "2026-05-16T10:00:00Z",
  "created_by": "system",
  "updated_by": "system"
}
```

## 5. Danh sách API

### 5.1 GET `/api/v1/lessons`

#### Mục đích
Lấy toàn bộ danh sách `Lesson`.

#### Input format

Không có request body.

#### Output format

Response là mảng `ResLessonDTO`.

```json
{
  "statusCode": 200,
  "error": null,
  "message": "Lay danh sach lessons",
  "data": [
    {
      "lesson_uuid": "019dc999-d60d-7607-b06c-baea94cdf4c9",
      "study_week": {
        "week_uuid": "019dc888-d60d-7607-b06c-baea94cdf4c9",
        "week_number": 20,
        "school_year": 2026,
        "week_start_date": "2026-05-17",
        "week_end_date": "2026-05-23"
      },
      "lesson_type": {
        "lesson_type_uuid": "019dc555-d60d-7607-b06c-baea94cdf4c9",
        "lesson_type_name": "Đại số 12",
        "lesson_time": 195
      },
      "grade": {
        "id": 3,
        "name": "K12"
      },
      "lesson_date": "2026-05-17",
      "lesson_start_time": "07:15:00",
      "real_lesson_length": 0
    }
  ]
}
```

#### Mô tả luồng

Nhận request -> truy vấn toàn bộ bảng `LESSON` -> map từng lesson sang `ResLessonDTO`, trong đó có lồng `study_week`, `lesson_type`, `grade` -> trả kết quả

#### Exception có thể trả về

- Hiện tại API này không có validate nghiệp vụ riêng

---

### 5.2 GET `/api/v1/lessons/{id}`

#### Mục đích
Lấy chi tiết một `Lesson` theo `UUID`.

#### Input format

Path variable:
- `id`: `UUID` của lesson

#### Output format

Response là một `ResLessonDTO`.

#### Mô tả luồng

Nhận `lessonUuid` -> tìm lesson trong DB theo id -> map sang `ResLessonDTO` -> trả kết quả

#### Exception có thể trả về

- `400/404` tùy global exception handler hiện tại
  - `Lesson with id ... does not exist`

---

### 5.3 POST `/api/v1/lessons`

#### Mục đích
Tạo mới một `Lesson` thủ công.

#### Input format

Request body:

```json
{
  "studyWeekId": "019dc888-d60d-7607-b06c-baea94cdf4c9",
  "lessonTypeId": "019dc555-d60d-7607-b06c-baea94cdf4c9",
  "gradeId": 3,
  "lessonDate": "2026-05-17",
  "lessonStartTime": "07:15:00",
  "realLessonLength": 0
}
```

#### Validate input

- `studyWeekId`: bắt buộc
- `lessonTypeId`: bắt buộc
- `gradeId`: bắt buộc
- `lessonDate`: bắt buộc
- `lessonStartTime`: bắt buộc
- `realLessonLength`: bắt buộc, `>= 0`

#### Validate nghiệp vụ khi tạo

Backend kiểm tra:
- `StudyWeek` tồn tại
- `LessonType` tồn tại
- `Grade` tồn tại
- không bị trùng với lesson đã có theo unique key:
  - `studyWeekId`
  - `lessonTypeId`
  - `lessonDate`
  - `lessonStartTime`
  - `gradeId`

#### Output format

Response là một `ResLessonDTO`.

#### Mô tả luồng

Tạo lesson -> validate request body -> kiểm tra unique key của lesson -> resolve `StudyWeek`, `LessonType`, `Grade` từ DB -> tạo entity `Lesson` với `lessonDate`, `lessonStartTime`, `realLessonLength` -> lưu xuống DB -> map sang `ResLessonDTO` -> trả kết quả

#### Exception có thể trả về

- `400 Bad Request`
  - `studyWeekId khong duoc de trong`
  - `lessonTypeId khong duoc de trong`
  - `gradeId khong duoc de trong`
  - `lessonDate khong duoc de trong`
  - `lessonStartTime khong duoc de trong`
  - `realLessonLength khong duoc de trong`
  - `realLessonLength khong duoc nho hon 0`
  - `Lesson bi trung voi du lieu da ton tai`
- `400/404` tùy global exception handler hiện tại
  - `Study week with id ... does not exist`
  - `Lesson type with id ... does not exist`
  - `Grade with id ... does not exist`

#### Ghi chú cho frontend

- Nếu lesson chưa bắt đầu, nên gửi `realLessonLength = 0`

---

### 5.4 PUT `/api/v1/lessons/{id}`

#### Mục đích
Cập nhật một `Lesson`.

#### Input format

Path variable:
- `id`: `UUID` của lesson

Request body:

```json
{
  "studyWeekId": "019dc888-d60d-7607-b06c-baea94cdf4c9",
  "lessonTypeId": "019dc555-d60d-7607-b06c-baea94cdf4c9",
  "gradeId": 3,
  "lessonDate": "2026-05-17",
  "lessonStartTime": "08:00:00",
  "realLessonLength": 180
}
```

#### Validate input

- tất cả field đều optional
- nếu có `realLessonLength` thì phải `>= 0`

#### Validate nghiệp vụ khi update

Backend sẽ:
- lấy giá trị mới từ request nếu có
- nếu không có thì giữ giá trị cũ
- sau đó kiểm tra lại unique key của lesson
- nếu `studyWeekId`, `lessonTypeId` hoặc `gradeId` mới được gửi thì backend sẽ resolve lại entity tương ứng

#### Output format

Response là một `ResLessonDTO`.

#### Mô tả luồng

Cập nhật lesson -> tìm lesson hiện tại theo id -> resolve lại `StudyWeek`, `LessonType`, `Grade`, `lessonDate`, `lessonStartTime`, `realLessonLength` sau update -> kiểm tra unique key mới có bị trùng không -> cập nhật entity `Lesson` -> lưu DB -> map sang `ResLessonDTO` -> trả kết quả

#### Exception có thể trả về

- `400 Bad Request`
  - `realLessonLength khong duoc nho hon 0`
  - `Lesson bi trung voi du lieu da ton tai`
- `400/404` tùy global exception handler hiện tại
  - `Lesson with id ... does not exist`
  - `Study week with id ... does not exist`
  - `Lesson type with id ... does not exist`
  - `Grade with id ... does not exist`

#### Ghi chú cho frontend

- Đây là update kiểu partial update
- Có thể dùng để cập nhật `realLessonLength` sau khi buổi học đã kết thúc

---

### 5.5 DELETE `/api/v1/lessons/{id}`

#### Mục đích
Xóa một `Lesson`.

#### Input format

Path variable:
- `id`: `UUID` của lesson

#### Output format

HTTP status:
- `204 No Content`

Body:
- không có body

#### Mô tả luồng

Nhận `lessonUuid` -> tìm lesson trong DB theo id -> xóa lesson -> trả `204 No Content`

#### Exception có thể trả về

- `400/404` tùy global exception handler hiện tại
  - `Lesson with id ... does not exist`
- Ngoài ra, nếu DB đang có ràng buộc dữ liệu vận hành liên quan tới lesson như:
  - `Attendance`
  - `RecordAttendance`
  - `Penalty`
  thì thao tác xóa có thể fail ở tầng persistence / database tùy quan hệ thực tế

#### Ghi chú cho frontend

- Service hiện tại chưa chủ động chặn xóa lesson đã có dữ liệu vận hành
- Vì vậy frontend nên coi đây là thao tác có rủi ro và chỉ cho phép ở các lesson chưa vận hành nếu muốn an toàn

## 6. Luồng liên quan sang module khác

### 6.1 Liên quan tới `StudyWeek`

Phần lớn lesson trong hệ thống được sinh ra từ `StudyWeek`, không phải từ API tạo tay.

Luồng ngắn:
1. tạo `StudyWeek`
2. backend tìm `TimetableTemplate` đang hiệu lực
3. backend sinh `Lesson` cho từng slot hợp lệ trong tuần

Nghĩa là API `POST /api/v1/lessons` chủ yếu là đường thao tác tay khi cần bổ sung hoặc chỉnh dữ liệu.

### 6.2 Liên quan tới `Attendance`

`Attendance` của học sinh được ghi theo cặp:
- `Student + Lesson`

### 6.3 Liên quan tới `RecordAttendance`

`RecordAttendance` của đối tượng không phải học sinh cũng gắn với `Lesson`.

Vì vậy:
- chỉnh hoặc xóa lesson đã vận hành có thể ảnh hưởng dữ liệu nghiệp vụ khác

## 7. Luồng frontend đề xuất

### 7.1 Màn hình danh sách lesson

1. Gọi `GET /api/v1/lessons`
2. Hiển thị theo:
   - tuần học
   - loại buổi học
   - grade
   - ngày giờ
   - thời lượng thực tế

### 7.2 Màn hình cập nhật lesson sau khi dạy xong

1. Gọi `GET /api/v1/lessons/{id}`
2. Chỉnh `realLessonLength`
3. Gọi `PUT /api/v1/lessons/{id}`

### 7.3 Tạo lesson thủ công

1. Chọn `StudyWeek`
2. Chọn `LessonType`
3. Chọn `Grade`
4. Nhập ngày, giờ và `realLessonLength = 0` nếu lesson chưa diễn ra
5. Gọi `POST /api/v1/lessons`

## 8. Danh sách endpoint tóm tắt

| Method | Path                   | Mục đích             |
| ------ | ---------------------- | -------------------- |
| GET    | `/api/v1/lessons`      | Lấy danh sách lesson |
| GET    | `/api/v1/lessons/{id}` | Lấy chi tiết lesson  |
| POST   | `/api/v1/lessons`      | Tạo lesson           |
| PUT    | `/api/v1/lessons/{id}` | Cập nhật lesson      |
| DELETE | `/api/v1/lessons/{id}` | Xóa lesson           |
