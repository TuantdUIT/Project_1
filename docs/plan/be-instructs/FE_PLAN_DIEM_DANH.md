# FE Plan — Điểm danh học sinh theo tuần / khối / buổi

> Tài liệu này hướng dẫn frontend implement luồng:
> **"Load học sinh ACTIVE vào từng khối trong tuần học, tick chọn → bấm Lưu → ghi attendance vào DB"**.
>
> Backend hiện tại không có endpoint batch và không có endpoint filter `students by gradeId`, `attendances by lessonId`. Tài liệu này mô tả cách phối hợp các API hiện có để đạt mục tiêu.

---

## 1. Bảng đích lưu dữ liệu

| Hành động | Bảng DB | API |
|---|---|---|
| Tick điểm danh học sinh | `attendances` | `POST /api/v1/attendances` |
| Bỏ tick điểm danh học sinh | `attendances` (xoá) | `DELETE /api/v1/attendances/{id}` |

`record_attendances` là chấm công của **giáo viên / trợ giảng** — KHÔNG dùng ở luồng này.

---

## 2. Tổng quan luồng UI

```
┌─────────────────────────────────────────────────────────────┐
│  Chọn: schoolYear + weekNumber                              │
│  → Hiển thị: tất cả lessons trong tuần đó (group theo grade)│
└──────────────────────────┬──────────────────────────────────┘
                           │ User chọn 1 lesson
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Màn hình điểm danh cho lesson X                            │
│   - Bảng: học sinh ACTIVE thuộc grade của lesson X          │
│   - Cột checkbox: đã/chưa điểm danh                         │
│   - Pre-fill checkbox từ attendances hiện có                │
│   - Nút "Lưu" → diff state → gọi POST/DELETE từng record    │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. API sử dụng

### 3.1. Lấy danh sách lesson trong tuần
```
GET /api/v1/lessons
```
- Trả về **tất cả** lessons. Frontend tự lọc theo `study_week.week_number`, `study_week.school_year`, `grade.id`.

Hoặc nếu đã biết `studyWeekId`, có thể lọc thông qua việc gọi:
```
GET /api/v1/attendances/weekly-lesson-summary?schoolYear=2026&weekNumber=5&gradeId=1
```
→ Trả về lessons trong tuần, group theo `lessonType`, có sẵn `studentAttendanceCount` cho mỗi lesson.

**Response shape `ResLessonDTO`:**
```json
{
  "lesson_uuid": "019e4c44-8442-75de-a239-0a198ef156a8",
  "study_week": {
    "week_uuid": "...",
    "week_number": 5,
    "school_year": 2026,
    "start_date": "2026-05-18",
    "end_date": "2026-05-24"
  },
  "lesson_type": {
    "lesson_type_uuid": "...",
    "lesson_type_name": "Đại số 12",
    "lesson_time": 120
  },
  "grade": {
    "grade_id": 1,
    "grade_name": "K10"
  },
  "lesson_date": "2026-05-24",
  "lesson_start_time": "13:00:00",
  "real_lesson_length": 240
}
```

---

### 3.2. Lấy danh sách học sinh ACTIVE
```
GET /api/v1/manager/students?studentStatus=ACTIVE&schoolYear=2026&page=1&size=2000
```
**Lưu ý**:
- `studentStatus` hợp lệ: `WAITING | ACTIVE | INACTIVE` (xem `StudentStatus.java`).
- Endpoint **không có filter theo grade** → frontend phải lọc client-side: giữ student có `grades[].grade_id == lesson.grade.grade_id`.
- `size=2000` là max page size (xem `application.properties`).

**Response wrapping (`ResultPaginationDTO`):**
```json
{
  "statusCode": 200,
  "data": {
    "meta": { "page": 1, "pageSize": 2000, "totalPages": 1, "totalItems": 42 },
    "result": [
      {
        "user_uuid": "019dbfff-d60d-7607-b06c-baea94cdf4c9",
        "student_id": "10013",
        "user_fullname": "Nguyen Van A",
        "student_status": "ACTIVE",
        "school_year": 2026,
        "grades": [
          { "grade_id": 1, "grade_name": "K10" }
        ]
      }
    ]
  }
}
```

**Filter trên FE:**
```js
const studentsInGrade = result.filter(
  s => s.student_status === "ACTIVE"
    && s.grades.some(g => g.grade_id === lesson.grade.grade_id)
);
```

---

### 3.3. Lấy attendances hiện có (để pre-fill checkbox)

**Chưa có endpoint filter theo `lessonId`**. 2 cách:

**Cách A — Dùng `GET all` rồi filter:**
```
GET /api/v1/attendances
```
```js
const attendancesOfLesson = response.data.filter(
  a => a.lesson.lesson_uuid === lessonId
);
const tickedMap = new Map(
  attendancesOfLesson.map(a => [a.student.user_uuid, a.attendance_uuid])
);
```
> Nhược điểm: tải toàn bộ DB attendances. Chỉ dùng khi data còn nhỏ.

**Cách B — Đề xuất backend bổ sung endpoint** (xem mục 6).

---

### 3.4. Ghi attendance (tick)
```
POST /api/v1/attendances
Content-Type: application/json

