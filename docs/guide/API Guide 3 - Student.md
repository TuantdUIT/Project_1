# API Guide 3 - Student

## 1. Mục đích module

Module `Student` phục vụ quản lý hồ sơ học sinh và luồng đăng ký học sinh.

Nghiệp vụ chính:
- Học sinh tự đăng ký để nhận tư vấn
- Manager tạo hồ sơ học sinh
- Manager lấy và cập nhật thông tin học sinh
- Manager lọc danh sách học sinh theo trạng thái

Module này có liên quan trực tiếp tới:
- `User`
- `Grade`
- `Role`
- `ThamSo`
- `Period`

## 2. Ghi chú nghiệp vụ quan trọng

- Mỗi học sinh luôn gắn với một `User`
- Khi tạo học sinh, backend sẽ tạo luôn `User`
- Role của user đó được gán là `STUDENT`
- Password mặc định của học sinh là `số điện thoại học sinh`, sau đó được mã hóa trước khi lưu DB
- `student_first_enroll_date` không nhập ở module này, field này được set lần đầu khi học sinh đăng ký `PERIOD`
- `debt` không nhập ở module này, field này được cập nhật từ tổng `debt` của tất cả `PERIOD`
- `(student_id, school_year)` là unique
- Học sinh có thể thuộc nhiều `Grade`
- Khi manager tạo hoặc cập nhật học sinh có `student_id`, backend sẽ cập nhật bộ đếm `THAMSO` theo key dạng `[TenKhoi]-[NamHoc]-SID`

## 3. Ghi chú chung cho frontend

- Base path của module: `/api/v1`
- Có 2 luồng chính:
  - luồng public: học sinh tự đăng ký
  - luồng manager: quản lý tạo / đọc / cập nhật hồ sơ học sinh
- Response thành công được bọc theo `RestResponse`
- API danh sách học sinh trả theo format phân trang `ResultPaginationDTO`

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

### 4.2 Response phân trang

```json
{
  "statusCode": 200,
  "error": null,
  "message": "Lay danh sach hoc sinh theo status",
  "data": {
    "meta": {
      "page": 1,
      "pageSize": 10,
      "totalPages": 2,
      "totalItems": 15
    },
    "result": []
  }
}
```

### 4.3 Cấu trúc `ResStudentDTO`

```json
{
  "user_uuid": "019dbfff-d60d-7607-b06c-baea94cdf4c9",
  "student_id": "10013",
  "user_fullname": "Nguyen Van A",
  "user_phone_number": "0123456789",
  "parent_name": "Tran Thi B",
  "parent_number": "0987654321",
  "fb_link": "https://facebook.com/a",
  "user_email": "a@example.com",
  "school": "THPT ABC",
  "student_class": "12A1",
  "student_status": "ACTIVE",
  "student_first_enroll_date": "2026-05-01",
  "school_year": 2026,
  "debt": 1500000,
  "grades": [
    {
      "id": 1,
      "name": "K12"
    }
  ],
  "created_at": "2026-05-16T10:00:00Z",
  "updated_at": "2026-05-16T10:00:00Z",
  "created_by": "system",
  "updated_by": "system"
}
```

## 5. Danh sách API

### 5.1 POST `/api/v1/student/register`

#### Mục đích
Học sinh tự đăng ký để nhận tư vấn.

#### Input format

Request body:

```json
{
  "fullName": "Nguyen Van A",
  "phoneNumber": "0123456789",
  "parentName": "Tran Thi B",
  "parentNumber": "0987654321",
  "fbLink": "https://facebook.com/a",
  "email": "a@example.com",
  "school": "THPT ABC",
  "className": "12A1",
  "schoolYear": 2026,
  "gradeIds": [1]
}
```

#### Validate input

- `fullName`: bắt buộc
- `phoneNumber`: bắt buộc
- `parentNumber`: bắt buộc
- `email`: bắt buộc, đúng format email
- `schoolYear`: bắt buộc
- `gradeIds`: bắt buộc, không rỗng

#### Output format

