# Plan — Mẫu Thời Gian (Timetable Template Viewer)

> Thêm 1 mục navbar mới **"Mẫu Thời Gian"** trong admin portal, hiển thị grid lịch tuần theo từng grade (K10, K11, K12) dựa trên dữ liệu `timetable-template` của BE.
>
> Module này **chỉ đọc** (view-only) — không sửa template. CRUD template sẽ làm trong plan riêng sau.

---

## 1. Mục tiêu

- Manager xem nhanh được khung lịch học chuẩn của từng khối (K10/K11/K12) dưới dạng lịch tuần trực quan.
- Khối K12 hiển thị bao gồm cả lớp luyện VDC và DGNL (chúng là grade ảo trong DB, FE ghép logic-side).
- Navbar chỉ có **1 mục** "Mẫu Thời Gian" link tới `/admin-portal/timetable`.
- Filter chuyển sang **chips inline** ngay trên grid: Tất cả · Khối 10 · Khối 11 · Khối 12 (Bao gồm VDC và DGNL).
- Hardcode quan hệ supplement dùng **gradeID** (K10=1, K11=2, K12=3, VDC=4, DGNL=5).

## 2. Phạm vi

### In scope
- Feature module mới: `features/timetable-template/` (view-only).
- 4 route: `/admin-portal/timetable/all`, `/admin-portal/timetable/grade/1` (K10), `/admin-portal/timetable/grade/2` (K11), `/admin-portal/timetable/grade/3` (K12).
- Component grid lịch tuần 7 cột (THỨ 2 → CHỦ NHẬT), trục dọc là giờ, mỗi buổi học là 1 card.
- Hover card: chuyển từ filled sang outlined kèm hiệu ứng blur.
- Map màu theo `lesson_type_name` (string match) với fallback xám.
- Badge nhỏ trên mỗi card hiển thị grade nguồn (`K12`/`VDC`/`DGNL`) — phục vụ phân biệt buổi chính/phụ trong view K12.
- View "Tất cả": render **3 section riêng** (K10, K11, K12) xếp dọc. **Không hiển thị VDC/DGNL riêng** vì chúng đã được tích hợp vào K12.
- Filter chips inline: NavLink + URL routing, không state nội bộ.

### Out of scope
- Tạo / sửa / xóa template (CRUD).
- Tạo / sửa / xóa item trong template.
- Chọn tuần / xem ngày cụ thể (không cần — template áp dụng cả năm).
- Drag-and-drop reschedule.
- Print / export PDF.
- Endpoint `/student/me` (dành cho học sinh — thuộc plan student-side sau).
- Permission chi tiết (mặc định MANAGER).

---

## 3. Endpoint cần wire

| # | Method | Path | Hook FE (đề xuất) | Mục đích |
|---|--------|------|---------|----------|
| 1 | GET | `/api/v1/timetable-templates/grade-id/{gradeId}` | `useTemplateByGradeIdQuery(gradeId)` | View per-grade (K10/K11/K12) |
| 2 | GET | `/api/v1/timetable-templates` | `useTimetableTemplatesQuery()` | View "Tất cả" |
| 3 | GET | `/api/v1/grades` | `useGradesQuery()` (đã có) | Map grade name → gradeId tại runtime |
| 4 | GET | `/api/v1/lesson-types` | `useLessonTypesQuery()` (đã có) | Lấy `lesson_time` để tính duration |

**Lưu ý quan trọng**: với K12, phải gọi **3 endpoint song song** (K12 + VDC + DGNL) rồi merge client-side. Xem mục 5.

## 4. Cấu trúc dữ liệu (từ openapi.ts sau codegen mới nhất)

```ts
ResTimetableTemplateDTO {
  timetable_template_uuid: string
  timetable_template_name: string
  grade: ResGradeDTO          // { id, name, studentsInPeriodCount }
  school_year: number
  apply_from: string
  active: boolean
  items: ResTimetableTemplateItemDTO[]
}

ResTimetableTemplateItemDTO {
  timetable_template_item_uuid: string
  lesson_type_uuid: string
  lesson_type_name: string
  day_of_week: "MONDAY" | "TUESDAY" | ... | "SUNDAY"
  start_time: string          // "HH:mm:ss"
  sort_order: number
  // KHÔNG có end_time, duration, source_grade_name → FE tự gắn
}

ResLessonTypeDTO {
  lesson_type_uuid: string
  lesson_type_name: string
  lesson_time: number         // PHÚT
}

ResGradeListDTO {
  totalActiveStudents: number
  grades: ResGradeDTO[]       // bao gồm K10/K11/K12 + VDC/DGNL (5 grade)
}
```