{
  "userUuid": "019dbfff-d60d-7607-b06c-baea94cdf4c9",
  "lessonUuid": "019e4c44-8442-75de-a239-0a198ef156a8",
  "attendanceTime": "2026-05-24T13:05:00"   // optional, mặc định now()
}
```

**Response (`201 Created`)**:
```json
{
  "statusCode": 201,
  "data": {
    "attendance_uuid": "019dd111-d60d-7607-b06c-baea94cdf4c9",
    "attendance_time": "2026-05-24T13:05:00",
    "student": { "user_uuid": "...", "student_id": "10013", "user_fullname": "Nguyen Van A" },
    "lesson": { "lesson_uuid": "...", "lesson_date": "2026-05-24", "lesson_start_time": "13:00:00" }
  }
}
```
→ Lưu lại `attendance_uuid` để có thể untick.

---

### 3.5. Xoá attendance (untick)
```
DELETE /api/v1/attendances/{attendance_uuid}
```
Response: `204 No Content`.

---

## 4. Pseudo-code FE

```js
// ============== 1. Init state ==============
async function openAttendanceScreen(lessonId) {
  // 1.1 Lesson info
  const lesson = await fetch(`/api/v1/lessons/${lessonId}`).then(r => r.json());

  // 1.2 Students ACTIVE
  const studentsRes = await fetch(
    `/api/v1/manager/students?studentStatus=ACTIVE&schoolYear=${lesson.study_week.school_year}&page=1&size=2000`
  ).then(r => r.json());
  const eligibleStudents = studentsRes.data.result.filter(
    s => s.grades.some(g => g.grade_id === lesson.grade.grade_id)
  );

  // 1.3 Attendances hiện có
  const allAttd = await fetch(`/api/v1/attendances`).then(r => r.json());
  const tickedMap = new Map(
    allAttd.data
      .filter(a => a.lesson.lesson_uuid === lessonId)
      .map(a => [a.student.user_uuid, a.attendance_uuid])
  );

  return { lesson, eligibleStudents, tickedMap };
}

// ============== 2. Local state khi user tick ==============
// state[userUuid] = { initiallyTicked: bool, currentlyTicked: bool, attendanceUuid?: string }

// ============== 3. Save (diff & gửi) ==============
async function save(lessonId, state) {
  const toCreate = [];
  const toDelete = [];

  for (const [userUuid, s] of Object.entries(state)) {
    if (!s.initiallyTicked && s.currentlyTicked) toCreate.push(userUuid);
    if (s.initiallyTicked && !s.currentlyTicked) toDelete.push(s.attendanceUuid);
  }

  // Gửi song song; mỗi request có thể fail riêng → cần log
  const results = await Promise.allSettled([
    ...toCreate.map(uid =>
      fetch(`/api/v1/attendances`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userUuid: uid, lessonUuid: lessonId }),
      })
    ),
    ...toDelete.map(aid =>
      fetch(`/api/v1/attendances/${aid}`, { method: "DELETE" })
    ),
  ]);

  return results; // FE xử lý hiển thị success/fail từng dòng
}
```

---

## 5. Edge cases & error handling

### 5.1. Học sinh không có `Period` hợp lệ
Khi `POST /attendances` cho học sinh không đủ điều kiện → backend trả **400**:
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Hoc sinh khong co period hop le cho lesson nay trong study week tuong ung"
}
```
**FE xử lý**: hiển thị toast/dialog "Học sinh này chưa đăng ký Period phù hợp cho buổi học này. Liên hệ quản lý."

### 5.2. Tick trùng
`POST` cùng `(userUuid, lessonUuid)` 2 lần → **400**:
```
"Hoc sinh da duoc diem danh cho lesson nay"
```
**FE xử lý**: coi như success (đã có rồi), refresh state. Hoặc disable checkbox sau khi tick thành công lần 1.

### 5.3. Mạng / partial failure
Khi `Promise.allSettled` có item fail → đánh dấu dòng đó "lưu thất bại", giữ trạng thái cũ, cho user retry.

### 5.4. Empty lesson
Nếu lesson chưa được sinh (do `TimetableTemplate` chưa active hoặc `apply_from` chưa tới) → user không thấy lesson trong tuần. Cần chỉnh template trước.

---

## 6. Khuyến nghị bổ sung backend (TODO)

Để FE đơn giản và performant hơn:

| Endpoint cần thêm | Mục đích |
|---|---|
| `GET /api/v1/students?gradeId={id}&schoolYear={y}&status=ACTIVE` | Lấy đúng học sinh đủ điều kiện, không cần filter client |
| `GET /api/v1/attendances?lessonId={id}` | Pre-fill checkbox không phải load full table |
| `POST /api/v1/attendances/batch` | Gửi 1 request gộp nhiều student cho 1 lesson, atomic |

Khi các endpoint trên có, đoạn pseudo-code ở mục 4 có thể đơn giản hoá còn 2 GET + 1 POST batch.

---

## 7. Checklist FE trước khi merge

- [ ] Filter `studentStatus === "ACTIVE"` cả ở query và client-side
- [ ] Filter `grades.some(g => g.grade_id === lesson.grade.grade_id)`
- [ ] Pre-fill checkbox từ attendances hiện có
- [ ] Diff state khi bấm Lưu (chỉ gửi delta, không gửi lại record không đổi)
- [ ] Hiển thị loading khi đang save
- [ ] Xử lý 400 "trùng" như success
- [ ] Xử lý 400 "không có period hợp lệ" với message rõ ràng
- [ ] Lưu `attendance_uuid` từ response POST để có thể untick sau đó
- [ ] Retry / báo lỗi cho từng dòng nếu partial failure
