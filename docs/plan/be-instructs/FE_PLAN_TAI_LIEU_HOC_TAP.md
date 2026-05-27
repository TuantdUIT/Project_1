# FE Plan — Tab "Tài liệu học tập" (Online Lecture + Learning File)

> Tài liệu này hướng dẫn frontend dựng **một tab/thẻ duy nhất tên "Tài liệu học tập"** gộp 2 module:
> - **Bài giảng online** ([API Guide 17](../guide/API%20Guide%2017%20-%20Online%20Lecture.md)) — nhóm theo `study_week`, có dropdown đổi tuần.
> - **Tài liệu** ([API Guide 18](../guide/API%20Guide%2018%20-%20Learning%20File.md)) — sắp xếp mới → cũ theo `created_at`.
>
> **Phạm vi hiện tại: thao tác thuộc quyền ADMIN/quản lý.** Tab dùng các endpoint "lấy tất cả" và CRUD; chưa áp phân quyền xem theo khối của học sinh. Phần phân quyền theo khối (qua endpoint `/student/{userUuid}`) tạm gác lại, sẽ bổ sung ở giai đoạn làm view cho học sinh — xem [§7 Ghi chú: view học sinh (chưa làm)](#7-ghi-chú--view-học-sinh-chưa-làm).

---

## 1. Tổng quan layout tab

```
┌──────────────────────────────────────────────────────────────────────┐
│  TAB: Tài liệu học tập                                                 │
│                                                                        │
│  ╔══════════════════════════════════════════════════════════════════╗ │
│  ║  Bài giảng online                        [ Tuần ▼ (dropdown) ]    ║ │  ← title + dropdown study-week
│  ╠══════════════════════════════════════════════════════════════════╣ │
│  ║  ── Nhóm: Tuần 20 (17/05 – 23/05) ──                              ║ │
│  ║     • Bài giảng Đại số 12 - Hàm số       [Mở link] [Sửa] [Xoá]   ║ │  ← lọc theo tuần đang chọn
│  ║     • Bài giảng Hình học 12              [Mở link] [Sửa] [Xoá]   ║ │
│  ╚══════════════════════════════════════════════════════════════════╝ │
│                                                                        │
│  ╔══════════════════════════════════════════════════════════════════╗ │
│  ║  Tài liệu                                                         ║ │  ← title
│  ╠══════════════════════════════════════════════════════════════════╣ │
│  ║  • Tài liệu Hàm số bậc nhất   | Chương 1 | 16/05/2026 10:00     ║ │  ← sort created_at desc
│  ║  • Đề cương ôn tập            | Chương 2 | 15/05/2026 09:00     ║ │
│  ╚══════════════════════════════════════════════════════════════════╝ │
└──────────────────────────────────────────────────────────────────────┘
```

Hai section nằm trong **cùng một màn hình**, cuộn dọc. Section trên là Bài giảng online (có dropdown tuần), section dưới là Tài liệu. Vì là màn hình admin nên mỗi item có thêm nút **Sửa / Xoá** và mỗi section có nút **Thêm mới**.

---

## 2. API sử dụng (admin)

### 2.1. Bài giảng online — lấy tất cả
```
GET /api/v1/online-lectures
```
Trả về `List<ResOnlineLectureDTO>` (toàn bộ, không lọc).

**`ResOnlineLectureDTO`:**
```json
{
  "lecture_uuid": "uuid",
  "study_week": {
    "week_uuid": "uuid",
    "week_number": 20,
    "week_start_date": "2026-05-17",
    "week_end_date": "2026-05-23",
    "school_year": 2026
  },
  "grade": { "grade_id": 3, "grade_name": "K12" },
  "lecture_name": "Bài giảng Đại số 12 - Hàm số",
  "lecture_overview": "Tóm tắt nội dung bài giảng",
  "lecture_link": "https://...",
  "lecture_valid_from": "2026-05-17",
  "lecture_valid_to": "2026-08-08",
  "created_at": "2026-05-16T10:00:00Z",
  "updated_at": "2026-05-16T10:00:00Z"
}
```

### 2.2. Tài liệu — lấy tất cả
```
GET /api/v1/learning-files
```
Trả về `List<ResLearningFileDTO>` (toàn bộ, không lọc).

**`ResLearningFileDTO`:**
```json
{
  "file_uuid": "uuid",
  "file_name": "Tài liệu Hàm số bậc nhất",
  "grade": { "grade_id": 1, "grade_name": "K10" },
  "file_overview": "Tóm tắt tài liệu",
  "chapter": "Chương 1",
  "file_link": "https://...",
  "file_valid_from": "2026-05-17",
  "file_valid_to": "2026-08-08",
  "created_at": "2026-05-16T10:00:00Z",
  "updated_at": "2026-05-16T10:00:00Z"
}
```

### 2.3. Endpoint CRUD

| Hành động | Online Lecture | Learning File |
|---|---|---|
| Lấy tất cả | `GET /api/v1/online-lectures` | `GET /api/v1/learning-files` |
| Chi tiết | `GET /api/v1/online-lectures/{id}` | `GET /api/v1/learning-files/{id}` |
| Tạo | `POST /api/v1/online-lectures` | `POST /api/v1/learning-files` |
| Sửa | `PUT /api/v1/online-lectures/{id}` | `PUT /api/v1/learning-files/{id}` |
| Xoá | `DELETE /api/v1/online-lectures/{id}` | `DELETE /api/v1/learning-files/{id}` |

### 2.4. (Tuỳ chọn) Danh sách tuần học cho dropdown
```
GET /api/v1/study-weeks
```
Trả về `List<ResStudyWeekDTO>`. Dùng khi muốn dropdown liệt kê **mọi** tuần trong năm học (kể cả tuần chưa có bài giảng). Nếu chỉ cần các tuần đang có bài giảng, dựng dropdown từ chính kết quả 2.1 (xem §3.2).

---

## 3. Section "Bài giảng online" — nhóm theo study-week + dropdown

### 3.1. Luồng
1. Gọi `GET /api/v1/online-lectures`.
2. Gom (group) các lecture theo `study_week.week_uuid`.
3. Dựng danh sách tuần cho **dropdown** từ các nhóm đó, sắp xếp `week_number` giảm dần (tuần mới nhất lên đầu).
4. Mặc định chọn tuần mới nhất; render các lecture của tuần đang chọn.
5. Khi user đổi dropdown → chỉ đổi `selectedWeekUuid`, render lại danh sách bên dưới (không gọi lại API).

### 3.2. Pseudo-code
```js
async function loadOnlineLectures() {
  const res = await fetch(`/api/v1/online-lectures`).then(r => r.json());
  const lectures = res; // hoặc res.data tuỳ wrapper RestResponse

  // Group theo study-week
  const groups = new Map(); // week_uuid -> { week, items: [] }
  for (const lec of lectures) {
    const wk = lec.study_week;
    if (!groups.has(wk.week_uuid)) groups.set(wk.week_uuid, { week: wk, items: [] });
    groups.get(wk.week_uuid).items.push(lec);
  }

  // Options cho dropdown: tuần mới nhất lên đầu
  const weekOptions = [...groups.values()]
    .map(g => g.week)
    .sort((a, b) => b.week_number - a.week_number);

  return { groups, weekOptions };
}

// Render khi đổi dropdown
function renderWeek(groups, selectedWeekUuid) {
  const group = groups.get(selectedWeekUuid);
  if (!group) return []; // tuần không có bài giảng
  return group.items; // danh sách lecture của tuần đang chọn
}
```

### 3.3. Hiển thị mỗi lecture
- `lecture_name` (tiêu đề), `lecture_overview` (mô tả), `grade.grade_name` (nhãn khối), nút **Mở link** → `lecture_link`, nút **Sửa / Xoá**.
- Nhãn nhóm: `Tuần {week_number} ({week_start_date} – {week_end_date})`.

---

## 4. Section "Tài liệu" — sắp xếp mới → cũ theo `created_at`

### 4.1. Luồng
1. Gọi `GET /api/v1/learning-files`.
2. Sắp xếp toàn bộ theo `created_at` **giảm dần** (mới nhất trước).
3. Render danh sách phẳng (không nhóm theo tuần).

### 4.2. Pseudo-code
```js
async function loadLearningFiles() {
  const res = await fetch(`/api/v1/learning-files`).then(r => r.json());
  const files = res; // hoặc res.data

  // Mới nhất → cũ nhất theo created_at
  files.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return files;
}
```

### 4.3. Hiển thị mỗi file
- `file_name` (tiêu đề), `chapter` (nhãn nhóm hiển thị, không bắt buộc), `file_overview`, `grade.grade_name`, nút **Mở link** → `file_link`, nút **Sửa / Xoá**.
- Có thể show `created_at` định dạng `dd/MM/yyyy HH:mm`.

> `chapter` chỉ là text tự do để gom nhóm hiển thị nếu muốn — backend **không** áp quy tắc nghiệp vụ trên trường này (xem [Guide 18 §9](../guide/API%20Guide%2018%20-%20Learning%20File.md)).

---

## 5. CRUD — body & validate

**Body tạo Online Lecture** (`POST /api/v1/online-lectures`) — bắt buộc `studyWeekId`, `gradeId`, `name`, `link`, `validFrom`, `validTo`:
```json
{
  "studyWeekId": "uuid",
  "gradeId": 3,
  "name": "Bài giảng Đại số 12 - Hàm số",
  "overview": "Tóm tắt",
  "link": "https://...",
  "validFrom": "2026-05-17",
  "validTo": "2026-08-08"
}
```

**Body tạo Learning File** (`POST /api/v1/learning-files`) — bắt buộc `name`, `gradeId`, `link`, `validFrom`, `validTo`; **không** có `studyWeekId`:
```json
{
  "name": "Tài liệu Hàm số bậc nhất",
  "gradeId": 1,
  "overview": "Tóm tắt",
  "chapter": "Chương 1",
  "link": "https://...",
  "validFrom": "2026-05-17",
  "validTo": "2026-08-08"
}
```

**Sửa** (`PUT .../{id}`): các trường đều optional, backend hợp nhất dữ liệu cũ + mới.

Quy tắc validate chung:
- `validTo` không được nhỏ hơn `validFrom`.
- `gradeId` phải tồn tại; với lecture thì `studyWeekId` cũng phải tồn tại.

**Xoá** (`DELETE .../{id}`): trả `204 No Content`. Sau khi xoá thành công, refresh lại danh sách section tương ứng (không cần reload cả tab).

---

## 6. Edge cases & error handling (admin)

| Tình huống | Phản hồi backend | FE xử lý |
|---|---|---|
| Tạo/sửa thiếu trường bắt buộc | vd `Ten lecture khong duoc de trong`, `gradeId khong duoc de trong` | Highlight field lỗi trong form |
| `validTo < validFrom` | `validTo khong duoc nho hon validFrom` | Báo lỗi tại cặp field ngày |
| `studyWeekId`/`gradeId` không tồn tại | `Study week with id {id} does not exist` / `Grade with id {id} does not exist` | Báo lỗi dropdown chọn tuần/khối |
| Sửa/xoá item không tồn tại | `Online lecture with id {id} does not exist` / `Learning file with id {id} does not exist` | Toast lỗi + refresh danh sách (item có thể đã bị xoá nơi khác) |
| Danh sách rỗng | `[]` | Empty state riêng cho từng section |
| Tuần chọn trong dropdown không có lecture | nhóm rỗng | Hiện "Tuần này chưa có bài giảng" |

---

## 7. Ghi chú — view học sinh (chưa làm)

Phân quyền xem theo khối **chưa nằm trong phạm vi tab admin này**. Khi làm view cho học sinh sau này:
- Học sinh sẽ gọi `GET /api/v1/online-lectures/student/{userUuid}` và `GET /api/v1/learning-files/student/{userUuid}` thay cho endpoint "lấy tất cả".
- Backend tự lọc theo `Grade` của học sinh + cửa sổ ngày (`student_first_enroll_date` → `estimate_expire_date` muộn nhất trong các `PERIOD`). FE **không** tự suy diễn quyền.
- Khi đó cần xử lý thêm các lỗi nghiệp vụ học sinh: `Hoc sinh chua co first enrollment date...`, `Hoc sinh chua co period...`, `Student with user_uuid {userUuid} does not exist`.

Chi tiết quy tắc: [Guide 17 §8](../guide/API%20Guide%2017%20-%20Online%20Lecture.md) và [Guide 18 §8](../guide/API%20Guide%2018%20-%20Learning%20File.md).

---

## 8. Checklist FE trước khi merge

- [ ] Tab "Tài liệu học tập" gồm 2 section: "Bài giảng online" (trên) và "Tài liệu" (dưới)
- [ ] Dùng endpoint admin lấy tất cả (`/online-lectures`, `/learning-files`) — chưa dùng `/student/{userUuid}`
- [ ] Bài giảng online nhóm theo `study_week`, dropdown đổi tuần (tuần mới nhất mặc định)
- [ ] Đổi dropdown chỉ render lại client, không gọi lại API
- [ ] Tài liệu sắp xếp `created_at` giảm dần (mới → cũ)
- [ ] Nút Thêm/Sửa/Xoá hoạt động; refresh đúng section sau khi ghi
- [ ] Form tạo lecture có `studyWeekId`; form tạo file thì không
- [ ] Validate `validTo >= validFrom` ở FE trước khi gửi
- [ ] Nút "Mở link" cho cả lecture (`lecture_link`) và file (`file_link`)
- [ ] Empty state riêng cho từng section và cho tuần không có bài giảng
- [ ] Xử lý các message lỗi CRUD (thiếu field, không tồn tại, sai khoảng ngày)
</content>