## 5. Hardcode quan hệ grade → supplement

File `features/timetable-template/lib/supplement-grades.ts`:

```ts
// Quan hệ "khối chính ⇐ khối ảo cần ghép vào view".
// Hardcode dùng gradeID. Khi nghiệp vụ đổi (thêm grade ảo, đổi mapping), sửa duy nhất file này.
export const PRIMARY_GRADE_IDS = [1, 2, 3] as const;        // K10, K11, K12
export type PrimaryGradeId = (typeof PRIMARY_GRADE_IDS)[number];

export const SUPPLEMENT_GRADE_IDS_BY_PRIMARY_ID: Record<PrimaryGradeId, readonly number[]> = {
  1: [],          // K10
  2: [],          // K11
  3: [4, 5],      // K12 → VDC (4) + DGNL (5)
};

export const GRADE_DISPLAY_NAME_BY_ID: Record<number, string> = {
  1: 'Khối 10', 2: 'Khối 11', 3: 'Khối 12', 4: 'VDC', 5: 'DGNL',
};

export const GRADE_BADGE_BY_ID: Record<number, string> = {
  1: 'K10', 2: 'K11', 3: 'K12', 4: 'VDC', 5: 'DGNL',
};
```

Tên grade trong DB (cross-reference, không dùng để filter): K10/K11/K12/VDC/DGNL exact match, không dấu. ID khớp theo thứ tự `id ASC` của bảng `grade`.

## 6. Quy trình dữ liệu

### View K10/K11/K12

```
Bước 1: Lấy danh sách grade (cache key ['curriculum','grades'])
Bước 2: Lấy gradeId của khối chính + các khối phụ theo SUPPLEMENT_GRADE_NAMES_BY_PRIMARY
Bước 3: useQueries() gọi song song N endpoint /grade-id/{id}
        - K10/K11: N=1
        - K12: N=3 (K12 + VDC + DGNL)
Bước 4: Lấy lesson types (cache key ['curriculum','lesson-types'])
Bước 5: Merge items từ N response, gắn _source_grade_name = grade.name của template gốc
Bước 6: Join với lesson_time để tính duration mỗi item
Bước 7: Build CardLayout[] (topPx, heightPx, leftPercent, widthPercent với overlap)
Bước 8: Render grid + cards + badge
```

### View "Tất cả"

```
Bước 1: Gọi /api/v1/timetable-templates (1 request)
Bước 2: Filter templates.filter(t => t.active === true)
Bước 3: Build Map<gradeId, template>
Bước 4: Với mỗi primaryId in PRIMARY_GRADE_IDS (= [1, 2, 3]):
        - Gọi mergeItemsForPrimary(primaryId, mapTemplates) từ lib/merge-supplement.ts
        - Render 1 section với title gradeDisplayName(primaryId)
Bước 5: VDC, DGNL KHÔNG render section riêng (đã merge vào K12)
```

→ 3 section: Khối 10, Khối 11, Khối 12 (Bao gồm VDC và DGNL). VDC/DGNL biến mất khỏi view này.

### Share util — `lib/merge-supplement.ts`

Logic merge "K12 + VDC + DGNL → section K12 với badge" chạy ở **2 nơi**:
- Per-grade view K12 (`/timetable/grade/3`).
- Section K12 trong view "Tất cả" (`/timetable/all`).

Tách thành 1 hàm `mergeItemsForPrimary(primaryId, templatesById)` để cả 2 view import dùng chung. Khi đổi logic merge (vd đổi cách gắn badge) → sửa 1 chỗ duy nhất.

## 7. UI spec

### Navbar
- 1 NavLink duy nhất "Mẫu Thời Gian" link tới `paths.adminPortalTimetable` (`/admin-portal/timetable`).
- Icon: `CalendarRange` (lucide-react).
- Active state khi `location.pathname.startsWith('/admin-portal/timetable')`.
- Default landing khi vào `/admin-portal/timetable`: redirect sang `/admin-portal/timetable/all`.

### Filter chips (inline trên grid)
- Component `<TimetableFilterChips />` đặt ở đầu trang, **sticky** khi user scroll grid.
- 4 chip hình chữ nhật bo tròn (`rounded-xl`), gap 12px:
  - "Tất cả" → `/admin-portal/timetable/all`
  - "Khối 10" → `/admin-portal/timetable/grade/1`
  - "Khối 11" → `/admin-portal/timetable/grade/2`
  - "Khối 12 (Bao gồm VDC và DGNL)" → `/admin-portal/timetable/ grade/3`
