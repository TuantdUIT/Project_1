# Plan — Hiển thị nhân sự (từ DB) trên Timetable

> Dữ liệu phân công nhân sự **đã có sẵn trong database** dưới dạng `EmployeeRATemplate.items[]` (xem [Ghi chú domain](../guide/Ghi%20ch%C3%BA%20domain%20-%20EmployeeRATemplate-LessonEmployeeAssignment.md)). Plan này chỉ phụ trách **luồng đọc**: kéo dữ liệu đó về, gắn vào từng card của timetable, và hiển thị popover nhân sự khi rê chuột vào card.
>
> Luồng **ghi** (thêm / xoá / sửa nhân sự cho slot) tách thành plan kế tiếp khi user cung cấp đầy đủ các API còn lại.

---

## 1. Mục tiêu

- Manager mở trang Thời khóa biểu → thấy ngay mỗi slot có những ai phụ trách + khung giờ làm việc, không phải vào từng `lesson-detail`.
- Bám đúng nguồn dữ liệu DB: chỉ tiêu thụ `EmployeeRATemplate` qua endpoint đã chốt; không cache thủ công, không hardcode FE.
- Tách rõ pha "đọc" và pha "ghi" để không phụ thuộc các quyết định API còn lại.

## 2. Luồng dữ liệu

```
                     ┌──────────────────────────────┐
                     │  Database                     │
                     │  ├─ TimetableTemplate         │
                     │  └─ EmployeeRATemplate        │
                     │      └─ items[]               │
                     │         {lesson_type_uuid,    │
                     │          day_of_week,         │
                     │          start_time,          │
                     │          user_uuid + meta}    │
                     └────────────┬─────────────────┘
                                  │
              GET /api/v1/employee-ra-templates/timetable-template/{ttUuid}
                                  ▼
                     ┌──────────────────────────────┐
                     │  ResEmployeeRATemplateDTO     │
                     │   • employee_ra_template_uuid │
                     │   • timetable_template_uuid   │
                     │   • items: [...]              │
                     └────────────┬─────────────────┘
                                  │  FE build map theo key
                                  │  (lesson_type_uuid, day_of_week,
                                  │   start_time HH:mm)
                                  ▼
              ┌──────────────────────────────────────────┐
              │  Personnel-by-slot Map                    │
              │  Map<slotKey, ResEmployeeRATemplateItem[]>│
              └────────────┬─────────────────────────────┘
                           │  inject vào buildTimetableLayout →
                           │  TimetableCardLayout._personnel[]
                           ▼
              ┌──────────────────────────────────────────┐
              │  TimetableCard                            │
              │   • badge "👥 n"                          │
              │   • hover → <PersonnelPopover> kế bên     │
              │     liệt kê tên, vai trò, khung giờ       │
              └──────────────────────────────────────────┘
```

## 3. Phạm vi

### In scope
- Spinner **"Tuần học"** phía trên `TimetableFilterChips` (chuẩn bị cho pha sau; pha này chưa filter lesson theo tuần).
- Hook mới `useEmployeeRATemplateByTimetableTemplate(ttUuid)`.
- Mở rộng `useTimetableViewQuery` để build map nhân sự và inject vào `MergedTimetableItem._personnel`.
- Sửa `TimetableCard` thêm badge số nhân sự + render `PersonnelPopover` hover.

### Out of scope (chờ user cung cấp API tiếp)
- Thêm / xoá / sửa nhân sự cho slot.
- Mapping `Lesson` thật của tuần (chỉ cần khi pha sau cần biết "lesson đã sinh chưa").
- Phân biệt template-level (đã phân công sẵn) vs lesson-level (đã apply cho buổi cụ thể).
- Cơ chế re-sync template → `LessonEmployeeAssignment`.

## 4. API