```json
{
  "statusCode": 201,
  "error": null,
  "message": "Hoc sinh dang ky nhan tu van",
  "data": {
    "user_uuid": "019dbfff-d60d-7607-b06c-baea94cdf4c9",
    "student_id": null,
    "user_fullname": "Nguyen Van A",
    "user_phone_number": "0123456789",
    "parent_name": "Tran Thi B",
    "parent_number": "0987654321",
    "fb_link": "https://facebook.com/a",
    "user_email": "a@example.com",
    "school": "THPT ABC",
    "student_class": "12A1",
    "student_status": "WAITING",
    "student_first_enroll_date": null,
    "school_year": 2026,
    "debt": null,
    "grades": [
      {
        "id": 1,
        "name": "K12"
      }
    ],
    "created_at": "2026-05-16T10:00:00Z",
    "updated_at": "2026-05-16T10:00:00Z",
    "created_by": "system",
    "updated_by": "system"
  }
}
```

#### Mô tả luồng

Học sinh đăng ký -> validate request body -> kiểm tra email chưa tồn tại -> kiểm tra role `STUDENT` tồn tại -> tạo `User` với password mặc định bằng `phoneNumber` -> mã hóa password -> lưu `User` -> validate toàn bộ `gradeIds` -> tạo `Student` với `student_status = WAITING`, `student_id = null`, `student_first_enroll_date = null`, `debt = null` -> lưu `Student` xuống DB -> trả kết quả

#### Exception có thể trả về

- `400 Bad Request`
  - `Khong duoc de trong ho ten hoc sinh`
  - `Khong duoc de trong so dien thoai hoc sinh`
  - `Khong duoc de trong so dien thoai phu huynh`
  - `Khong duoc de trong email`
  - `Email khong hop le`
  - `Khong duoc de trong nam hoc`
  - `Khong duoc de trong khoi`
  - `User with email '...' already exists`
- `400/404` tùy global exception handler hiện tại
  - `Role with name 'STUDENT' does not exist`
  - `Mot hoac nhieu grade khong ton tai`

#### Ghi chú liên quan module khác

- API này có gọi logic của `User` và `Role`
- Chưa tạo `Period`
- `student_first_enroll_date` sẽ chỉ được set ở module `Period` khi học sinh đăng ký khóa học đầu tiên

---

### 5.2 POST `/api/v1/manager/student/register`

#### Mục đích
Manager tạo hồ sơ học sinh từ màn hình quản lý.

#### Input format

Request body:

```json
{
  "studentId": "10013",
  "fullName": "Nguyen Van A",
  "phoneNumber": "0123456789",
  "parentName": "Tran Thi B",
  "parentNumber": "0987654321",
  "fbLink": "https://facebook.com/a",
  "email": "a@example.com",
  "school": "THPT ABC",
  "className": "12A1",
  "studentStatus": "ACTIVE",
  "schoolYear": 2026,
  "gradeIds": [1]
}
```

#### Validate input

- `fullName`: bắt buộc
- `phoneNumber`: bắt buộc
- `email`: bắt buộc, đúng format email
- `studentStatus`: bắt buộc, giá trị hợp lệ:
  - `WAITING`
  - `ACTIVE`
  - `INACTIVE`
- `schoolYear`: bắt buộc
- `gradeIds`: bắt buộc, không rỗng
- `studentId`: không bắt buộc, nhưng nếu có thì phải unique theo `schoolYear`

#### Output format

Response cùng cấu trúc `ResStudentDTO`.

#### Mô tả luồng

Manager tạo học sinh -> validate request body -> nếu có `studentId` thì kiểm tra unique theo `(studentId, schoolYear)` -> kiểm tra email chưa tồn tại -> kiểm tra role `STUDENT` tồn tại -> tạo `User` với password mặc định bằng `phoneNumber` -> mã hóa password -> lưu `User` -> validate `gradeIds` -> tạo `Student` với status theo request -> lưu `Student` -> nếu có `studentId` thì cập nhật bảng `THAMSO` theo key `[TenKhoi]-[NamHoc]-SID` -> trả kết quả

#### Exception có thể trả về

- `400 Bad Request`
  - các lỗi validate field tương tự API public register
  - `Student with studentId '...' and schoolYear '...' already exists`
  - `User with email '...' already exists`
- `400/404` tùy global exception handler hiện tại
  - `Role with name 'STUDENT' does not exist`
  - `Mot hoac nhieu grade khong ton tai`

#### Ghi chú liên quan module khác

- API này có liên quan bảng `THAMSO`
- Logic cập nhật `THAMSO` chỉ cập nhật bộ đếm `SID`, không tự sinh `studentId`

---

### 5.3 GET `/api/v1/manager/students?studentStatus=...`

