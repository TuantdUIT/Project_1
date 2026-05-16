# API Guide 6 - Study Week

## 1. Mục đích module

Module `Study Week` phục vụ quản lý tuần học trong năm học.

Theo nghiệp vụ hiện tại:
- mỗi `StudyWeek` xác định một tuần học thực tế
- mặc định tuần học chạy từ `Chủ nhật -> Thứ bảy`
- khi tạo `StudyWeek`, backend tự động sinh `Lesson` từ `TimetableTemplate`
- khi cập nhật `StudyWeek`, backend xóa lesson cũ của tuần đó rồi sinh lại
- khi xóa `StudyWeek`, backend xóa luôn các lesson thuộc tuần đó

## 2. Ghi chú nghiệp vụ quan trọng

- `(weekNumber, schoolYear)` là unique
- Nếu request không truyền cả `startDate` và `endDate`:
  - backend tự tính tuần mặc định theo năm học và số tuần
- Nếu request chỉ truyền một trong hai mốc:
  - backend tự kéo về tuần chuẩn `Chủ nhật -> Thứ bảy` chứa ngày đó
- Nếu request truyền cả `startDate` và `endDate`:
  - backend giữ nguyên
  - chỉ validate `endDate` không được nhỏ hơn `startDate`

## 3. Ghi chú chung cho frontend

- Base path của module: `/api/v1/study-weeks`
- Response thành công được bọc theo `RestResponse`
- Module này hiện trả danh sách toàn bộ, chưa có phân trang
- Có liên quan trực tiếp tới:
  - `TimetableTemplate`
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

### 4.2 Cấu trúc `ResStudyWeekDTO`

```json
{
  "week_uuid": "019dc888-d60d-7607-b06c-baea94cdf4c9",
  "week_number": 20,
  "school_year": 2026,
  "week_start_date": "2026-05-17",
  "week_end_date": "2026-05-23",
  "created_at": "2026-05-16T10:00:00Z",
  "updated_at": "2026-05-16T10:00:00Z",
  "created_by": "system",
  "updated_by": "system"
}
```

## 5. Danh sách API

### 5.1 GET `/api/v1/study-weeks`

#### Mục đích
Lấy toàn bộ danh sách `StudyWeek`.

#### Input format

Không có request body.

#### Output format

Response là mảng `ResStudyWeekDTO`.

#### Mô tả luồng

Nhận request -> truy vấn toàn bộ bảng `STUDY_WEEK` -> map sang `ResStudyWeekDTO` -> trả kết quả

#### Exception có thể trả về

- Hiện tại API này không có validate nghiệp vụ riêng

---

### 5.2 GET `/api/v1/study-weeks/{id}`

#### Mục đích
Lấy chi tiết một `StudyWeek` theo `UUID`.

#### Input format

Path variable:
- `id`: `UUID` của study week

#### Output format

Response là một `ResStudyWeekDTO`.

#### Mô tả luồng

Nhận `weekUuid` -> tìm study week trong DB theo id -> map sang `ResStudyWeekDTO` -> trả kết quả

#### Exception có thể trả về

- `400/404` tùy global exception handler hiện tại
  - `Study week with id ... does not exist`

---

### 5.3 POST `/api/v1/study-weeks`

#### Mục đích
Tạo mới một `StudyWeek`.

#### Input format

Request body mẫu để backend tự tính tuần mặc định:

```json
{
  "weekNumber": 20,
  "schoolYear": 2026
}
```

Request body mẫu khi chỉ truyền một mốc ngày:

```json
{
  "weekNumber": 20,
  "schoolYear": 2026,
  "startDate": "2026-05-20"
}
```

Request body mẫu khi truyền đủ cả hai ngày:

```json
{
  "weekNumber": 20,
  "schoolYear": 2026,
  "startDate": "2026-05-17",
  "endDate": "2026-05-23"
}
```

#### Validate input

- `weekNumber`: bắt buộc, `>= 1`
- `schoolYear`: bắt buộc
- `(weekNumber, schoolYear)`: unique
- nếu truyền cả `startDate` và `endDate` thì `endDate >= startDate`

#### Output format

Response là một `ResStudyWeekDTO`.

#### Mô tả luồng

Tạo study week -> validate request body -> kiểm tra unique `(weekNumber, schoolYear)` -> resolve khoảng tuần:
- nếu không truyền ngày nào thì tự tính tuần mặc định
- nếu chỉ truyền một mốc thì chuẩn hóa về `Chủ nhật -> Thứ bảy`
- nếu truyền đủ hai ngày thì dùng trực tiếp sau khi validate
-> lưu `StudyWeek` xuống DB -> tạo các `Lesson` dựa trên `TimetableTemplate` đang hiệu lực -> trả kết quả

#### Exception có thể trả về

- `400 Bad Request`
  - `So thu tuan khong duoc de trong`
  - `So thu tuan phai lon hon 0`
  - `Nam hoc khong duoc de trong`
  - `Study week with weekNumber '...' and schoolYear '...' already exists`
  - `week_end_date khong duoc nho hon week_start_date`

#### Mô tả ngắn riêng cho bước tạo lesson dựa trên timetable template

Sau khi lưu `StudyWeek`, backend sẽ:
1. lấy tất cả `TimetableTemplate` có:
   - cùng `schoolYear`
   - `active = true`
   - `applyFrom <= week_start_date`
