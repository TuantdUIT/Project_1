# Complete Lesson — Trạng thái buổi học

## Mục tiêu

Hiển thị và quản lý trạng thái buổi học trong thẻ tuần học, bao gồm:
- Cột trạng thái ở cuối bảng danh sách lesson
- Cột "Thời gian kết thúc" (thay cho "Thời lượng dự kiến") để manager nhập khi buổi học xong
- Trạng thái tự động thay đổi theo tiến trình điểm danh và thời gian kết thúc

---

## Enum `LessonStatus`

File: `src/features/study-week/types.ts`

```ts
export enum LessonStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED   = 'COMPLETED',
}
```

### Định nghĩa trạng thái

| Giá trị       | Điều kiện                                                                 | Ý nghĩa             |
|---------------|---------------------------------------------------------------------------|---------------------|
| `NOT_STARTED` | Chưa có học sinh nào được điểm danh thành công                           | Chưa bắt đầu        |
| `IN_PROGRESS` | Có ≥1 học sinh được điểm danh thành công **và** `real_lesson_length = 0` | Đang diễn ra        |
| `COMPLETED`   | Có ≥1 học sinh được điểm danh thành công **và** `real_lesson_length > 0` | Đã kết thúc         |

> Logic tính `lesson_status` do **backend tự động tính toán** dựa trên bản ghi điểm danh và `real_lesson_length`.

---

## Luồng trạng thái trong thẻ tuần học

### Bước 1 — Hiển thị danh sách lesson với cột trạng thái

- Gọi `GET /api/v1/lessons` để load danh sách
- Mặc định `lesson_status = NOT_STARTED` (chưa có điểm danh)
- Bảng hiển thị cột **Trạng thái** ở cuối cùng bên phải
- Cột **Thời gian kết thúc** hiển thị giá trị `real_lesson_length` (phút), ban đầu = `0`

### Bước 2 — Trong buổi học: điểm danh

- Manager thực hiện điểm danh cho học sinh (attendance API, không phải lesson API)
- Sau khi có ≥1 học sinh được điểm danh thành công, backend tự cập nhật `lesson_status = IN_PROGRESS`
- Frontend refetch `GET /api/v1/lessons` → cột trạng thái hiển thị **In Progress**

### Bước 3 — Kết thúc buổi học: nhập thời gian kết thúc

- Manager nhập **Thời gian kết thúc** (số phút thực tế) vào cột tương ứng
- Frontend gọi `PUT /api/v1/lessons/{id}` với `realLessonLength > 0`
- Backend tự chuyển `lesson_status = COMPLETED`
- Frontend refetch → cột trạng thái hiển thị **Completed**

### Bước 4 — Override thủ công (nếu cần)

- Dùng `PUT /api/v1/lessons/{id}/status` để ghi đè `manual_lesson_status`
- Áp dụng khi cần huỷ buổi học, đánh dấu hoàn thành sớm, hoặc điều chỉnh bất thường

---

## Các trường liên quan trên `ResLessonDTO`

| Trường                | Kiểu             | Mô tả                                                      |
|-----------------------|------------------|------------------------------------------------------------|
| `real_lesson_length`  | `number` (int32) | Thời lượng thực tế buổi học (phút). `0` = chưa kết thúc   |
| `has_occurred`        | `boolean`        | Backend flag tổng hợp cho biết đã có điểm danh chưa       |
| `lesson_status`       | `LessonStatus`   | Trạng thái **tự động** tính theo logic trên                |
| `manual_lesson_status`| `LessonStatus`   | Trạng thái **thủ công** do admin đặt                       |

---

## API

### Lấy danh sách / chi tiết lesson

```
GET /api/v1/lessons
GET /api/v1/lessons/{id}
```

Response trả về cả `lesson_status` và `manual_lesson_status`.

### Tạo lesson mới

```
POST /api/v1/lessons
```

**Request body** (`ReqCreateLessonDTO`):

```json
{
  "studyWeekId": "uuid",
  "lessonTypeId": "uuid",
  "gradeId": 1,
  "lessonDate": "2026-05-27",
  "lessonStartTime": "08:00",
  "realLessonLength": 0
}
```

### Cập nhật lesson — bao gồm nhập thời gian kết thúc

```
PUT /api/v1/lessons/{id}
```

**Request body** (`ReqUpdateLessonDTO`) — tất cả trường optional:

```json
{
  "realLessonLength": 90
}
```

> Khi `realLessonLength > 0` **và** đã có điểm danh, backend tự chuyển `lesson_status = COMPLETED`.

### Cập nhật trạng thái thủ công

```
PUT /api/v1/lessons/{id}/status
```

**Request body** (`ReqUpdateLessonStatusDTO`):

```json
{
  "lessonStatus": "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED"
}
```

**Response**: `ResLessonDTO` (bao gồm `manual_lesson_status` đã cập nhật)

### Xoá lesson

```
DELETE /api/v1/lessons/{id}
```

---

## Hook React Query

File: `src/features/study-week/api/lessons.ts`

```ts
// Load danh sách lesson (bước 1 & 2)
const { data: lessons } = useLessonsQuery();

// Nhập thời gian kết thúc → chuyển COMPLETED (bước 3)
const { mutate: updateLesson } = useUpdateLesson();
updateLesson({
  lessonUuid: '...',
  body: { realLessonLength: 90 },
});

// Override trạng thái thủ công (bước 4)
const { mutate: updateStatus } = useUpdateLessonStatus();
updateStatus({
  lessonUuid: '...',
  body: { lessonStatus: LessonStatus.COMPLETED },
});
```

Cả hai mutation đều tự động invalidate query `['schedule', 'lessons']` sau khi thành công.

---

## Ghi chú

- `lesson_status` phản ánh thực tế (backend tính) — dùng để hiển thị trạng thái thực.
- `manual_lesson_status` cho phép admin override — dùng khi cần điều chỉnh thủ công.
- `LessonStatus` enum dùng được cho cả hai trường.
- Bước chuyển `IN_PROGRESS` **không cần gọi lesson API** — attendance API kích hoạt, frontend chỉ cần refetch.
- Bước chuyển `COMPLETED` dùng `PUT /api/v1/lessons/{id}` (cập nhật `realLessonLength`), **không phải** `PUT /api/v1/lessons/{id}/status`.