#### Mục đích
Lấy danh sách học sinh theo trạng thái, có thể lọc thêm theo năm học.

#### Input format

Query params:
- `studentStatus`: bắt buộc
  - `WAITING`
  - `ACTIVE`
  - `INACTIVE`
- `schoolYear`: không bắt buộc
- `page`, `size`, `sort`: phân trang theo `Pageable`

Ví dụ:

```http
GET /api/v1/manager/students?studentStatus=ACTIVE&schoolYear=2026&page=0&size=10
```

#### Output format

```json
{
  "statusCode": 200,
  "error": null,
  "message": "Lay danh sach hoc sinh theo status",
  "data": {
    "meta": {
      "page": 1,
      "pageSize": 10,
      "totalPages": 2,
      "totalItems": 15
    },
    "result": [
      {
        "user_uuid": "019dbfff-d60d-7607-b06c-baea94cdf4c9",
        "student_id": "10013",
        "user_fullname": "Nguyen Van A",
        "student_status": "ACTIVE",
        "school_year": 2026,
        "grades": [
          {
            "id": 1,
            "name": "K12"
          }
        ]
      }
    ]
  }
}
```

#### Mô tả luồng

Nhận `studentStatus` và `schoolYear` -> build điều kiện truy vấn `Student` theo status, nếu có thì thêm filter `schoolYear` -> truy vấn có phân trang -> map sang `ResStudentDTO` -> dựng `meta` -> trả kết quả

#### Exception có thể trả về

- `400 Bad Request`
  - `studentStatus` sai enum
  - query param phân trang sai format

---

### 5.4 GET `/api/v1/manager/student/register?studentID={studentID}&schoolYear={schoolYear}`

#### Mục đích
Lấy thông tin học sinh theo cặp khóa nghiệp vụ `(studentID, schoolYear)`.

#### Input format

Query params:
- `studentID`: bắt buộc
- `schoolYear`: bắt buộc

Ví dụ:

```http
GET /api/v1/manager/student/register?studentID=10013&schoolYear=2026
```

#### Output format

Response cùng cấu trúc `ResStudentDTO`.

#### Mô tả luồng

Nhận `studentID + schoolYear` -> tìm `Student` theo unique key nghiệp vụ -> map sang `ResStudentDTO` -> trả kết quả

#### Exception có thể trả về

- `400/404` tùy global exception handler hiện tại
  - `Student with studentId ... and schoolYear ... does not exist`

---

### 5.5 GET `/api/v1/manager/student/register/{userUuid}`

#### Mục đích
Lấy thông tin học sinh theo `user_uuid`.

#### Input format

Path variable:
- `userUuid`: `UUID` của học sinh

#### Output format

Response cùng cấu trúc `ResStudentDTO`.

#### Mô tả luồng

Nhận `userUuid` -> tìm `Student` theo khóa chính -> map sang `ResStudentDTO` -> trả kết quả

#### Exception có thể trả về

- `400/404` tùy global exception handler hiện tại
  - `Student with user_uuid ... does not exist`

---

### 5.6 PUT `/api/v1/manager/student/register?studentID={studentID}&schoolYear={schoolYear}`

#### Mục đích
Cập nhật học sinh theo cặp khóa nghiệp vụ `(studentID, schoolYear)`.

#### Input format

Query params:
- `studentID`: bắt buộc
- `schoolYear`: bắt buộc

Request body:

```json
{
  "studentId": "10014",
  "fullName": "Nguyen Van B",
  "phoneNumber": "0987654321",
  "parentName": "Tran Thi C",
  "parentNumber": "0912345678",
  "fbLink": "https://facebook.com/b",
  "email": "b@example.com",
  "school": "THPT XYZ",
  "className": "12A2",
  "studentStatus": "ACTIVE",
  "schoolYear": 2026,
  "gradeIds": [1, 2]
}
```

#### Validate input

- `email`: nếu có truyền thì phải đúng format
- các field khác đều optional
- nếu có `studentId` hoặc `schoolYear` mới thì backend sẽ kiểm tra lại uniqueness của `(studentId, schoolYear)`

#### Output format

Response cùng cấu trúc `ResStudentDTO`.

#### Mô tả luồng

Nhận `studentID + schoolYear` hiện tại -> tìm `Student` hiện có -> tính giá trị `studentId` và `schoolYear` sau update -> kiểm tra uniqueness của cặp mới -> update các field của `User` nếu có -> nếu đổi email thì kiểm tra email không trùng -> update các field của `Student` nếu có -> nếu có `gradeIds` thì validate toàn bộ grade -> lưu `User`, lưu `Student` -> nếu có `studentId` thì cập nhật lại `THAMSO` -> trả kết quả

