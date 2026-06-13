# FE-P1-005 — Cảnh báo xung đột khi sửa template (chồng giờ & double-booking)

**Ngày:** 2026-06-13
**Loại:** Tính năng mới (FE) — validate/cảnh báo
**Khu vực:** Management Services → Tổng hợp template (Timetable template + RA template)

---

## 1. Vấn đề

Trước đây 2 template không có cơ chế cảnh báo:
- **A.** Đổi/thêm giờ tiết có thể **chồng giờ** với tiết khác cùng ngày — hệ thống im lặng nhận (layout chỉ vẽ side-by-side).
- **B.** Gán nhân sự có thể tạo **double-booking** (cùng người, 2 slot cùng ngày giao giờ) — không bị chặn.

Backend cũng không validate 2 trường hợp này (chỉ check unique key / non-student / khớp slot).

---

## 2. Thay đổi

| File | Loại | Vai trò |
|---|:---:|---|
| `timetable-template/lib/slot-overlap.ts` | 🆕 | A — `findTimetableOverlaps`, `buildDurationByLessonType`, `intervalsOverlap` (dùng chung) |
| `timetable-template/components/timetable-template-detail-modal.tsx` | ✏️ | A — cảnh báo chồng giờ + xác nhận khi Lưu |
| `employee-ra-template/lib/availability.ts` | 🆕 | B — `findPersonnelConflicts` (import `intervalsOverlap`) |
| `employee-ra-template/components/ra-template-detail-modal.tsx` | ✏️ | B — cảnh báo double-booking + xác nhận khi Lưu |

Cả hai modal tái dùng `useLessonTypesQuery` (curriculum) để lấy `lesson_time` = thời lượng tiết → tính `[start, start+duration)`.

---

## 3. Cơ chế (theo lựa chọn đã chốt)

### A — Chồng giờ (timetable)
- Tính trên **giờ đang sửa** (`itemTimes`), không phải giờ gốc.
- Hai tiết cùng `day_of_week` có `[start, start+duration)` giao nhau → cảnh báo.
- **Không chặn cứng:** hiện cảnh báo amber liệt kê cặp chồng; khi Lưu mà còn chồng → banner "Vẫn lưu?" (xác nhận 1 lần).

### B — Double-booking (RA template)
- Phạm vi: **trong cùng RA template** (1 khối). Chưa quét cross-grade.
- Cùng một `userUuid` gán cho 2 slot cùng ngày, khoảng giờ giao nhau → cảnh báo "X bị trùng lịch".
- Cùng cơ chế xác nhận khi Lưu như A.

### Logic dùng chung
`intervalsOverlap(aStart, aEnd, bStart, bEnd)` đặt ở `timetable-template/lib/slot-overlap.ts`; `availability.ts` import sang — đúng tiền lệ `personnel-by-slot.ts` đã import từ timetable-template.

---

## 4. Hành vi UX

```
Sửa → có xung đột → cảnh báo amber (liệt kê chi tiết)
   → bấm Lưu → banner "Có N xung đột. Vẫn lưu?" [Hủy] [Vẫn lưu]
   → "Vẫn lưu" → lưu (xác nhận đã ghi nhận)
   → đổi tiếp giờ/nhân sự → reset xác nhận, phải xác nhận lại nếu còn xung đột
```

Không có xung đột → Lưu chạy thẳng như cũ.

---

## 5. Giới hạn / mở rộng sau

- **B chưa cross-grade:** chưa phát hiện cùng người dạy 2 khối khác nhau trùng giờ (cần load RA template các khối khác). Mở rộng: nạp thêm sibling RA templates rồi gộp vào `findPersonnelConflicts`.
- Thời lượng thiếu `lesson_time` → fallback 60'. Nếu sai thực tế có thể bỏ sót/ báo nhầm biên.
- Cảnh báo mang tính **mềm** (cho phép Lưu kèm xác nhận), không chặn cứng.

---

## 6. Kiểm tra

- `npx tsc --noEmit` → không lỗi.
- Timetable: đặt 2 tiết cùng ngày chồng giờ → cảnh báo + banner xác nhận khi Lưu.
- RA: gán 1 người vào 2 slot cùng ngày giao giờ → cảnh báo "trùng lịch" + xác nhận khi Lưu.
- Không xung đột → Lưu bình thường.

---

## 7. Liên quan

- [[FE-P1-004]] — UI sửa nhân sự RA template (B build trên editor này).
- `timetable-template/lib/layout.ts` — phát hiện overlap để VẼ (khác mục đích: hiển thị, không cảnh báo).
