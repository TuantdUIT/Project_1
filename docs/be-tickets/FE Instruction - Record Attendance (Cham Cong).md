# FE Instruction - Record Attendance (Chấm công)

Tài liệu hướng dẫn frontend tích hợp **module Record Attendance (chấm công)** theo đúng thứ tự triển khai.

- Base path: `/api/v1/record-attendances`
- Áp dụng cho: mọi `User` có role **khác `STUDENT`** (`TEACHER`, `TA`, `COLAB_TEACHER`, ...)
- Tham chiếu nghiệp vụ chi tiết: [API Guide 12 - Record Attendance.md](../guide/API%20Guide%2012%20-%20Record%20Attendance.md)

> Phân biệt cốt lõi:
> - `LessonEmployeeAssignment` = **kế hoạch** (phân công trước)
> - `RecordAttendance` = **thực tế** (chấm công sau khi buổi học diễn ra)

---

## Thứ tự tích hợp

```
1. POST            (tạo record – sinh dữ liệu nền)
2. GET list        (hiển thị + lấy ra_attd_uuid)
3. GET /{id}       (chi tiết – đổ form edit)
4. PUT /{id}       (sửa)
5. DELETE /{id}    (xóa)
   ── CRUD xong ──
6. GET user weekly-summary   (thống kê 1 user)
7. GET weekly-summary        (dashboard toàn bộ)
8. GET weekly-summary/export (xuất Excel)
```

Nguyên tắc: nhóm **CRUD (1→5)** làm trước để có dữ liệu và quản lý từng record; nhóm **báo cáo (6→8)** làm sau, đi từ phạm vi hẹp (1 user) → rộng (toàn bộ) → xuất file.

---

## Tiền đề trước khi gọi module này

FE phải có sẵn (từ các module khác):
- `userUuid` của một user **role ≠ STUDENT** (lấy từ module User / Employee).
- `lessonUuid` hợp lệ (lấy từ module Lesson).
- `schoolYear`, `weekNumber` (lấy từ module Study Week) — cần cho các API báo cáo.

---

## Cấu trúc dữ liệu chính

### `ResRecordAttendanceDTO`

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

> `ra_attd_uuid` chính là `{id}` dùng cho GET-by-id / PUT / DELETE.

### `ResRecordAttendanceWeeklySummaryDTO`

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

---

## Bước 1 — POST `/api/v1/record-attendances`

Tạo bản ghi chấm công. **Hành động gốc**: chưa có record thì các API còn lại không có gì để thao tác.

### Request body

```json
{
  "userUuid": "uuid",
  "lessonUuid": "uuid",
  "recordAttendanceTime": "2026-05-16T17:40:00",
  "lessonTime": 180,
  "overtime": -15
}
```

| Trường | Kiểu | Bắt buộc | Ràng buộc | Ghi chú |
|--------|------|----------|-----------|---------|
| `userUuid` | UUID | ✅ | NotNull | User role ≠ STUDENT |
| `lessonUuid` | UUID | ✅ | NotNull | Buổi học |
| `overtime` | Integer | ✅ | NotNull | **Được phép âm** |
| `recordAttendanceTime` | DateTime | ⬜ | — | Null → backend gán `now()` |
| `lessonTime` | Integer | ⬜ | `>= 0` | Null → backend lấy `Lesson.realLessonLength` |

### Backend tự suy ra khi FE bỏ trống
- `recordAttendanceTime` null → `LocalDateTime.now()`
- `lessonTime` null → `Lesson.realLessonLength` của lesson tương ứng

### Output
- `ResRecordAttendanceDTO`

### Exception cần handle ở FE
| Message | Nguyên nhân |
|---------|-------------|
| `userUuid khong duoc de trong` | thiếu userUuid |
| `lessonUuid khong duoc de trong` | thiếu lessonUuid |
| `lessonTime khong duoc nho hon 0` | lessonTime < 0 |
| `overtime khong duoc de trong` | thiếu overtime |
| `User chua co role, khong the ghi record attendance` | user chưa gán role |
| `Record attendance khong ap dung cho student` | user là STUDENT |
| `Nhan su da co record attendance cho lesson nay` | trùng cặp `user + lesson` |
| `User with user_uuid ... does not exist` | user không tồn tại |
| `Lesson with id ... does not exist` | lesson không tồn tại |

### Gợi ý FE
- Form chấm công: chọn user (lọc role ≠ STUDENT) + chọn lesson + nhập `overtime`.
- Để trống `lessonTime` nếu muốn dùng độ dài buổi học mặc định.
- Để trống `recordAttendanceTime` nếu chấm tại thời điểm hiện tại.

---

## Bước 2 — GET `/api/v1/record-attendances`

Lấy toàn bộ record để hiển thị bảng và **lấy `ra_attd_uuid`** cho các thao tác theo id.

- Input: không
- Output: mảng `ResRecordAttendanceDTO`

### Gợi ý FE
- Hiển thị bảng: họ tên, role, lesson, ngày, `ra_lesson_time`, `ra_overtime`.
- Lưu `ra_attd_uuid` của từng dòng để dùng cho View / Edit / Delete.

---

