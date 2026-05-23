# Plan — Tuần Học (Study Week Workspace)

> Thêm 1 mục navbar mới **"Tuần học"** trong admin portal. Đây là nơi quản lý vận hành theo tuần: danh sách `StudyWeek`, các `Lesson` được sinh ra trong tuần, `Attendance` (học sinh), `RecordAttendance` (đối tượng không phải học sinh) và các thẻ phạt (`Penalty`) — gom đủ 5 khối **K10, K11, K12, VDC, DGNL** vào cùng một workspace.
>
> Khác với "Mẫu Thời Gian" (view-only template), module này là **workspace vận hành thực tế**: có CRUD `StudyWeek`, có chỉnh sửa `Lesson`, ghi `Attendance`/`RecordAttendance`, và cấp/thu hồi `Penalty`.

---

## 1. Mục tiêu

- Manager mở 1 chỗ duy nhất để xử lý toàn bộ dữ liệu vận hành của một tuần học, theo khối.
- Thấy nhanh: tuần nào đang active, tuần nào sắp tới, đã chấm điểm danh chưa, đã có thẻ phạt nào.
- Hỗ trợ workflow điển hình của manager: chọn tuần → chọn khối → vào buổi học → chấm Attendance + RecordAttendance + gắn Penalty nếu có.
- Hardcode mapping khối dùng **gradeID** (K10=1, K11=2, K12=3, VDC=4, DGNL=5), trùng quy ước với `features/timetable-template` (xem [`features/timetable-template/lib/supplement-grades.ts`](../src/features/timetable-template/lib/supplement-grades.ts) nếu đã tồn tại).

## 2. Phạm vi

### In scope

- Feature module mới: `features/study-week/`.
- Navbar có 1 mục **"Tuần học"** link tới `/admin-portal/study-weeks`.
- 4 route con:
  - `/admin-portal/study-weeks` → danh sách tuần (list view) — landing mặc định.
  - `/admin-portal/study-weeks/:weekUuid` → vào tuần → **redirect mặc định** sang `/admin-portal/study-weeks/:weekUuid/grade/1` (K10).
  - `/admin-portal/study-weeks/:weekUuid/grade/:gradeId` → danh sách `Lesson` của tuần, **chỉ 1 khối** (`gradeId ∈ {1,2,3,4,5}`).
  - `/admin-portal/study-weeks/:weekUuid/grade/:gradeId/lessons/:lessonUuid` → chi tiết 1 buổi học: tabs `Attendance` (HS), `RecordAttendance` (non-HS), `Penalty`.
- CRUD `StudyWeek` (tạo / sửa / xóa) — form chỉ cần `weekNumber` + `schoolYear`, các field ngày để BE tự tính (xem [API Guide 6 — Study Week §6](../docs/guide/API%20Guide%206%20-%20Study%20Week.md)).
- Cập nhật `realLessonLength` cho `Lesson` đã có (sau khi dạy xong).
- Ghi / sửa `Attendance` cho học sinh trong từng `Lesson`.
- Ghi / sửa `RecordAttendance` cho đối tượng không phải học sinh.
- Cấp / sửa / xóa `Penalty` (thẻ phạt) gắn theo `Lesson` (hoặc theo `Student` + `Lesson`, tùy schema BE — xem mục 14).
- Filter buttons theo khối ở view chi tiết tuần: **5 button đúng 5 grade trong DB** — K10 · K11 · K12 · VDC · DGNL. **Không có button "Tất cả"** — bắt buộc chọn 1 khối khi vào tuần. Mỗi khối render độc lập, không gộp.

### Out of scope

- Tạo `Lesson` thủ công (`POST /api/v1/lessons`): hệ thống đã tự sinh từ `StudyWeek`. Plan này không mở UI tạo tay. Nếu phát sinh nhu cầu → plan riêng.
- Xóa `Lesson` đơn lẻ (`DELETE /api/v1/lessons/{id}`): rủi ro mất dữ liệu vận hành liên quan (`Attendance`, `RecordAttendance`, `Penalty`). Không expose ra UI plan này.
- Drag-and-drop reschedule buổi học.
- Export / báo cáo PDF.
- Notification / nhắc lịch.
- View dành cho student (`/schedule` đã có route riêng).
- Bulk import điểm danh từ file Excel.

---

## 3. Endpoint cần wire