2. với mỗi `Grade`, chọn template mới nhất theo `applyFrom`
3. duyệt từng item trong template
4. tính `lessonDate` thực tế từ:
   - ngày bắt đầu tuần
   - `dayOfWeek` của item
5. nếu ngày đó nằm trong khoảng `week_start_date -> week_end_date` thì tạo `Lesson`
6. `realLessonLength` của lesson mới luôn được set `0`
7. nếu lesson đã tồn tại theo unique key hiện tại thì bỏ qua

#### Ghi chú liên quan module khác

- Bước sinh lesson phụ thuộc module `TimetableTemplate`
- `Lesson` sinh ra là snapshot thực tế, không bị update ngược khi template thay đổi về sau

---

### 5.4 PUT `/api/v1/study-weeks/{id}`

#### Mục đích
Cập nhật một `StudyWeek`.

#### Input format

Path variable:
- `id`: `UUID` của study week

Request body:

```json
{
  "weekNumber": 21,
  "schoolYear": 2026,
  "startDate": "2026-05-24",
  "endDate": "2026-05-30"
}
```

#### Validate input

- `weekNumber`: nếu có thì phải `>= 1`
- nếu đổi `weekNumber` hoặc `schoolYear` thì `(weekNumber, schoolYear)` mới vẫn phải unique
- sau khi resolve ngày mới, `endDate` không được nhỏ hơn `startDate`

#### Output format

Response là một `ResStudyWeekDTO`.

#### Mô tả luồng

Cập nhật study week -> tìm study week hiện tại theo id -> xác định `weekNumber` và `schoolYear` sau update -> kiểm tra unique -> resolve lại `startDate` và `endDate` theo rule của module -> lưu study week -> xóa toàn bộ `Lesson` cũ của tuần đó -> sinh lại `Lesson` mới từ `TimetableTemplate` đang hiệu lực -> trả kết quả

#### Exception có thể trả về

- `400 Bad Request`
  - `So thu tuan phai lon hon 0`
  - `Study week with weekNumber '...' and schoolYear '...' already exists`
  - `week_end_date khong duoc nho hon week_start_date`
- `400/404` tùy global exception handler hiện tại
  - `Study week with id ... does not exist`

#### Ghi chú cho frontend

- Việc update week có tác động sang `Lesson`
- Vì backend xóa lesson cũ của tuần rồi sinh lại, frontend nên coi đây là thao tác có ảnh hưởng sang lịch học thực tế của tuần đó

---

### 5.5 DELETE `/api/v1/study-weeks/{id}`

#### Mục đích
Xóa một `StudyWeek`.

#### Input format

Path variable:
- `id`: `UUID` của study week

#### Output format

HTTP status:
- `204 No Content`

Body:
- không có body

#### Mô tả luồng

Nhận `weekUuid` -> tìm study week trong DB -> xóa toàn bộ `Lesson` thuộc tuần đó -> xóa `StudyWeek` -> trả `204 No Content`

#### Exception có thể trả về

- `400/404` tùy global exception handler hiện tại
  - `Study week with id ... does not exist`

## 6. Giải thích cách backend tự tính tuần mặc định

### 6.1 Khi không truyền `startDate` và `endDate`

Backend làm như sau:
1. lấy ngày `01/01/<schoolYear>`
2. tìm `Chủ nhật` đầu tiên của năm đó
3. cộng thêm `weekNumber - 1` tuần
4. đó là `week_start_date`
5. `week_end_date` là `Thứ bảy` của tuần đó

### 6.2 Khi chỉ truyền `startDate`

Backend chuẩn hóa:
- `week_start_date` = Chủ nhật của tuần chứa `startDate`
- `week_end_date` = Thứ bảy của tuần chứa `startDate`

### 6.3 Khi chỉ truyền `endDate`

Backend chuẩn hóa:
- `week_start_date` = Chủ nhật của tuần chứa `endDate`
- `week_end_date` = Thứ bảy của tuần chứa `endDate`

### 6.4 Khi truyền đủ `startDate` và `endDate`

Backend giữ nguyên hai ngày này, chỉ kiểm tra:
- `week_end_date >= week_start_date`

## 7. Luồng frontend đề xuất

### 7.1 Tạo tuần học chuẩn theo năm học

1. Chỉ cần nhập:
   - `weekNumber`
   - `schoolYear`
2. Gửi `POST /api/v1/study-weeks`
3. Backend tự tính ngày và tự sinh `Lesson`

### 7.2 Tạo tuần học theo mốc ngày

1. Nếu muốn dùng tuần chuẩn chứa một ngày cụ thể:
   - gửi một trong hai field `startDate` hoặc `endDate`
2. Backend sẽ tự kéo về `Chủ nhật -> Thứ bảy`

### 7.3 Cập nhật tuần học

1. Gọi `GET /api/v1/study-weeks/{id}`
2. Cho người dùng sửa thông tin tuần
3. Gọi `PUT /api/v1/study-weeks/{id}`
4. Sau khi update, frontend nên hiểu lesson của tuần đó đã được regen lại

## 8. Danh sách endpoint tóm tắt

| Method | Path | Mục đích |
|------|------|------|
| GET | `/api/v1/study-weeks` | Lấy danh sách study week |
| GET | `/api/v1/study-weeks/{id}` | Lấy chi tiết study week |
| POST | `/api/v1/study-weeks` | Tạo study week |
| PUT | `/api/v1/study-weeks/{id}` | Cập nhật study week |
| DELETE | `/api/v1/study-weeks/{id}` | Xóa study week |
