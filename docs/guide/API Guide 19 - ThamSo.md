# API Guide 19 - ThamSo

## 1. Mục đích module

Module `ThamSo` phục vụ đọc các tham số vận hành dạng key-value.

Ở thời điểm hiện tại, use case chính đang dùng là:
- lưu mốc `SID` lớn nhất theo từng `Grade + schoolYear`
- key có format:
  - `[GradeName]-[schoolYear]-SID`

Ví dụ:

```text
K10-2027-SID
```

## 2. Ghi chú nghiệp vụ quan trọng

- `ThamSo` hiện đang được backend cập nhật từ:
  - luồng tạo / cập nhật học sinh
  - luồng tạo / cập nhật period
- `configValue` hiện được hiểu là:
  - giá trị SID lớn nhất đang ghi nhận cho key đó
- backend chỉ cập nhật khi SID mới lớn hơn SID hiện tại

## 3. Ghi chú chung cho frontend

- Base path của module: `/api/v1/tham-sos`
- Response thành công được bọc theo `RestResponse`
- Module hiện chỉ có API đọc

## 4. Format response chung

### 4.1 Response thành công

```json
{
  "statusCode": 200,
  "error": null,
  "message": "Mô tả API",
  "data": {}
}
```

### 4.2 Cấu trúc `ResThamSoDTO`

```json
{
  "configKey": "K10-2027-SID",
  "configValue": "10013",
  "createdAt": "2026-05-22T10:00:00Z",
  "updatedAt": "2026-05-22T10:30:00Z",
  "createdBy": "system",
  "updatedBy": "system"
}
```

## 5. Danh sách API

### 5.1 GET `/api/v1/tham-sos`

#### Mục đích

Lấy toàn bộ danh sách `ThamSo`.

#### Input format

Không có request body.

#### Output format

Response là mảng `ResThamSoDTO`.

Ví dụ:

```json
{
  "statusCode": 200,
  "error": null,
  "message": "Lay danh sach tham so",
  "data": [
    {
      "configKey": "K10-2027-SID",
      "configValue": "10013",
      "createdAt": "2026-05-22T10:00:00Z",
      "updatedAt": "2026-05-22T10:30:00Z",
      "createdBy": "system",
      "updatedBy": "system"
    },
    {
      "configKey": "K12-2027-SID",
      "configValue": "10089",
      "createdAt": "2026-05-22T10:00:00Z",
      "updatedAt": "2026-05-22T11:00:00Z",
      "createdBy": "system",
      "updatedBy": "admin@..."
    }
  ]
}
```

#### Mô tả luồng

Nhận request -> truy vấn toàn bộ bảng `THAMSO` -> sort theo `configKey` tăng dần -> map sang `ResThamSoDTO` -> trả kết quả

#### Exception có thể trả về

- Hiện tại API này không có validate nghiệp vụ riêng

---

### 5.2 GET `/api/v1/tham-sos/by-school-year?schoolYear={schoolYear}`

#### Mục đích

Lấy toàn bộ `ThamSo` thuộc một `schoolYear`.

#### Input format

Query param:

```text
schoolYear: Integer
```

Ví dụ:

```http
GET /api/v1/tham-sos/by-school-year?schoolYear=2027
```

#### Output format

Response là mảng `ResThamSoDTO`.

Ví dụ:

```json
{
  "statusCode": 200,
  "error": null,
  "message": "Lay danh sach tham so theo nam hoc",
  "data": [
    {
      "configKey": "K10-2027-SID",
      "configValue": "10013",
      "createdAt": "2026-05-22T10:00:00Z",
      "updatedAt": "2026-05-22T10:30:00Z",
      "createdBy": "system",
      "updatedBy": "system"
    },
    {
      "configKey": "K11-2027-SID",
      "configValue": "10045",
      "createdAt": "2026-05-22T10:00:00Z",
      "updatedAt": "2026-05-22T10:45:00Z",
      "createdBy": "system",
      "updatedBy": "system"
    }
  ]
}
```

#### Cách backend lọc theo `schoolYear`

Backend hiện lọc theo pattern của `configKey`:

```text
%-[schoolYear]-SID
```

Ví dụ với `schoolYear = 2027`, hệ thống lấy các key dạng:
- `K10-2027-SID`
- `K11-2027-SID`
- `K12-2027-SID`

#### Mô tả luồng

Nhận `schoolYear` -> truy vấn bảng `THAMSO` theo pattern key của năm học đó -> map sang `ResThamSoDTO` -> trả kết quả

#### Exception có thể trả về

- nếu không truyền `schoolYear`, Spring sẽ trả lỗi validate request param

## 6. Luồng liên quan sang module khác

### 6.1 Liên quan tới `Student`

Khi tạo / cập nhật học sinh:
- nếu học sinh có `SID`
- có `schoolYear`
- có `Grade`

backend có thể cập nhật các key dạng:
- `K10-2027-SID`
- `K11-2027-SID`

theo rule:
- chỉ update nếu SID mới lớn hơn giá trị hiện tại

### 6.2 Liên quan tới `Period`

Khi tạo / cập nhật `Period`:
- backend lấy:
  - `student.studentId`
  - `period.grade`
  - `period.schoolYear`
- rồi cập nhật key đúng với `grade` của `Period`

## 7. Luồng frontend đề xuất

### 7.1 Màn hình quản trị tham số SID

1. Gọi `GET /api/v1/tham-sos/by-school-year?schoolYear=2027`
2. Hiển thị danh sách theo từng key
3. Dùng để kiểm tra hệ thống đang chạy SID tới đâu ở từng khối

### 7.2 Màn hình audit / debug

1. Gọi `GET /api/v1/tham-sos`
2. Xem toàn bộ tham số hiện có trong hệ thống

## 8. Danh sách endpoint tóm tắt

| Method | Path | Mục đích |
|------|------|------|
| GET | `/api/v1/tham-sos` | Lấy toàn bộ danh sách tham số |
| GET | `/api/v1/tham-sos/by-school-year?schoolYear=...` | Lấy danh sách tham số theo năm học |