| # | Method | Path | Hook FE (đề xuất) | Trạng thái guide |
|---|--------|------|-------------------|------------------|
| 1 | GET | `/api/v1/study-weeks` | `useStudyWeeksQuery()` *(đã có ở [`features/schedule/api/study-weeks.ts`](../src/features/schedule/api/study-weeks.ts) — di chuyển hoặc re-export)* | ✅ [Guide 6](../docs/guide/API%20Guide%206%20-%20Study%20Week.md) |
| 2 | GET | `/api/v1/study-weeks/{id}` | `useStudyWeekQuery(weekUuid)` | ✅ Guide 6 §5.2 |
| 3 | POST | `/api/v1/study-weeks` | `useCreateStudyWeek()` | ✅ Guide 6 §5.3 |
| 4 | PUT | `/api/v1/study-weeks/{id}` | `useUpdateStudyWeek()` | ✅ Guide 6 §5.4 |
| 5 | DELETE | `/api/v1/study-weeks/{id}` | `useDeleteStudyWeek()` | ✅ Guide 6 §5.5 |
| 6 | GET | `/api/v1/lessons` | `useLessonsQuery()` — **lọc client-side theo `study_week.week_uuid`** vì BE chưa có filter | ✅ [Guide 8](../docs/guide/API%20Guide%208%20-%20Lesson%20-%20Đa%20số%20hàm%20trong%20này%20chạy%20tự%20động.md) |
| 7 | GET | `/api/v1/lessons/{id}` | `useLessonQuery(lessonUuid)` | ✅ Guide 8 §5.2 |
| 8 | PUT | `/api/v1/lessons/{id}` | `useUpdateLesson()` — chỉ dùng để cập nhật `realLessonLength` | ✅ Guide 8 §5.4 |
| 9 | GET | `/api/v1/attendances?lessonId=...` | `useAttendancesByLessonQuery(lessonUuid)` | ⚠️ **Chưa có guide** — xem mục 14 |
| 10 | POST/PUT | `/api/v1/attendances` | `useUpsertAttendance()` | ⚠️ Chưa có guide |
| 11 | GET | `/api/v1/record-attendances?lessonId=...` | `useRecordAttendancesByLessonQuery(lessonUuid)` | ⚠️ Chưa có guide |
| 12 | POST/PUT | `/api/v1/record-attendances` | `useUpsertRecordAttendance()` | ⚠️ Chưa có guide |
| 13 | GET | `/api/v1/penalties?lessonId=...` | `usePenaltiesByLessonQuery(lessonUuid)` | ⚠️ Chưa có guide |
| 14 | POST/PUT/DELETE | `/api/v1/penalties` | `useUpsertPenalty()`, `useDeletePenalty()` | ⚠️ Chưa có guide |
| 15 | GET | `/api/v1/grades` | `useGradesQuery()` *(đã có)* | ✅ Guide 4 |

**Quan trọng**:
- Endpoint #9–#14 chưa được mô tả trong thư mục `docs/guide/`. **Trước khi bắt đầu code các tab Attendance/RecordAttendance/Penalty, phải confirm với BE**: path chính xác, filter param (`lessonId` hay `lessonUuid`), shape DTO, có endpoint bulk-upsert hay phải gọi từng record.
- Tạm thời FE có thể stub bằng MSW handlers để dev song song, nhưng **không merge** trước khi guide BE được viết.

---

## 4. Cấu trúc dữ liệu

Đã verified trong `openapi.ts` codegen (mục 3 Guide 6, Guide 8):

```ts
ResStudyWeekDTO {
  week_uuid: string
  week_number: number
  school_year: number
  week_start_date: string      // "YYYY-MM-DD"
  week_end_date: string
  created_at, updated_at, created_by, updated_by
}

ResLessonDTO {
  lesson_uuid: string
  study_week: { week_uuid, week_number, school_year, week_start_date, week_end_date }
  lesson_type: { lesson_type_uuid, lesson_type_name, lesson_time }
  grade: { id, name }          // id ∈ {1,2,3,4,5}
  lesson_date: string          // "YYYY-MM-DD"
  lesson_start_time: string    // "HH:mm:ss"
  real_lesson_length: number   // phút; 0 nếu chưa diễn ra
}
```

DTO cho Attendance/RecordAttendance/Penalty: **chưa có**, sẽ điền sau khi BE confirm.

---

## 5. UI spec

### 5.1 Navbar entry

Thêm 1 `NavLink` trong [`src/app/routes/admin/admin-portal.tsx`](../src/app/routes/admin/admin-portal.tsx), đặt **ngay sau** `paths.adminPortalTimetable`:

```tsx
<NavLink
  to={paths.adminPortalStudyWeeks}
  title={isCompact ? studyWeeksLabel : undefined}
  className={({ isActive }) => navItemClass(isActive)}
>
  <CalendarDays size={18} className="shrink-0" />
  {!isCompact ? <span className="truncate">{studyWeeksLabel}</span> : null}
</NavLink>
```

- Icon: `CalendarDays` (lucide-react) — phân biệt với `CalendarRange` của Mẫu Thời Gian.
- Label: `isWide ? 'Tuần học (vận hành)' : 'Tuần học'`.
- Cập nhật `headerTitle` ternary để cover `paths.adminPortalStudyWeeks`.
- Active state: `location.pathname.startsWith('/admin-portal/study-weeks')`.

### 5.2 List view — `/admin-portal/study-weeks` (dạng accordion / dropdown)

**Quan điểm thiết kế**: thay vì bảng kèm route con `:weekUuid` rồi mới thấy Lesson, list tuần dùng **accordion** — mỗi tuần là 1 dropdown item, click vào header tuần → panel bên dưới mở ra inline hiển thị 5 button khối + bảng Lesson của khối đang chọn. Người dùng không phải chuyển trang để xem nội dung tuần.

Layout:

```
┌────────────────────────────────────────────────────────────────┐
│ [+ Tạo tuần học]                  [search] [năm: 2026 ▾]      │
├────────────────────────────────────────────────────────────────┤
│ ▸ Tuần 19 · 2026 · 10/05 → 16/05         Đã qua      [⋮]      │  ← collapsed
├────────────────────────────────────────────────────────────────┤
│ ▾ Tuần 20 · 2026 · 17/05 → 23/05         Hiện tại 🟢 [⋮]      │  ← expanded
│   ┌──────────────────────────────────────────────────────────┐ │
│   │ [K10] [K11] [K12] [VDC] [DGNL]                           │ │
│   │ ────────────────────────────────────────────────────────│ │
│   │ Ngày     │ Giờ   │ Loại buổi    │ Thời lượng           │ │
│   │ T2 17/05 │ 07:15 │ Đại số 12    │ 195' [✏️]           │ │
│   │ T2 17/05 │ 09:30 │ Hình học 12  │   0' [✏️]           │ │
│   │ T3 18/05 │ 07:15 │ Đại số 12    │   0' [✏️]           │ │
│   └──────────────────────────────────────────────────────────┘ │
├────────────────────────────────────────────────────────────────┤
│ ▸ Tuần 21 · 2026 · 24/05 → 30/05         Sắp tới     [⋮]      │
├────────────────────────────────────────────────────────────────┤
│ ▸ Tuần 22 · 2026 · 31/05 → 06/06         Sắp tới     [⋮]      │
└────────────────────────────────────────────────────────────────┘
```

#### Sort

- **Sắp xếp theo `week_number` ASC** trong cùng `school_year`.
- Năm học (`school_year`) DESC ở ngoài: năm mới nhất trên đầu, trong cùng năm thì tuần nhỏ → tuần lớn.
- Sort apply client-side ngay sau khi `useStudyWeeksQuery` resolve.

#### Header accordion (mỗi item)

- Chevron `▸` (collapsed) / `▾` (expanded) ở đầu — `ChevronRight` / `ChevronDown` từ lucide-react, animate xoay 90° khi đổi state.
- Nội dung header (1 dòng): `Tuần {week_number} · {school_year} · {dd/MM} → {dd/MM}` + status badge + menu 3 chấm `[⋮]`.
- Status badge cuối dòng: `Hiện tại 🟢` (xanh) · `Sắp tới` (xanh nhạt) · `Đã qua` (xám). Tính client-side bằng `Date.now()` vs `week_start_date`/`week_end_date`.
- Click vào **bất kỳ chỗ nào** trên header (trừ menu `[⋮]`) → toggle expand/collapse.
- Menu `[⋮]`: Sửa · Xóa. Xóa kèm confirm modal cảnh báo "Sẽ xóa toàn bộ Lesson + Attendance + Penalty thuộc tuần này".

#### Panel expanded (nội dung bên trong)