### 4.1. Endpoint chốt (đã có)
`GET /api/v1/employee-ra-templates/timetable-template/{timetableTemplateId}`
→ `ResEmployeeRATemplateDTO` ([openapi.ts:1555-1586](../../src/types/openapi.ts#L1555-L1586))

Mỗi `ResEmployeeRATemplateItemDTO`:
```ts
{
  employee_ra_template_item_uuid: string;
  lesson_type_uuid: string;
  lesson_type_name: string;
  user_uuid: string;
  full_name: string;
  email?: string;
  role_name?: string;
  day_of_week: 'MONDAY' | ... | 'SUNDAY';
  start_time: string;   // 'HH:mm' hoặc 'HH:mm:ss'
  sort_order: number;
}
```

### 4.2. Endpoint phụ trợ (đã có sẵn ở codebase)
- `useTimetableViewQuery(primaryGradeId)` → trả templates per-grade kèm `timetable_template_uuid`.
- `useStudyWeeksQuery()` → list tuần cho spinner.

### 4.3. Endpoint ghi
TBD — user sẽ cung cấp ở plan kế tiếp. Pha này **không** gọi POST/PUT/DELETE.

## 5. Mapping rules

### Slot key
```
slotKey = `${lesson_type_uuid}|${day_of_week}|${normalizeHHmm(start_time)}`
```
- `normalizeHHmm`: dùng lại `parseHHmm + formatMinutes` trong [lib/time.ts](../../src/features/timetable-template/lib/time.ts#L34-L52) để BE trả `07:15` hay `07:15:00` đều khớp.

### Build map
```ts
const personnelBySlot = new Map<string, ResEmployeeRATemplateItemDTO[]>();
for (const item of raTemplate.items ?? []) {
  const key = makeSlotKey(item);
  const list = personnelBySlot.get(key) ?? [];
  list.push(item);
  personnelBySlot.set(key, list);
}
// sort theo sort_order asc khi gắn vào card
```

### Inject vào timetable
- Trong `useTimetableViewQuery`, sau khi resolve `templatesByGradeId`, dùng `useQueries` thêm 1 batch cho từng `timetable_template_uuid` → `EmployeeRATemplate`.
- Merge: với mỗi `MergedTimetableItem`, set `_personnel = personnelBySlot.get(makeSlotKey(item)) ?? []`.
- Slot không có nhân sự → `_personnel = []`; FE render badge `—`, không popover.

### Loại bỏ rác
- Item của `EmployeeRATemplate` không khớp slot nào trong `TimetableTemplate` (lệch `lesson_type` / `day_of_week` / `start_time`) → log warning, bỏ qua. Đúng nguyên tắc [§6 ghi chú domain](../guide/Ghi%20ch%C3%BA%20domain%20-%20EmployeeRATemplate-LessonEmployeeAssignment.md).

## 6. UI

### 6.1. Spinner Tuần học
- Vị trí: phía trên [`TimetableFilterChips`](../../src/features/timetable-template/components/timetable-filter-chips.tsx).
- Default: tuần chứa hôm nay theo `dayjs().isBetween(week_start_date, week_end_date, 'day', '[]')`. Fallback: tuần gần nhất (latest `week_start_date <= today`).
- Persist qua URL query param `?week=<week_uuid>` (`useSearchParams` của react-router).
- Label: `Tuần {week_number} ({format dd/MM/yyyy} → {format dd/MM/yyyy})`.

> Pha này **chưa dùng** giá trị tuần để filter dữ liệu (nhân sự là template-level, chung cho mọi tuần). Spinner xuất hiện sớm để chuẩn bị structure URL + state cho pha ghi sau này — pha sau sẽ dùng tuần để bind tới lesson thật.

### 6.2. TimetableCard — badge + popover

Card hiện tại ([timetable-card.tsx](../../src/features/timetable-template/components/timetable-card.tsx)) đang có 2 dòng: `HH:mm-HH:mm` + `lesson_type_name`. Thêm:

- **Dòng thứ 3 — badge nhân sự**: `👥 {n}` hoặc `—` khi `n === 0`. Đặt `bottom-1 right-1`, font `text-[10px]`, không vỡ layout compact.
- **Bọc card trong `group`** để dùng `group-hover:` cho popover.
- **`<PersonnelPopover>`**: absolute positioning kế bên card.

#### PersonnelPopover (mới)

```
absolute z-30 left-full ml-2 top-0   (mặc định bên phải)
                                       │
                                       └─ flip thành: right-full mr-2 top-0
                                          khi card nằm ở 2 cột cuối tuần
                                          (SATURDAY / SUNDAY tuỳ DAY_OF_WEEK_ORDER)

┌─────────────────────────────────────┐
│ Slot · Thứ 2 · 07:15 (45 phút)       │
│ Loại buổi · Đại số 12                 │
├─────────────────────────────────────┤
│ 👤 Nguyễn Văn A      [TEACHER]       │
│    Thời gian làm việc · 07:15 – 08:00 │
│ 👤 Trần Thị B        [TA]            │
│    Thời gian làm việc · 07:15 – 08:00 │
└─────────────────────────────────────┘
```

- **"Thời gian làm việc" = khung giờ slot** (`start_time` → `start_time + lesson_type.lesson_time`). Mọi nhân sự thuộc cùng slot có cùng khung giờ; không hỗ trợ giờ riêng per-nhân-sự ở pha này. Tận dụng sẵn `startLabel`/`endLabel` đã được tính trong [layout.ts:73-74](../../src/features/timetable-template/lib/layout.ts#L73-L74) — pass qua props popover.
- Hover behavior:
  - Hiện khi `mouseenter` card; ẩn khi `mouseleave` ra ngoài cả card + popover (popover `pointer-events-auto` để user còn dí chuột vào đọc).
  - Delay 120ms để tránh flicker khi rê chuột nhanh qua nhiều card chồng.
- Edge: card sát cạnh phải timetable → flip `right-full mr-2`. Detect đơn giản qua `card.dayIndex >= 5` (SATURDAY/SUNDAY trong [DAY_OF_WEEK_ORDER](../../src/features/timetable-template/lib/time.ts#L9-L17)).
- Edge: card sát đáy viewport → popover top-aligned mặc định ổn vì grid scrollable; không cần flip top/bottom.

### 6.3. View "Tất cả"
- `timetable-all-view.tsx` render nhiều grid theo grade → mỗi grade load `EmployeeRATemplate` riêng qua `useQueries` (N request song song, N = số `timetable_template_uuid` đang hiển thị).
- **Không dùng bulk endpoint** — bulk pattern (`?ids=...`) thuộc về luồng student, không phải non-student. React Query tự dedupe theo `queryKey` nên không gây trùng request giữa các grade trùng template; parallelism mặc định là đủ.

## 7. Component & hook — file thay đổi

### 7.1. File mới

#### `src/features/employee-ra-template/api/employee-ra-templates.ts`
- **Thay đổi**: Export `getEmployeeRATemplateByTimetableTemplateId(ttUuid)` (gọi `apiClient.get`) và hook `useEmployeeRATemplateByTimetableTemplate(ttUuid)` (`useQuery`, `queryKey = ['employee-ra-template', 'by-tt', ttUuid]`, `enabled: Boolean(ttUuid)`).
- **Ý nghĩa**: Cô lập lớp gọi mạng cho endpoint đã chốt §4.1. Đặt feature folder riêng (`employee-ra-template/`) để pha **ghi** sau này thêm mutation hook cùng chỗ, không phải refactor cấu trúc.

#### `src/features/employee-ra-template/lib/slot-key.ts`
- **Thay đổi**: Hàm `makeSlotKey({ lesson_type_uuid, day_of_week, start_time })` trả string `${lesson_type_uuid}|${day_of_week}|${HH:mm}` — dùng `parseHHmm + formatMinutes` của [lib/time.ts](../../src/features/timetable-template/lib/time.ts) để chuẩn hoá `start_time`.
- **Ý nghĩa**: 1 chỗ duy nhất sinh slot key cho cả nguồn `EmployeeRATemplate.items` và nguồn `MergedTimetableItem`, tránh mismatch lặng giữa `'07:15'` và `'07:15:00'`. Đặt ở `lib/` thay vì inline trong hook để pha ghi (cần derive cùng key khi PUT) dùng lại được.

#### `src/features/timetable-template/hooks/use-week-selection.ts`
- **Thay đổi**: Hook `useWeekSelection()` đọc/ghi `?week=<week_uuid>` qua `useSearchParams` của react-router; default tuần chứa hôm nay theo `dayjs().isBetween(week_start_date, week_end_date, 'day', '[]')`; fallback tuần latest `week_start_date <= today`. Return `{ selectedWeek, setSelectedWeekUuid, weeks, isLoading }`.
- **Ý nghĩa**: Single source of truth cho lựa chọn tuần. Tách hook riêng để cả `timetable-view` và `timetable-all-view` cùng chia state mà không cần lift lên parent.

#### `src/features/timetable-template/components/week-spinner.tsx`
- **Thay đổi**: Dropdown UI thuần (presentation), consume `useWeekSelection()`. Label hiển thị `Tuần {week_number} ({dd/MM} → {dd/MM})`. Disabled khi `isLoading`.
- **Ý nghĩa**: Component thuần, không tự fetch — giúp test snapshot dễ và sau này có thể thay bằng combobox / virtualized list nếu DB có >100 tuần.

#### `src/features/timetable-template/components/personnel-popover.tsx`
- **Thay đổi**: Component `PersonnelPopover` nhận `{ personnel, startLabel, endLabel, lessonTypeName, dayOfWeek, dayIndex }`; absolute positioning `left-full ml-2` mặc định, flip `right-full mr-2` khi `dayIndex >= 5` (T7/CN); show delay 120ms; `pointer-events-auto` để user rê vào đọc không bị tắt.
- **Ý nghĩa**: Logic flip + hover delay tách khỏi `TimetableCard` để card giữ vai trò "shell render slot" thuần. Khi pha ghi thêm modal/edit vào card, popover không cần đụng.

### 7.2. File sửa

#### [src/features/timetable-template/hooks/use-timetable-view-query.ts](../../src/features/timetable-template/hooks/use-timetable-view-query.ts)
- **Thay đổi**: Sau bước resolve `templatesByGradeId`, thêm `useQueries` thứ hai tải `EmployeeRATemplate` cho từng `timetable_template_uuid` đang active. Build `personnelBySlot: Map<slotKey, ResEmployeeRATemplateItemDTO[]>` (sort `sort_order asc` mỗi entry). Walk kết quả `mergeItemsForPrimary` và gắn `_personnel = personnelBySlot.get(makeSlotKey(item)) ?? []` cho mỗi `MergedTimetableItem`. Mở rộng `isLoading` / `isError` / `hasPartialError` để bao luôn các query mới.
- **Ý nghĩa**: Đây là chỗ duy nhất hợp nhất 2 nguồn (lịch + nhân sự) trước khi giao cho UI. Đặt mapping ở đây giữ `TimetableCard` thuần render, đồng thời cả `timetable-view` lẫn `timetable-all-view` thừa hưởng kết quả nhất quán — không có 2 đường tính khác nhau.

#### [src/features/timetable-template/types.ts](../../src/features/timetable-template/types.ts)
- **Thay đổi**: `MergedTimetableItem` thêm field `_personnel?: ResEmployeeRATemplateItemDTO[]` (đặt cạnh `_source_grade_id`, `_template_uuid`). `TimetableCardLayout` **không đổi** — card truy cập qua `card.item._personnel`.
- **Ý nghĩa**: Mở rộng schema FE-internal để layout/card biết slot có ai mà không cần thêm hook con. Quy ước `_` prefix báo rõ "field do FE bơm, không thuộc DTO gốc" — đồng bộ với pattern hiện có.

#### [src/features/timetable-template/lib/layout.ts](../../src/features/timetable-template/lib/layout.ts)
- **Thay đổi**: **Không sửa code**. Verify rằng `item` được giữ nguyên reference khi gắn vào `NormalizedCard` ([layout.ts:65](../../src/features/timetable-template/lib/layout.ts#L65)) → `card.item._personnel` truy cập được tự nhiên.
- **Ý nghĩa**: Document chủ ý "không sửa" để PR review không tốn công kiểm tra. Nếu sau này cần expose `card._personnel` (vd. khi sort lại theo nhân sự), thêm 1 dòng `_personnel: item._personnel` vào object push tại layout.ts:63-77.

#### [src/features/timetable-template/components/timetable-card.tsx](../../src/features/timetable-template/components/timetable-card.tsx)
- **Thay đổi**:
  - Bọc `<article>` ngoài cùng thêm class `group` để dùng `group-hover:` cho popover.
  - Sau 2 dòng `<p>` hiện có, thêm 1 dòng badge: `<span class="...">👥 {n}</span>` (hoặc `—` khi `n === 0`), absolute `bottom-1 right-1`, font `text-[10px]`.
  - Render `<PersonnelPopover ... />` con với props lấy từ `card.item._personnel`, `card.startLabel`, `card.endLabel`, `card.item.lesson_type_name`, `card.item.day_of_week`, `card.dayIndex`. Popover ẩn mặc định `opacity-0 pointer-events-none`, hiện qua `group-hover:opacity-100 group-hover:pointer-events-auto`.
- **Ý nghĩa**: Card là điểm chạm UX chính của plan. Tách 2 lớp rõ ràng: card lo render slot + badge tóm tắt, popover lo chi tiết khi user quan tâm. Không phá layout grid hiện hữu — chỉ thêm overlay con.

#### [src/features/timetable-template/components/timetable-view.tsx](../../src/features/timetable-template/components/timetable-view.tsx) và [timetable-all-view.tsx](../../src/features/timetable-template/components/timetable-all-view.tsx)
- **Thay đổi**: Insert `<WeekSpinner />` ngay phía trên `<TimetableFilterChips />` trong cả 2 nhánh (loading / error / success). Không truyền props (spinner tự đọc state qua `useWeekSelection`).
- **Ý nghĩa**: Đưa spinner vào layout từ pha đọc để URL state `?week=` có sẵn cho pha ghi (modal phân công sẽ cần biết tuần đang chọn để hiển thị tuần áp dụng). User cũng làm quen vị trí UI sớm, tránh bất ngờ khi pha sau gắn hành vi vào spinner.

## 8. Trình tự implement

| # | Bước | File chính | Phụ thuộc |
|---|---|---|---|
| 1 | `useWeekSelection` + `WeekSpinner` | use-week-selection.ts, week-spinner.tsx | useStudyWeeksQuery |
| 2 | Embed spinner vào `timetable-view.tsx` & `timetable-all-view.tsx` | 2 file trên | §1 |
| 3 | Hàm `makeSlotKey` + hook `useEmployeeRATemplateByTimetableTemplate` | slot-key.ts, employee-ra-templates.ts | openapi types |
| 4 | Mở rộng `useTimetableViewQuery`: load EmployeeRATemplate cho mỗi tt_uuid → build map → gắn `_personnel` | use-timetable-view-query.ts, types.ts | §3 |
| 5 | Sửa `TimetableCard` thêm badge `👥 n` | timetable-card.tsx | §4 |
| 6 | Tạo `PersonnelPopover` + wire hover (delay 120ms, flip theo dayIndex) | personnel-popover.tsx, timetable-card.tsx | §5 |
| 7 | Test thủ công: BE seed `EmployeeRATemplate` → badge đúng số; hover hiện đủ tên + giờ; slot trống hiện `—` không popover; sát cạnh phải popover flip trái | — | §1-6 |

## 9. Acceptance criteria

- [ ] Trang `/timetable/...` có spinner **Tuần học** phía trên chips chọn khối; default = tuần hôm nay; persist qua `?week=<uuid>`.
- [ ] Mỗi card render badge `👥 n` (hoặc `—`) đếm đúng số `EmployeeRATemplateItem` khớp slot.
- [ ] Hover card có nhân sự (≥1) → popover xuất hiện sau ~120ms, hiển thị đầy đủ: `full_name`, `role_name`, `start_time – end_time` cho từng nhân sự.
- [ ] Popover mặc định `left-full`, flip sang `right-full` khi `dayIndex >= 5` (T7 / CN).
- [ ] Rê chuột vào trong popover không khiến nó tự đóng (`pointer-events-auto`).
- [ ] Slot không có nhân sự (`_personnel = []`) → không hiện popover khi hover.
- [ ] Item của `EmployeeRATemplate` không khớp slot nào → bỏ qua + log warning, không vỡ UI.
- [ ] View `Tất cả` (`timetable-all-view`) cũng có spinner + badges + popover cho mọi grade.
- [ ] Pha này **không** gọi POST/PUT/DELETE bất kỳ.
- [ ] Type-check (`pnpm run lint`) và build (`pnpm run build`) pass.

## 10. Câu hỏi mở

1. **Hover delay**: 120ms ổn không, hay user muốn instant (0ms) / chậm hơn (300ms)?
2. **Mobile / touch**: không có hover → fallback bấm card để mở drawer tạm? Hay đẩy qua pha sau cùng modal ghi?
3. **Sort nhân sự trong popover**: theo `sort_order asc` (BE đang trả thế) hay theo role (TEACHER trước, TA sau, MANAGER cuối)?
4. **Cache invalidation** khi pha ghi xuất hiện sau: `queryKey` đề xuất `['employee-ra-template', 'by-tt', ttUuid]` — confirm trước khi merge.

### Đã chốt (không còn open)
- ~~Nhãn "Thời gian làm việc"~~ → **= khung giờ slot** (`start_time` → `start_time + lesson_type.lesson_time`); không có field per-nhân-sự.
- ~~Bulk endpoint cho multi-grade~~ → **không dùng**; bulk pattern thuộc luồng student. Multi-grade phát N request song song qua `useQueries`.

## 11. Tham chiếu

- Ghi chú domain: [Ghi chú domain - EmployeeRATemplate-LessonEmployeeAssignment.md](../guide/Ghi%20ch%C3%BA%20domain%20-%20EmployeeRATemplate-LessonEmployeeAssignment.md)
- Plan liên quan: [diem-danh-nhan-su.md](diem-danh-nhan-su.md)
- Code timetable:
  - [timetable-view.tsx](../../src/features/timetable-template/components/timetable-view.tsx)
  - [timetable-all-view.tsx](../../src/features/timetable-template/components/timetable-all-view.tsx)
  - [timetable-grid.tsx](../../src/features/timetable-template/components/timetable-grid.tsx)
  - [timetable-card.tsx](../../src/features/timetable-template/components/timetable-card.tsx)
  - [use-timetable-view-query.ts](../../src/features/timetable-template/hooks/use-timetable-view-query.ts)
  - [lib/time.ts](../../src/features/timetable-template/lib/time.ts), [lib/layout.ts](../../src/features/timetable-template/lib/layout.ts)
- Schema:
  - `ResEmployeeRATemplateDTO` / `ResEmployeeRATemplateItemDTO` — [openapi.ts:1555-1586](../../src/types/openapi.ts#L1555-L1586)
  - `ResTimetableTemplateDTO` — [openapi.ts:1101-1118](../../src/types/openapi.ts#L1101-L1118)
  - `ResStudyWeekDTO` — [openapi.ts:1141-1158](../../src/types/openapi.ts#L1141-L1158)