- Chip active: nền `#1870FF`, chữ trắng. Inactive: viền `slate-300`, hover viền `#1870FF`.
- Implement bằng `<NavLink>` (URL routing), không state nội bộ.

### Grid layout
- 8 cột: 1 cột nhãn giờ (60px) + 7 cột thứ 2 → CN (1fr × 7).
- Header sticky top: chỉ "THỨ 2" → "CHỦ NHẬT", **không có số ngày**.
- Trục dọc: render từ giờ sớm nhất → muộn nhất của items thực tế, bo tròn lên/xuống giờ tròn. Fallback 06:00 → 22:00.
- `HOUR_HEIGHT_PX = 80` (lesson 90 phút = 120px).
- Container `overflow-y: auto`, scroll dọc trong nội bộ grid.
- Đường kẻ ngang 30 phút mỏng + 1h đậm.

### Card buổi học
- `position: absolute`, `top = topPx`, `height = heightPx`, vị trí left/width theo `dayIndex` (+overlap chia đều).
- Padding `8px 10px`, `border-radius: 12px`.
- Nội dung:
  - Dòng 1: `HH:mm - HH:mm` (font nhỏ, opacity 80%).
  - Dòng 2: `lesson_type_name` (font đậm).
  - Badge góc trên-phải: `_source_grade_name` (K10/K11/K12/VDC/DGNL) — chữ rất nhỏ, nền semi-transparent.
- 2 trạng thái style:
  - **Default (filled)**: nền màu filled tương ứng `lesson_type_name`, chữ trắng. Badge nền `rgba(255,255,255,0.18)` chữ trắng.
  - **Hover (outlined + blur)**: nền trắng, viền 2px màu outlined, chữ outlined. Badge nền nhạt theo màu outlined. `backdrop-filter: blur(4px)` + transition 150ms.

### Bảng màu (match theo `lesson_type_name`, case-insensitive)

| Lesson type name | Filled background | Outlined border + text |
|---|---|---|
| Đại số (DS) | `#1E3FD6` | `#3B82F6` |
| Đại số 12 (DS12) | `#7C3AED` | `#A78BFA` |
| Hình học (HH) | `#0891B2` | `#22D3EE` |
| DGNL (DG) | `#EA580C` | `#FB923C` |
| VDC | `#DC2626` | `#F87171` |
| **Fallback** (tên không match) | `#64748B` (slate-500) | `#94A3B8` (slate-400) |

Logic match:
- Chuẩn hóa `name.trim()`, so sánh case-insensitive.
- Match `DS12` / "Đại số 12" trước `DS` / "Đại số" (tránh DS12 bị bắt nhầm sang nhánh DS).
- Regex test gợi ý: `/đại số 12|^ds12$/i`, `/đại số|^ds$/i`, `/hình học|^hh$/i`, `/dgnl|^dg$/i`, `/vdc/i`.

### View "Tất cả" — 3 section riêng (K12 đã merge)

```
┌─────────────────────────────────────┐
│ [Filter chips: Tất cả|K10|K11|K12]  │  ← sticky
├─────────────────────────────────────┤
│ Khối 10                              │
│ [mini-grid items K10]                │
├─────────────────────────────────────┤
│ Khối 11                              │
│ [mini-grid items K11]                │
├─────────────────────────────────────┤
│ Khối 12 (Bao gồm VDC và DGNL)        │
│ [mini-grid items K12 + VDC + DGNL]   │
│ (cards có badge K12/VDC/DGNL)        │
└─────────────────────────────────────┘
```

Mỗi mini-grid:
- Cùng `<TimetableGrid />` component, prop `compact={true}` (`HOUR_HEIGHT_PX = 50`).
- Section K12 **không hide badge** (để phân biệt VDC/DGNL với K12 chính). Section K10/K11 có thể hide badge vì single source.
- Lọc `t.active === true` trước khi render.
- VDC, DGNL **không** render thành section riêng.

## 8. Cấu trúc file đề xuất