#### Exception có thể trả về

- `400 Bad Request`
  - `Email khong hop le`
  - `Student with studentId '...' and schoolYear '...' already exists`
  - `User with email '...' already exists`
- `400/404` tùy global exception handler hiện tại
  - `Student with studentId ... and schoolYear ... does not exist`
  - `Mot hoac nhieu grade khong ton tai`

#### Ghi chú cho frontend

- Đây là update kiểu partial update
- Field không truyền lên sẽ giữ nguyên

---

### 5.7 PUT `/api/v1/manager/student/register/{userUuid}`

#### Mục đích
Cập nhật học sinh theo `user_uuid`.

#### Input format

Path variable:
- `userUuid`: `UUID` của học sinh

Request body: giống API update theo `studentID + schoolYear`

#### Output format

Response cùng cấu trúc `ResStudentDTO`.

#### Mô tả luồng

Nhận `userUuid` -> tìm `Student` hiện tại -> dùng cùng logic update chung như API update theo `(studentID, schoolYear)` -> validate uniqueness của `SID` nếu có thay đổi -> update `User` -> update `Student` -> cập nhật `THAMSO` nếu cần -> trả kết quả

#### Exception có thể trả về

- `400 Bad Request`
  - `Email khong hop le`
  - `Student with studentId '...' and schoolYear '...' already exists`
  - `User with email '...' already exists`
- `400/404` tùy global exception handler hiện tại
  - `Student with user_uuid ... does not exist`
  - `Mot hoac nhieu grade khong ton tai`

## 6. Luồng frontend đề xuất

### 6.1 Form học sinh tự đăng ký

1. Frontend lấy danh sách `Grade` để render dropdown / checkbox
2. Gửi `POST /api/v1/student/register`
3. Nếu thành công:
   - coi như học sinh đã được tạo ở trạng thái `WAITING`
   - chưa có `SID`
   - chưa có `student_first_enroll_date`
   - chưa có `debt`

### 6.2 Màn hình manager tạo học sinh

1. Frontend lấy danh sách `Grade`
2. Manager nhập form
3. Gửi `POST /api/v1/manager/student/register`
4. Nếu manager có nhập `studentId`, backend sẽ lưu và đồng thời cập nhật `THAMSO`

### 6.3 Màn hình danh sách học sinh

1. Gọi `GET /api/v1/manager/students?studentStatus=...`
2. Có thể truyền thêm `schoolYear`
3. Dùng `meta` để phân trang

### 6.4 Màn hình chi tiết học sinh

Có 2 cách lấy:
1. Theo `userUuid`
2. Theo `studentID + schoolYear`

Frontend nên chọn một cách thống nhất theo màn hình:
- nếu đi từ danh sách nội bộ thì thường dùng `userUuid`
- nếu tra cứu nghiệp vụ bằng mã học sinh thì dùng `studentID + schoolYear`

## 7. Ghi chú liên quan module khác

- `Student` phụ thuộc `Grade` để phân loại khối học
- `Student` phụ thuộc `Role` vì user của học sinh luôn được gán role `STUDENT`
- `Student` phụ thuộc `Period` ở các field:
  - `student_first_enroll_date`
  - `debt`
- `Student` phụ thuộc `ThamSo` để cập nhật bộ đếm `SID`

## 8. Danh sách endpoint tóm tắt

| Method | Path | Mục đích |
|------|------|------|
| POST | `/api/v1/student/register` | Học sinh tự đăng ký nhận tư vấn |
| POST | `/api/v1/manager/student/register` | Manager tạo học sinh |
| GET | `/api/v1/manager/students?studentStatus=...` | Lấy danh sách học sinh theo trạng thái |
| GET | `/api/v1/manager/student/register?studentID=...&schoolYear=...` | Lấy học sinh theo SID và năm học |
| GET | `/api/v1/manager/student/register/{userUuid}` | Lấy học sinh theo user UUID |
| PUT | `/api/v1/manager/student/register?studentID=...&schoolYear=...` | Cập nhật học sinh theo SID và năm học |
| PUT | `/api/v1/manager/student/register/{userUuid}` | Cập nhật học sinh theo user UUID |