- Hiện khi item đang expand. Animation `max-height` transition 200ms để mượt.
- Nội dung panel = phần [Detail view mục 5.4](#54-detail-view---admin-portalstudy-weeksweekuuidgradegradeid) gọn lại:
  - 5 button khối K10/K11/K12/VDC/DGNL ở trên cùng panel.
  - Bảng Lesson 4 cột bên dưới, filter theo grade đang chọn.
- Mặc định khi vừa expand: grade = K10 (`DEFAULT_STUDY_WEEK_GRADE_ID`).
- Click Lesson row → navigate sang Lesson detail (route L3) — vẫn dùng route riêng vì lesson detail có 3 tab, không phù hợp inline.

#### Quản lý trạng thái expand

- **Default**: tuần `CURRENT` được expand sẵn khi vào trang. Các tuần khác collapsed.
- **Single-expand mode**: mặc định chỉ 1 tuần mở tại một thời điểm (giống Disclosure pattern). Mở tuần mới → tuần cũ tự đóng. Lý do: tránh cuộn dài, tránh load song song nhiều dataset Lesson.
- **Persist expand state qua URL** *(tùy chọn nâng cao)*: dùng search param `?week=<weekUuid>&grade=<gradeId>` để deep-link / refresh không mất state. Nếu không làm, expand state chỉ giữ trong React state — refresh sẽ về default.

#### Filter / Search trên top bar

- Filter "năm học" (dropdown): lấy distinct `school_year` từ response, mặc định = năm hiện tại. Chỉ render tuần thuộc năm đang chọn.
- Search input: filter client-side theo `week_number` (gõ số → match exact hoặc startsWith). Search rỗng → hiển thị đủ.
- Nút "+ Tạo tuần học" mở modal mục 5.3.

#### Routing implication

- Route `:weekUuid/grade/:gradeId` vẫn **giữ** làm deep-link (mở thẳng 1 tuần + grade qua URL). Khi truy cập route đó → render cùng UI accordion nhưng auto-expand tuần được trỏ tới + chọn đúng grade.
- Hoặc tối giản hơn: bỏ luôn route L2 standalone, accordion là entry point duy nhất → chỉ giữ L3 (`/lessons/:lessonUuid`). **Quyết định trước khi code** (xem mục 14 — câu hỏi mở).

### 5.3 Tạo / Sửa tuần — modal

Form đơn giản (xem Guide 6 §6 để hiểu rule BE tự tính):

```
┌─ Tạo tuần học ───────────────────┐
│ Số thứ tự tuần *  [ 20 ]         │
│ Năm học *         [ 2026 ]       │
│                                   │
│ ┌─ Tùy chọn ──────────────────┐  │
│ │ [ ] Tự chỉ định ngày         │  │
│ │     Ngày bắt đầu  [    ]     │  │
│ │     Ngày kết thúc [    ]     │  │
│ └──────────────────────────────┘  │
│                                   │
│ ℹ Để trống ngày → BE tính tuần   │
│   Chủ Nhật → Thứ Bảy mặc định.   │
│                                   │
│            [ Hủy ]  [ Tạo tuần ] │
└───────────────────────────────────┘
```

- Field bắt buộc: `weekNumber` (`>= 1`), `schoolYear` (mặc định = năm hiện tại).
- Khi checkbox "Tự chỉ định ngày" off → không gửi `startDate`/`endDate`. BE tự tính.
- Khi on → cho phép gửi 1 hoặc 2 ngày (BE normalize về CN→T7 nếu chỉ 1).
- Submit success → toast "Đã tạo tuần học. Hệ thống đang sinh Lesson..." + invalidate `['study-week']`.
- Form Sửa dùng cùng modal, prefill từ `useStudyWeekQuery(weekUuid)`. Cảnh báo banner vàng phía trên: "Cập nhật tuần học sẽ xóa và sinh lại toàn bộ Lesson của tuần này."

### 5.4 Detail view — `/admin-portal/study-weeks/:weekUuid/grade/:gradeId`

Layout:

```
┌────────────────────────────────────────────────────────┐
│ ← Quay lại danh sách tuần                              │
│ Tuần 20 · Năm học 2026 · 17/05 → 23/05    [Sửa][Xóa]  │
├────────────────────────────────────────────────────────┤
│ [ K10 ] [ K11 ] [ K12 ] [ VDC ] [ DGNL ]               │ ← 5 button sticky
├────────────────────────────────────────────────────────┤
│ Ngày    │ Giờ   │ Loại buổi    │ Thời lượng           │
├────────────────────────────────────────────────────────┤
│ T2 17/05│ 07:15 │ Đại số 12    │ 195' [✏️]            │
│ T2 17/05│ 09:30 │ Hình học 12  │   0' [✏️]            │
│ T3 18/05│ 07:15 │ Đại số 12    │   0' [✏️]            │
│ ...                                                    │
└────────────────────────────────────────────────────────┘
```

- **5 button** filter, mỗi button là 1 khối: K10 · K11 · K12 · VDC · DGNL. **Không có button "Tất cả"** — bảng chỉ render Lesson thuộc khối đang chọn.
- Implement bằng `<NavLink>` (URL routing với `:gradeId`), **không** dùng state nội bộ. Đổi button → đổi URL → cache hit nếu đã load. Pattern này khớp với module Mẫu Thời Gian hiện có.
- Active state khi `location.pathname` chứa `/grade/{id}` khớp.
- Cột "Khối" **bỏ** vì đã filter sẵn theo grade → bảng chỉ còn 4 cột (Ngày · Giờ · Loại buổi · Thời lượng).
- Mỗi row Lesson click vào → navigate sang `/admin-portal/study-weeks/:weekUuid/grade/:gradeId/lessons/:lessonUuid`.
- Nút `✏️` ở cột "Thời lượng" mở inline editor: chỉ sửa `realLessonLength` (1 field), Enter → `PUT /api/v1/lessons/{id}`.
- Empty state: "Khối VDC chưa có buổi học nào trong tuần này."
- Khi vào `/admin-portal/study-weeks/:weekUuid` không có `gradeId` → router redirect sang `/grade/1` (K10) mặc định.

### 5.5 Lesson detail — `/admin-portal/study-weeks/:weekUuid/grade/:gradeId/lessons/:lessonUuid`

Layout với tabs:

```
┌────────────────────────────────────────────────────────┐
│ ← Quay lại tuần 20                                     │
│ T2 17/05/2026 · 07:15 · Đại số 12 · K12  [✏ Sửa giờ]  │
├────────────────────────────────────────────────────────┤
│ [ Học sinh (32) ] [ Đối tượng khác (4) ] [ Phạt (1) ]│
├────────────────────────────────────────────────────────┤
│ <Tab content>                                          │
└────────────────────────────────────────────────────────┘
```

#### Tab Học sinh (Attendance)

- Bảng: STT · Tên HS · MSHS · Trạng thái · Note · Action.
- Trạng thái: enum (TBD theo BE). Đề xuất: `PRESENT` · `ABSENT_EXCUSED` · `ABSENT_UNEXCUSED` · `LATE` · `UNMARKED`.
- Render select dropdown ngay trong cell. Click khác giá trị → debounce 400ms → upsert.
- Note: textarea inline (collapsed → expand on focus).
- Nút "Đánh dấu tất cả: Có mặt" trên top bar — bulk update.

#### Tab Đối tượng khác (RecordAttendance)

- Bảng: STT · Tên · Loại đối tượng · Trạng thái · Note · Action.
- "Loại đối tượng" lấy từ schema BE (TBD).
- Cho phép Thêm đối tượng (nếu BE hỗ trợ) — nếu BE coi đây là master data, chỉ select từ list có sẵn.

#### Tab Phạt (Penalty)

- Bảng: STT · Đối tượng (HS/non-HS) · Lý do · Mức phạt · Note · Người ghi · Action (Sửa / Xóa).
- Nút "+ Thêm thẻ phạt" → modal:
  - Đối tượng: search select trong danh sách HS/non-HS thuộc Lesson này (lấy từ tab 1 + tab 2 đã load).
  - Lý do: textarea bắt buộc.
  - Mức phạt: enum (TBD: nhẹ/trung bình/nặng?).

### 5.6 Màu sắc & convention

- Khối K10/K11/K12/VDC/DGNL ở 5 button dùng cùng bảng màu với Mẫu Thời Gian (xem [`color-map.ts`](../src/features/timetable-template/lib/color-map.ts) nếu tồn tại). Reuse import, không hardcode lại.
- Button active: nền màu chính của khối + chữ trắng. Button inactive: viền `slate-300`, hover viền màu chính của khối.
- Trạng thái Attendance:
  - `PRESENT` → xanh `#16A34A`
  - `ABSENT_EXCUSED` → vàng `#F59E0B`
  - `ABSENT_UNEXCUSED` → đỏ `#DC2626`
  - `LATE` → cam `#EA580C`
  - `UNMARKED` → xám `#94A3B8`

---

## 6. Cấu trúc file đề xuất

```
src/features/study-week/
├── api/
│   ├── study-weeks.ts            # CRUD + hooks (mở rộng từ features/schedule/api/study-weeks.ts)
│   ├── lessons.ts                # list + detail + update lesson hooks
│   ├── attendances.ts            # ⚠ stub đến khi BE confirm
│   ├── record-attendances.ts     # ⚠ stub
│   └── penalties.ts              # ⚠ stub
├── components/
│   ├── study-week-list.tsx       # container accordion list (sort + filter + search)
│   ├── study-week-accordion-item.tsx # 1 row accordion: header + panel expanded
│   ├── study-week-header.tsx     # phần header (chevron, info, status badge, menu)
│   ├── study-week-form-modal.tsx # tạo/sửa tuần
│   ├── study-week-detail.tsx     # nội dung panel (5 button + bảng Lesson) — reuse cho cả route L2 deep-link
│   ├── grade-nav-buttons.tsx     # 5 button K10/K11/K12/VDC/DGNL (NavLink, không có "Tất cả")
│   ├── lesson-row.tsx            # row trong bảng Lesson, có inline editor realLessonLength
│   ├── lesson-detail.tsx         # tabs Attendance/RecordAttendance/Penalty
│   ├── attendance-table.tsx
│   ├── record-attendance-table.tsx
│   ├── penalty-table.tsx
│   ├── penalty-form-modal.tsx
│   └── confirm-delete-modal.tsx
├── hooks/
│   ├── use-lessons-by-week-and-grade.ts # filter client-side useLessonsQuery theo week_uuid + grade.id
│   ├── use-sorted-study-weeks.ts # sort theo school_year DESC, week_number ASC
│   └── use-week-status.ts        # tính 'past' | 'current' | 'future' từ start/end date
├── lib/
│   ├── format-week.ts            # formatWeekLabel(week_number, school_year, start, end)
│   ├── week-status.ts            # hằng số + helper
│   └── attendance-status.ts      # enum + color map
├── types.ts
└── index.ts
```

Route mới ở `src/app/routes/admin/`:
- `study-weeks.tsx` (list view).
- `study-week-detail.tsx` (layout cha với header tuần + 5 button, có `<Outlet />`).
- `study-week-by-grade.tsx` (bảng Lesson của 1 khối, đọc `useParams().gradeId`).
- `study-week-lesson-detail.tsx` (chi tiết 1 buổi học).

Cập nhật `src/config/paths.ts`:

```ts
adminPortalStudyWeeks: '/admin-portal/study-weeks',
adminPortalStudyWeekDetail: (weekUuid: string) => `/admin-portal/study-weeks/${weekUuid}`,
adminPortalStudyWeekByGrade: (weekUuid: string, gradeId: string | number) =>
  `/admin-portal/study-weeks/${weekUuid}/grade/${gradeId}`,
adminPortalStudyWeekLesson: (weekUuid: string, gradeId: string | number, lessonUuid: string) =>
  `/admin-portal/study-weeks/${weekUuid}/grade/${gradeId}/lessons/${lessonUuid}`,
```

Cập nhật `src/app/router.tsx`: thêm 4 lazy loader + nested route entry trong children của `admin-portal`. Pattern khớp với `timetable` route hiện có:

```
study-weeks (list)
study-weeks/:weekUuid (layout)
  index → <Navigate to="grade/1" replace />
  grade/:gradeId (bảng Lesson)
  grade/:gradeId/lessons/:lessonUuid (lesson detail)
```

### Migration `features/schedule/api/study-weeks.ts` → `features/study-week/`

**Đã chốt phương án 2**: di chuyển file. Các bước:

1. Tạo `src/features/study-week/api/study-weeks.ts` — copy nội dung từ `features/schedule/api/study-weeks.ts` rồi bổ sung các hook CRUD (`useStudyWeekQuery`, `useCreateStudyWeek`, `useUpdateStudyWeek`, `useDeleteStudyWeek`).
2. Sửa import trong [`src/features/admin/components/period-form-modal.tsx`](../src/features/admin/components/period-form-modal.tsx): `from '@/features/schedule'` → `from '@/features/study-week'`.
3. Xóa `src/features/schedule/api/study-weeks.ts`.
4. Cập nhật `src/features/schedule/index.ts`: bỏ dòng `export * from './api/study-weeks';`.
5. Verify: `pnpm tsc --noEmit` và grep `from '@/features/schedule'` để chắc không còn nơi nào import `useStudyWeeksQuery` qua path cũ.

Cache key giữ nguyên `['schedule', 'study-weeks']` để không invalidate nhầm khi mutation chạy. (Đổi prefix sau, ở 1 PR riêng nếu cần dọn dẹp).

---

## 7. Cache & invalidation

### Cache keys

| Hook | Cache key |
|------|-----------|
| `useStudyWeeksQuery` | `['schedule', 'study-weeks']` *(giữ nguyên prefix `schedule` để không phá cache hiện có)* |
| `useStudyWeekQuery(weekUuid)` | `['schedule', 'study-weeks', weekUuid]` |
| `useLessonsQuery` | `['schedule', 'lessons']` *(toàn bộ — vì BE chưa có filter)* |
| `useLessonQuery(lessonUuid)` | `['schedule', 'lessons', lessonUuid]` |
| `useAttendancesByLessonQuery(lessonUuid)` | `['attendance', 'by-lesson', lessonUuid]` |
| `useRecordAttendancesByLessonQuery(lessonUuid)` | `['record-attendance', 'by-lesson', lessonUuid]` |
| `usePenaltiesByLessonQuery(lessonUuid)` | `['penalty', 'by-lesson', lessonUuid]` |

### Invalidation rules

| Mutation | Invalidate |
|----------|-----------|
| `createStudyWeek` | `['schedule', 'study-weeks']` + `['schedule', 'lessons']` *(vì BE tự sinh Lesson)* |
| `updateStudyWeek` | `['schedule', 'study-weeks']` + `['schedule', 'lessons']` *(BE xóa + sinh lại Lesson — xem Guide 6 §5.4)* |
| `deleteStudyWeek` | `['schedule', 'study-weeks']` + `['schedule', 'lessons']` + cảnh báo user về `Attendance`/`Penalty` mất theo |
| `updateLesson` | `['schedule', 'lessons']` + `['schedule', 'lessons', lessonUuid]` |
| `upsertAttendance` | `['attendance', 'by-lesson', lessonUuid]` |
| `upsertRecordAttendance` | `['record-attendance', 'by-lesson', lessonUuid]` |
| `upsertPenalty` / `deletePenalty` | `['penalty', 'by-lesson', lessonUuid]` |

### Optimistic update

- Inline edit `realLessonLength`: optimistic update. Rollback nếu mutation fail.
- Đổi trạng thái Attendance (select dropdown): optimistic. Vì có debounce 400ms, gom batch lại tối đa 1 request/cell.
- Tạo / xóa Penalty: **không** optimistic — cần ID server trả về.

---

## 8. Xử lý lỗi

| Tình huống | Hành xử |
|-----------|---------|
| `useStudyWeeksQuery` lỗi | Banner đỏ full-width + nút "Thử lại". Không render bảng. |
| `useStudyWeekQuery(weekUuid)` lỗi 404 | Empty state "Tuần học không tồn tại" + link quay lại list. |
| `useLessonsQuery` lỗi | Banner đỏ trong vùng bảng Lesson, list tuần vẫn render bình thường. |
| `createStudyWeek` fail vì `(weekNumber, schoolYear)` trùng | Toast đỏ với message BE: `Study week with weekNumber '20' and schoolYear '2026' already exists`. Modal vẫn mở. |
| `createStudyWeek` fail vì `endDate < startDate` | Inline error dưới field. |
| `updateLesson` fail vì `Lesson bi trung voi du lieu da ton tai` | Rollback optimistic + toast đỏ. |
| `deleteStudyWeek` fail | Modal confirm vẫn mở, hiện lỗi đỏ ở footer. |
| Mạng disconnect khi đang chấm Attendance | Debounce queue giữ pending state. Banner vàng "Mất kết nối" trên top. Reconnect → flush queue. |

---

## 9. Edge case

| Edge case | Hành xử |
|-----------|---------|
| Tuần chưa có `Lesson` nào | Detail view bảng Lesson empty state "Tuần này chưa có buổi học. Có thể TimetableTemplate chưa active." |
| Khối VDC/DGNL không có Lesson trong tuần | 5 button vẫn hiển thị (luôn 5 button), filter cho ra bảng rỗng + dòng "Khối VDC chưa có buổi học nào trong tuần này." |
| User truy cập URL `/grade/99` (gradeId không thuộc {1..5}) | Redirect về `/grade/1` (K10) + log warning. Không hiển thị empty state hỏng. |
| `real_lesson_length = 0` | Hiện chữ "Chưa diễn ra" thay vì "0'". |
| Lesson nằm ngoài range `week_start_date`/`week_end_date` *(không nên xảy ra, BE đã filter)* | Vẫn render, log warning console. |
| `lesson.grade.id` không thuộc {1..5} | Render dưới chip "Khác", log warning. |
| Lesson detail truy cập trực tiếp URL nhưng `lessonUuid` không thuộc `weekUuid` | Kiểm tra `lesson.study_week.week_uuid === weekUuid` sau khi load. Nếu lệch → redirect về tuần đúng + toast vàng. |
| User xóa StudyWeek trong khi đang ở Lesson detail của tuần đó | Sau mutation success → router navigate về `/admin-portal/study-weeks`. |
| Trùng `(weekNumber, schoolYear)` khi sửa | Validate client-side trước submit nếu list đã load; backup vẫn dựa vào BE response. |
| User tạo tuần ngoài năm hiện tại (vd 2030) | Cho phép. Không validate cross-year. |
| Lesson detail load Attendance mà BE chưa có endpoint | Render placeholder "API chưa sẵn sàng" + ẩn input. Không crash app. |

---

## 10. Hằng số đề xuất

```ts
// features/study-week/lib/constants.ts
export const ATTENDANCE_STATUS = {
  PRESENT: 'PRESENT',
  ABSENT_EXCUSED: 'ABSENT_EXCUSED',
  ABSENT_UNEXCUSED: 'ABSENT_UNEXCUSED',
  LATE: 'LATE',
  UNMARKED: 'UNMARKED',
} as const;

export const ATTENDANCE_STATUS_LABEL: Record<AttendanceStatus, string> = {
  PRESENT: 'Có mặt',
  ABSENT_EXCUSED: 'Vắng có phép',
  ABSENT_UNEXCUSED: 'Vắng không phép',
  LATE: 'Đi muộn',
  UNMARKED: 'Chưa điểm danh',
};

export const ATTENDANCE_DEBOUNCE_MS = 400;

export const WEEK_STATUS = {
  PAST: 'PAST',
  CURRENT: 'CURRENT',
  FUTURE: 'FUTURE',
} as const;

export const STUDY_WEEK_GRADE_IDS = [1, 2, 3, 4, 5] as const;
// ↑ 5 button = 5 grade đúng như DB. Không có "Tất cả". Khác với module Mẫu Thời Gian (chỉ [1,2,3] vì K12 gộp VDC/DGNL).
export type StudyWeekGradeId = (typeof STUDY_WEEK_GRADE_IDS)[number];
export const DEFAULT_STUDY_WEEK_GRADE_ID: StudyWeekGradeId = 1; // K10 — landing mặc định
```

---

## 11. Acceptance checklist

### Navbar & routing

- [ ] Navbar admin có mục "Tuần học" với icon `CalendarDays`, đặt sau "Thời Khóa Biểu".
- [ ] Click vào → đi tới `/admin-portal/study-weeks`.
- [ ] `paths.adminPortalStudyWeeks` + 3 path helper (`Detail`, `ByGrade`, `Lesson`) được khai báo trong `src/config/paths.ts`.
- [ ] 4 route lazy được khai báo trong `src/app/router.tsx` theo cấu trúc nested.
- [ ] `headerTitle` trong `admin-portal.tsx` cover được path mới.
- [ ] Vào `/admin-portal/study-weeks/:weekUuid` (không có gradeId) → redirect sang `/grade/1` (K10).
- [ ] Vào `/grade/99` → redirect về `/grade/1`.

### Danh sách tuần (accordion)

- [ ] Load `/api/v1/study-weeks` → render **dạng accordion**, mỗi tuần là 1 dropdown item.
- [ ] Sort `school_year` DESC, **`week_number` ASC**.
- [ ] Mỗi item header có: chevron (`▸`/`▾`), info tuần, status badge, menu `[⋮]`.
- [ ] Chevron animate xoay 90° khi expand/collapse.
- [ ] Click anywhere trên header (trừ `[⋮]`) → toggle expand. Panel mở animation max-height 200ms.
- [ ] Single-expand mode: mở tuần mới → tuần cũ tự đóng.
- [ ] Khi vào trang: tuần `CURRENT` được auto-expand. Nếu không có tuần CURRENT → tất cả collapsed.
- [ ] Panel expanded chứa 5 button khối + bảng Lesson (reuse `<study-week-detail>`).
- [ ] Search theo `week_number` hoạt động.
- [ ] Filter "năm học" lọc đúng.
- [ ] Status badge tính chính xác Past/Current/Future.
- [ ] Nút "+ Tạo tuần học" mở modal, submit thành công invalidate cả `study-weeks` và `lessons`.
- [ ] Modal Sửa prefill đúng, banner cảnh báo "sinh lại Lesson" hiển thị.
- [ ] Xóa tuần có confirm modal kèm cảnh báo dữ liệu liên quan.
- [ ] (Tùy chọn) Sync state expand qua search param `?week=<uuid>&grade=<id>`.

### Detail view

- [ ] Bảng Lesson chỉ hiển thị Lesson của tuần đang xem **+ đúng khối đang chọn** (filter client-side theo `study_week.week_uuid` AND `grade.id`).
- [ ] Sort theo `lesson_date` ASC rồi `lesson_start_time` ASC.
- [ ] 5 button K10 / K11 / K12 / VDC / DGNL hoạt động bằng NavLink (đổi URL, không state nội bộ).
- [ ] Active state đúng khối: nền màu khối + chữ trắng.
- [ ] Bảng có 4 cột (Ngày · Giờ · Loại buổi · Thời lượng) — **không có cột "Khối"** vì đã filter sẵn.
- [ ] Inline editor `realLessonLength`: Enter → PUT, ESC → hủy, optimistic update + rollback nếu fail.
- [ ] Empty state đúng khi khối không có Lesson nào.

### Lesson detail

- [ ] Tabs Attendance / RecordAttendance / Penalty render, lazy load nội dung tab khi click.
- [ ] Khi BE 3 module dữ liệu chưa sẵn sàng: hiển thị placeholder "API chưa sẵn sàng", không crash.
- [ ] Khi BE sẵn sàng: Attendance debounce 400ms khi đổi select, "Đánh dấu tất cả: Có mặt" bulk update.
- [ ] Penalty form modal tạo/sửa/xóa đầy đủ.

### Tổng quát

- [ ] `pnpm tsc --noEmit` pass.
- [ ] `pnpm lint` pass.
- [ ] Không phá cache hiện có của `period-form-modal.tsx` (vẫn dùng `useStudyWeeksQuery` được).
- [ ] Tested thủ công cả happy path lẫn 3 edge case quan trọng (tuần rỗng, BE 500, mutation race).

---

## 12. Phụ thuộc / tiền đề kỹ thuật

- **BE viết Guide cho 3 module Attendance/RecordAttendance/Penalty** trước khi merge phần tab Lesson detail. Hiện chỉ có Guide 6 (StudyWeek) và Guide 8 (Lesson).
- `openapi.ts` codegen mới nhất phải có:
  - `ResStudyWeekDTO`, `ResLessonDTO` ✅ verified.
  - DTO cho Attendance/RecordAttendance/Penalty ⚠️ pending.
- BE filter `?lessonId=` (hoặc tương đương) cho 3 endpoint mới. Nếu không có, phải lọc client-side toàn bộ → cần cân nhắc lại.
- `apiClient` đã unwrap `data` ([`src/lib/api-client.ts:47-48`](../src/lib/api-client.ts#L47-L48)) — các hook mới phải tuân thủ pattern này.
- `useGradesQuery()` đã có và cache `['curriculum', 'grades']` — không gọi lại endpoint Grade.

---

## 13. Mở rộng tương lai (out of scope plan này)

- Tạo / xóa Lesson thủ công với UI an toàn (check ràng buộc trước khi xóa).
- Drag-and-drop reschedule Lesson trong tuần.
- Bulk import Attendance từ CSV / file điểm danh tự động.
- Notification cho HS khi có Penalty mới.
- Báo cáo: tỷ lệ vắng theo khối, theo HS, theo tuần.
- View "Tuần học hiện tại" hard-coded trên dashboard tổng quan.
- Lock tuần đã qua (read-only) sau N ngày.

---

## 14. Câu hỏi mở (cần chốt với BE trước khi code)

1. Endpoint Attendance: path chính xác? Filter param? Có bulk-upsert hay chỉ single?
2. Schema Attendance enum: 5 trạng thái đã đề xuất ở mục 10 có khớp BE không?
3. RecordAttendance: "đối tượng không phải học sinh" là gì cụ thể? (Giáo viên dự giờ? Phụ huynh? Khách?)
4. Penalty: gắn theo `Student + Lesson` hay chỉ `Lesson`? Mức phạt có enum cố định không?
5. Có quyền role nào ngoài MANAGER được dùng module này không? (Mặc định plan này coi như chỉ MANAGER, dùng `<RoleGuard roleName="MANAGER" />` của route cha.)
6. ~~`useStudyWeeksQuery` nên ở `features/schedule` hay `features/study-week`?~~ **Đã chốt: Phương án 2 — move sang `features/study-week/`.** Xem mục 6 phần "Migration".
7. List view dùng accordion (mục 5.2): có giữ route L2 standalone (`/study-weeks/:weekUuid/grade/:gradeId`) làm deep-link không, hay bỏ luôn để accordion là entry point duy nhất? Đề xuất: **giữ** — nhẹ thêm 1 route nhưng cho phép share link tuần cụ thể.
8. State expand của accordion: giữ trong React state (refresh mất) hay sync qua URL search param `?week=<uuid>&grade=<id>` (refresh không mất, share link được)?

---

## 15. Cách deliver

1. Confirm 6 câu hỏi mở ở mục 14 với BE / tech lead.
2. Tạo skeleton: route + path + navbar entry (đo bằng cách click vào navbar thấy trang trống).
3. Implement List view (`study-weeks.tsx`) + CRUD modal — đây là phần có guide đầy đủ, làm trước.
4. Implement Detail view (`study-week-detail.tsx`) + inline edit `realLessonLength`.
5. Implement Lesson detail skeleton với 3 tab placeholder.
6. **Tạm dừng** chờ BE guide → khi sẵn, implement 3 tab.
7. Test thủ công checklist mục 11.
8. Báo lại + xin review.