## Bước 3 — GET `/api/v1/record-attendances/{id}`

Xem chi tiết một record (dùng để đổ dữ liệu vào form edit).

- Input: path variable `id` = `ra_attd_uuid`
- Output: `ResRecordAttendanceDTO`
- Exception: `Record attendance with id ... does not exist`

---

## Bước 4 — PUT `/api/v1/record-attendances/{id}`

Cập nhật record (partial update — chỉ gửi field cần đổi).

- Input: path variable `id` + body partial
- Output: `ResRecordAttendanceDTO`

### Quy tắc cập nhật
- Field nào null trong body → giữ nguyên giá trị cũ.
- Nếu **đổi sang `lessonUuid` khác** mà **không truyền `lessonTime`** → backend lấy `Lesson.realLessonLength` của lesson mới.

### Exception cần handle
| Message |
|---------|
| `lessonTime khong duoc nho hon 0` |
| `User chua co role, khong the ghi record attendance` |
| `Record attendance khong ap dung cho student` |
| `Nhan su da co record attendance cho lesson nay` |
| `Record attendance with id ... does not exist` |
| `User with user_uuid ... does not exist` |
| `Lesson with id ... does not exist` |

---

## Bước 5 — DELETE `/api/v1/record-attendances/{id}`

Xóa một record chấm công.

- Input: path variable `id` = `ra_attd_uuid`
- Output: `204 No Content`
- Exception: `Record attendance with id ... does not exist`

> Lưu ý: chỉ xóa **bản ghi chấm công**, không ảnh hưởng tới user hay lesson.

---

## Bước 6 — GET `/api/v1/record-attendances/user/{userUuid}/weekly-summary`

Thống kê theo tuần cho **một user** (nhóm theo `LessonType`).

- Input:
  - path variable `userUuid`
  - query: `schoolYear`, `weekNumber`
- Output: `ResRecordAttendanceWeeklySummaryDTO`

### Exception cần handle
| Message |
|---------|
| `User chua co role, khong the ghi record attendance` |
| `Record attendance khong ap dung cho student` |
| `User with user_uuid ... does not exist` |

### Gợi ý FE
- Dùng cho màn hồ sơ chấm công của từng giáo viên / TA.

---

## Bước 7 — GET `/api/v1/record-attendances/weekly-summary`

Thống kê theo tuần cho **toàn bộ user không phải student** (dashboard).

- Input: query `schoolYear`, `weekNumber`
- Output: mảng `ResRecordAttendanceWeeklySummaryDTO`

> API này trả **cả user không có record** trong tuần (record rỗng) → phù hợp để hiển thị bảng tổng hợp đầy đủ nhân sự.

### Gợi ý FE
- Dùng làm bảng dashboard chấm công theo tuần cho manager.

---

## Bước 8 — GET `/api/v1/record-attendances/weekly-summary/export`

Xuất báo cáo chấm công theo tuần ra file Excel.

- Input: query `schoolYear`, `weekNumber`
- Output: file `.xlsx`
- Tên file: `record-attendance-weekly-summary-{schoolYear}-week-{weekNumber}.xlsx`

### Cấu trúc file Excel
- Header (A1..B6): tiêu đề `BÁO CÁO CHẤM CÔNG THEO TUẦN`, năm học, tuần, ngày bắt đầu, ngày kết thúc, ngày xuất báo cáo.
- Từ dòng 8:
  - Cột A: `Họ và tên`
  - Từ cột B: mỗi `lessonType` một cột, ô giao có format `tổng giờ làm|tổng giờ OT`
  - Cuối: `Tổng giờ làm`, `Tổng số ca có chấm công`, `Tổng giờ OT`

### Quy tắc làm tròn (block 15 phút, làm tròn từng record TRƯỚC khi cộng)
- `lessonTime` (số dương): làm tròn **lên** → `10 → 15`, `16 → 30`
- `overtime`:
  - số dương: làm tròn **lên**
  - số âm: làm tròn **về phía 0** → `-10 → 0`, `-20 → -15`

### Exception cần handle
| Message |
|---------|
| `Study week with weekNumber ... and schoolYear ... does not exist` |
| `Khong the xuat file Excel bao cao cham cong theo tuan` |

### Gợi ý FE
- Gọi với `responseType: blob`, tạo URL tạm để tải file `.xlsx`.

---

## Tóm tắt endpoint

| # | Method | Path | Mục đích |
|---|--------|------|----------|
| 1 | POST | `/api/v1/record-attendances` | Tạo record |
| 2 | GET | `/api/v1/record-attendances` | Danh sách |
| 3 | GET | `/api/v1/record-attendances/{id}` | Chi tiết |
| 4 | PUT | `/api/v1/record-attendances/{id}` | Cập nhật |
| 5 | DELETE | `/api/v1/record-attendances/{id}` | Xóa |
| 6 | GET | `/api/v1/record-attendances/user/{userUuid}/weekly-summary` | Thống kê 1 user |
| 7 | GET | `/api/v1/record-attendances/weekly-summary` | Thống kê toàn bộ non-student |
| 8 | GET | `/api/v1/record-attendances/weekly-summary/export` | Xuất Excel |
