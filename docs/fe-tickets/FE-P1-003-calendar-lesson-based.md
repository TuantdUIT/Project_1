# FE-P1-003 — Calendar thời khóa biểu chuyển sang nguồn LESSON (week-aware)

**Ngày:** 2026-06-13
**Loại:** Đổi nguồn dữ liệu (data source) — sửa lỗi hiển thị sai theo tuần + mất nhân sự + banner lỗi giả
**Khu vực:** Management Services → Admin Portal → Thời Khóa Biểu (calendar)

---

## 1. Vấn đề

Lưới calendar (admin-portal/timetable) đọc từ **timetable template (live)**, gây 3 lỗi:

1. **Sai giờ theo tuần.** Đổi giờ template (vd DGNL, apply_from = 7/6) → tuần cũ (Chủ Nhật 31/5) trên calendar **cũng đổi theo**, dù thẻ tuần học (lesson frozen) vẫn đúng.
2. **Mất nhân sự.** Nhân sự ghép qua slot key `lessonType|day|startTime` — lệch giờ là rớt.
3. **Banner lỗi giả/thật.** `getTemplateByGradeId(grade-id/5)` lỗi (apply_from tương lai, hoặc backend trục trặc) → banner "Không tải được TKB DGNL", kể cả khi data cache vẫn hiển thị.

---

## 2. Nguyên nhân gốc

Calendar và thẻ tuần học dùng **hai nguồn khác nhau**:

| | Nguồn cũ của calendar | Thẻ tuần học |
|---|---|---|
| API | `getTemplateByGradeId(id)` / `buildTemplatesByGradeId` | `GET /api/v1/lessons` |
| Lọc theo tuần | ❌ Không (WeekSpinner chỉ trang trí) | ✅ `week_uuid === ...` |
| Giờ | `item.start_time` (template live, mới nhất) | `lesson_start_time` (frozen) |
| Nhân sự | RA template + slot matching (live) | `employee_assignments` (frozen) |
| Tôn trọng apply_from | ❌ | ✅ (gián tiếp, lesson đã gate lúc sinh) |

Backend gate apply_from **đúng ở tầng sinh lesson** (API Guide 6, dòng 181-185: chọn template `applyFrom <= week_start_date`). Nhưng calendar **không đọc lesson** → bỏ qua cả apply_from lẫn tuần → hiển thị template mới nhất cho mọi tuần.

---

## 3. Thay đổi đã thực hiện

Đổi nguồn lưới calendar từ **template** → **lesson của tuần đang chọn**.

### File

| File | Thay đổi |
|---|---|
| `timetable-template/hooks/use-lessons-week-view-query.ts` | **Mới** — hook + pure builder `buildLessonWeekItems`: lọc lesson theo tuần + (khối chính & phụ), map sang `MergedTimetableItem` (giờ frozen + `employee_assignments`) |
| `timetable-template/components/timetable-view.tsx` | Dùng `useWeekSelection` + `useLessonsWeekViewQuery`; bỏ `useTimetableViewQuery` và `PartialErrorBanner` |
| `timetable-template/components/timetable-all-view.tsx` | Dùng `useLessonsQuery` + `useWeekSelection` + `buildLessonWeekItems` trong vòng lặp PRIMARY_GRADE_IDS; bỏ template/RA/personnel queries |

### Cốt lõi (hook mới)

```ts
// Lesson → item lưới: giờ frozen + nhân sự frozen, KHÔNG slot matching
function lessonToItem(lesson) {
  day_of_week  = dayOfWeekFromDate(lesson.lesson_date)
  start_time   = lesson.lesson_start_time            // frozen theo tuần
  _personnel   = lesson.employee_assignments.map(...) // frozen, không slot key
}

buildLessonWeekItems(lessons, weekUuid, primaryId):
  lọc study_week.week_uuid === weekUuid && grade.id ∈ [primary, ...supplements]
```

---

## 4. Lý do & kết quả

| Lỗi cũ | Sau khi đổi |
|---|---|
| Tuần cũ sai giờ | ✅ Đúng — đọc `lesson_start_time` frozen theo từng tuần |
| Mất nhân sự khi lệch slot | ✅ Hết — đọc `employee_assignments`, bỏ slot matching |
| Banner lỗi `grade-id/{id}` | ✅ Hết — không gọi `getTemplateByGradeId` / RA template nữa |
| WeekSpinner chỉ trang trí | ✅ Đổi tuần → đổi data thật (week-aware) |

Calendar giờ **nhất quán** với thẻ tuần học (cùng nguồn lesson).

---

## 5. Đánh đổi

- Calendar chỉ vẽ tuần **đã tạo study-week** (đã có lesson). Tuần tương lai chưa tạo → trống (đúng nghiệp vụ — chưa có buổi học thực tế).
- Calendar không còn phản ánh thay đổi template tức thì. Muốn tuần nhận giờ/nhân sự mới → tạo (hoặc tạo lại) study-week của tuần đó (xem [[FE-P1-002]]).

---

## 6. Phạm vi

- **Trong phạm vi:** admin-portal calendar (`timetable-view`, `timetable-all-view`).
- **Ngoài phạm vi:** trang lịch học sinh `app/schedule.tsx` vẫn dùng `useTimetableViewQuery` (template-based) — không đổi trong ticket này.

---

## 7. Kiểm tra

- `npx tsc --noEmit` → không lỗi.
- Đổi tuần ở WeekSpinner → lưới đổi theo dữ liệu lesson của tuần đó.
- Tuần cũ hiển thị đúng giờ frozen; tuần mới hiển thị giờ mới — khớp thẻ tuần học.
- Không còn banner "Không tải được TKB DGNL".

---

## 8. Liên quan

- [[FE-P1-002]] — study-week lesson đọc `employee_assignments` (cùng triết lý frozen).
- Domain: `docs/guide/Ghi chú domain - EmployeeRATemplate-LessonEmployeeAssignment.md`.
- Backend gate apply_from: `docs/guide/API Guide 6 - Study Week.md` (dòng 181-197).
