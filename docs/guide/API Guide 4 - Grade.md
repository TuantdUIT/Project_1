# API Guide 4 - Grade

## 1. Mục đích module

Module `Grade` phục vụ quản lý khối học.

Theo nghiệp vụ hiện tại, `Grade` được dùng làm nền cho:
- phân loại học sinh
- cấu hình `PeriodSetting`
- cấu hình `TimetableTemplate`
- tạo `Lesson`
- lọc học liệu (`OnlineLecture`, `LearningFile`)

Các giá trị đang dùng phổ biến:
- `K10`
- `K11`
- `K12`
- `VDC`
- `DGNL`

## 2. Ghi chú chung cho frontend

- Base path của module: `/api/v1/grades`
- Response thành công được bọc theo `RestResponse`
- Module này không phân trang, danh sách trả về toàn bộ

## 3. Format response chung

### 3.1 Response thành công

```json
{
  "statusCode": 200,
  "error": null,
  "message": "Mo ta API",
  "data": {}
}
```

### 3.2 Cấu trúc `ResGradeDTO`

```json
{
  "id": 1,
  "name": "K12"
}
```

## 4. Danh sách API

### 4.1 GET `/api/v1/grades`

#### Mục đích
Lấy toàn bộ danh sách `Grade`.

#### Input format

Không có request body.

#### Output format

```json
{
  "statusCode": 200,
  "error": null,
  "message": "Lay danh sach grades",
  "data": [
    {
      "id": 1,
      "name": "K10"
    },
    {
      "id": 2,
      "name": "K11"
    },
    {
      "id": 3,
      "name": "K12"
    }
  ]
}
```

#### Mô tả luồng

Nhận request -> truy vấn toàn bộ bảng `GRADE` -> map từng bản ghi sang `ResGradeDTO` -> trả kết quả

#### Exception có thể trả về

- Thực tế API này hiện không có validate nghiệp vụ riêng

#### Ghi chú cho frontend

- Đây là API phù hợp để load dropdown / checkbox chọn khối ở nhiều màn hình khác nhau

---

### 4.2 GET `/api/v1/grades/{id}`

#### Mục đích
Lấy chi tiết một `Grade` theo `id`.

#### Input format

Path variable:
- `id`: `Long`

Ví dụ:

```http
GET /api/v1/grades/1
```

#### Output format

```json
{
  "statusCode": 200,
  "error": null,
  "message": "Lay chi tiet grade",
  "data": {
    "id": 1,
    "name": "K12"
  }
}
```

#### Mô tả luồng

Nhận `gradeId` -> tìm grade trong DB theo id -> map sang `ResGradeDTO` -> trả kết quả

#### Exception có thể trả về

- `400/404` tùy global exception handler hiện tại
  - `Grade with id ... does not exist`

---

### 4.3 POST `/api/v1/grades`

#### Mục đích
Tạo mới một `Grade`.

#### Input format

Request body:

```json
{
  "name": "K12"
}
```

#### Validate input

- `name`: bắt buộc
- `name`: không được trùng với grade đã tồn tại

#### Output format

```json
{
  "statusCode": 201,
  "error": null,
  "message": "Tao grade",
  "data": {
    "id": 5,
    "name": "DGNL"
  }
}
```

#### Mô tả luồng

Tạo grade -> validate request body -> kiểm tra tên grade đã tồn tại chưa -> tạo entity `Grade` mới -> lưu xuống DB -> map sang `ResGradeDTO` -> trả kết quả

#### Exception có thể trả về

- `400 Bad Request`
  - `Ten grade khong duoc de trong`
  - `Grade with name '...' already exists`

---

### 4.4 PUT `/api/v1/grades/{id}`

#### Mục đích
Cập nhật tên `Grade`.

#### Input format

Path variable:
- `id`: `Long`

Request body:

```json
{
  "name": "K12"
}
```

#### Validate input

- `name`: bắt buộc
- nếu tên mới khác tên cũ thì không được trùng với grade khác

#### Output format

```json
{
  "statusCode": 200,
  "error": null,
  "message": "Cap nhat grade",
  "data": {
    "id": 3,
    "name": "K12"
  }
}
```

#### Mô tả luồng

Nhận `gradeId` -> tìm grade hiện tại -> validate tên mới -> nếu tên mới khác tên cũ thì kiểm tra trùng -> cập nhật `name` -> lưu DB -> trả kết quả

#### Exception có thể trả về

- `400 Bad Request`
  - `Ten grade khong duoc de trong`
  - `Grade with name '...' already exists`
- `400/404` tùy global exception handler hiện tại
  - `Grade with id ... does not exist`

---

### 4.5 DELETE `/api/v1/grades/{id}`

#### Mục đích
Xóa một `Grade`.

#### Input format

Path variable:
- `id`: `Long`

#### Output format

HTTP status:
- `204 No Content`

Body:
- không có body

#### Mô tả luồng

Nhận `gradeId` -> tìm grade trong DB -> kiểm tra grade này có đang được gán cho học sinh nào không -> nếu đang có học sinh thuộc grade này thì chặn xóa -> nếu không có thì xóa grade -> trả `204 No Content`

#### Exception có thể trả về

- `400 Bad Request`
  - `Cannot delete grade with id ... because students are assigned`
- `400/404` tùy global exception handler hiện tại
  - `Grade with id ... does not exist`

#### Ghi chú liên quan module khác

- Rule xóa hiện tại chỉ chặn khi grade đang có `Student`
- Các phụ thuộc khác như `PeriodSetting`, `TimetableTemplate`, `Lesson`, `Period` không được kiểm tra ở service này
- Frontend nên coi đây là dữ liệu nền dùng chung cho nhiều module

## 5. Luồng frontend đề xuất

### 5.1 Dùng làm danh mục nền

1. Gọi `GET /api/v1/grades`
2. Lưu danh sách này vào state dùng chung nếu cần
3. Dùng cho:
   - form tạo học sinh
   - form tạo period setting
   - form tạo period
   - form tạo timetable template
   - filter học liệu

### 5.2 Màn hình CRUD grade

1. Danh sách:
   - gọi `GET /api/v1/grades`
2. Tạo:
   - gọi `POST /api/v1/grades`
3. Cập nhật:
   - gọi `PUT /api/v1/grades/{id}`
4. Xóa:
   - gọi `DELETE /api/v1/grades/{id}`
   - nếu backend báo grade đang có học sinh thì cần chặn thao tác trên UI

## 6. Danh sách endpoint tóm tắt

| Method | Path | Mục đích |
|------|------|------|
| GET | `/api/v1/grades` | Lấy toàn bộ danh sách grade |
| GET | `/api/v1/grades/{id}` | Lấy chi tiết grade |
| POST | `/api/v1/grades` | Tạo grade |
| PUT | `/api/v1/grades/{id}` | Cập nhật grade |
| DELETE | `/api/v1/grades/{id}` | Xóa grade |