```
src/features/timetable-template/
├── api/
│   └── templates.ts                  # getTemplateByGradeId + getTimetableTemplates + hooks
├── components/
│   ├── timetable-filter-chips.tsx    # 4 chip sticky inline (NavLink)
│   ├── timetable-view.tsx            # View per-grade K10/K11/K12, render chips + grid
│   ├── timetable-all-view.tsx        # View "Tất cả", 3 section (K12 merged)
│   ├── timetable-grid.tsx            # Grid 7 cột render items
│   ├── timetable-card.tsx            # 1 card buổi học (hover/blur, badge)
│   ├── timetable-hour-axis.tsx       # Trục giờ bên trái
│   ├── timetable-header.tsx          # Header THỨ 2 → CN
│   └── partial-error-banner.tsx     # Banner cảnh báo khi 1+ call lỗi
├── hooks/
│   └── use-timetable-view-query.ts   # Hook parallel queries cho per-grade view (K10/K11/K12)
├── lib/
│   ├── supplement-grades.ts          # Hardcode gradeID map + display name + badge
│   ├── merge-supplement.ts           # SHARE UTIL: mergeItemsForPrimary(primaryId, mapTemplates)
│   ├── color-map.ts                  # getLessonTypeStyle(name) → { filled, outlined }
│   ├── layout.ts                     # buildTimetableLayout
│   └── time.ts                       # parseHHmm, formatMinutes, dayOfWeekIndex, constants
├── types.ts                          # MergedTimetableItem, CardLayout, ...
└── index.ts                          # barrel exports
```

Route mới ở `src/app/routes/admin/`:
- `timetable.tsx` (layout cha, xử lý redirect mặc định sang `/all`)
- `timetable-all.tsx` (view tất cả)
- `timetable-by-grade.tsx` (đọc `useParams().gradeId`, render `<TimetableView />`)

## 9. Cache & invalidation

Cache keys:
- `['timetable-template', 'all']` cho `useTimetableTemplatesQuery`.
- `['timetable-template', 'by-grade-id', <gradeId>]` cho mỗi `useTemplateByGradeIdQuery`. Có N cache key (1 cho mỗi grade gọi tới).
- `['curriculum', 'lesson-types']` đã có.
- `['curriculum', 'grades']` đã có.

Cache share:
- VDC/DGNL được dùng ở K12 view → cache hit khi user quay lại K12 sau khi đã mở.
- K10/K11 không share VDC/DGNL cache (vì không gọi tới).
- View "Tất cả" có cache riêng, không share với 4 view kia.

Invalidation (cho plan CRUD template tương lai):
- Mutation create/update/delete template → invalidate `['timetable-template']` (broad pattern, dọn cả 2 nhánh).
- Đặc biệt: nếu sửa template VDC, phải đảm bảo K12 view cũng refetch → broad invalidate đã lo.

## 10. Xử lý lỗi

### View K10/K11
- 1 endpoint. Lỗi → banner đỏ + nút "Thử lại". Đơn giản.

### View K12 (3 parallel call)
- Sử dụng `useQueries`. Mỗi result có `data` / `isLoading` / `error` riêng.
- Phương án xử lý: **(ii) render từng phần**.
  - Nếu **cả 3 lỗi** → banner đỏ chiếm full grid + nút Thử lại.
  - Nếu **K12 chính lỗi nhưng VDC/DGNL OK** → vẫn render VDC/DGNL items + banner vàng `⚠ Không tải được TKB Khối 12. <button>Tải lại</button>`.
  - Nếu **VDC hoặc DGNL lỗi** → render K12 (và VDC nếu DGNL lỗi, ngược lại) + banner vàng cho phần lỗi.
- Component `<PartialErrorBanner>` xử lý logic này.

### View "Tất cả"
- 1 endpoint. Lỗi → banner đỏ + nút Thử lại.

## 11. Edge case

| Edge case | Hành xử |
|---|---|
| Grade chưa có template `active` | Section/grid empty state: "Khối <name> chưa có mẫu thời gian." |
| Template `items=[]` | Grid hiển thị trục giờ trống + dòng chữ "Chưa có buổi học nào." |
| Item có `lesson_type_uuid` không match `ResLessonTypeDTO` | Duration fallback 60 phút. Style fallback slate. Log warning console. |
| 2 item cùng day + start_time + duration giống hệt | Dedupe theo `timetable_template_item_uuid` (giữ cái đầu, log warning). |
| 2 item cùng day, overlap thời gian | Chia chiều rộng cột đều theo N item overlap, sort theo `start_time` rồi `sort_order`. |
| Item `day_of_week` ngoài enum | Bỏ qua, log warning. |
| `start_time` sai format HH:mm:ss | Bỏ qua, log warning. |
| `lesson_type_name` rỗng | Style fallback xám, dòng 2 = "—". |
| Grade VDC/DGNL không tồn tại trong DB (response `/grades` không có) | Bỏ qua supplement đó cho K12 view, log warning. |
| `useGradesQuery` chưa load xong khi user mở K12 view | Show loading skeleton; sau khi xong mới trigger parallel calls. |
| 1 trong N call K12 view fail | Theo mục 10 — render partial + banner vàng. |

## 12. Hằng số đề xuất

```ts
export const HOUR_HEIGHT_PX = 80;              // grid chính
export const COMPACT_HOUR_HEIGHT_PX = 50;      // mini-grid trong view "Tất cả"
export const GRID_FALLBACK_START_HOUR = 6;
export const GRID_FALLBACK_END_HOUR = 22;
export const DEFAULT_LESSON_DURATION_MINUTES = 60;
export const DAY_OF_WEEK_ORDER = [
  'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY',
] as const;
export const DAY_OF_WEEK_LABEL = {
  MONDAY: 'THỨ 2',
  TUESDAY: 'THỨ 3',
  WEDNESDAY: 'THỨ 4',
  THURSDAY: 'THỨ 5',
  FRIDAY: 'THỨ 6',
  SATURDAY: 'THỨ 7',
  SUNDAY: 'CHỦ NHẬT',
} as const;
```

## 13. Acceptance checklist

- [ ] Navbar có mục "Mẫu Thời Gian" với 4 nút phẳng: Tất cả, Khối 10, Khối 11, Khối 12 (Bao gồm VDC và DGNL).
- [ ] Vào `/admin-portal/timetable` redirect sang `/admin-portal/timetable/all`.
- [ ] View K10 / K11: 1 call `/grade-id/{id}`, render grid đúng. Items có badge nhỏ "K10"/"K11".
- [ ] View K12: 3 call parallel (K12 + VDC + DGNL). Items có badge "K12"/"VDC"/"DGNL".
- [ ] View "Tất cả": 1 call `/timetable-templates`, render 5 section riêng xếp dọc.
- [ ] Header chỉ "THỨ 2" → "CHỦ NHẬT", không số ngày.
- [ ] Trục giờ tự co theo data; mỗi card đúng `topPx` và `heightPx`.
- [ ] Card hiển thị "HH:mm - HH:mm" + lesson_type_name + badge grade nguồn.
- [ ] Màu card khớp bảng màu, fallback xám cho lesson_type ngoài 5 mục.
- [ ] Hover card → outlined + blur, transition 150ms.
- [ ] Overlap xếp side-by-side, chia chiều rộng đều.
- [ ] K12 view: 1 trong 3 call lỗi → render phần thành công + banner vàng phần lỗi + nút "Tải lại".
- [ ] K12 view: cả 3 call lỗi → banner đỏ full + nút "Tải lại".
- [ ] Empty state đúng: grade chưa có template, items rỗng.
- [ ] Đổi grade → grid refetch hoặc lấy cache, không leak state grade cũ.
- [ ] TypeScript: `pnpm tsc --noEmit` pass.
- [ ] Lint: `pnpm lint` pass.

## 14. Phụ thuộc / tiền đề kỹ thuật

- `openapi.ts` đã có sau codegen: `ResTimetableTemplateDTO`, `ResTimetableTemplateItemDTO`, `ResLessonTypeDTO`, `ResGradeListDTO`, `ResGradeDTO`, operation `getCurrentTimetableTemplateByGradeId`, `getAllTimetableTemplates`. **Đã verified**.
- BE `GET /api/v1/timetable-templates/grade-id/{gradeId}` phải trả `items` nhúng đầy đủ (không phải mảng rỗng). **Cần test thực tế** với gradeId K12 trước khi viết hook.
- Tên grade chính xác trong DB: `K10`, `K11`, `K12`, `VDC`, `DGNL` (không dấu). Đã chốt.
- Tên lesson_type chính xác trong DB phải khớp 5 entry bảng màu hoặc fallback xám. Có thể cần điều chỉnh regex match theo thực tế DB.

## 15. Mở rộng tương lai (out of scope plan này)

- CRUD template (form thêm/sửa item, drag-and-drop).
- Highlight buổi đang diễn ra theo giờ thật.
- Chọn tuần cụ thể + đối chiếu Period thực sinh từ template.
- Print / export PDF.
- Migration sang phương án B (BE merge endpoint) khi scope grade ảo phình ra.
- BE bổ sung `color_code` cho lesson_type → bỏ map theo string.
- Student-side view dùng `GET /api/v1/timetable-templates/student/me`.

## 16. Cách deliver

1. Tạo feature module `features/timetable-template/` đầy đủ theo cấu trúc mục 8.
2. Thêm 4 route + NavLink trong admin portal.
3. Test thủ công các trường hợp ở mục 13 trên trình duyệt.
4. Báo lại + xin review.
