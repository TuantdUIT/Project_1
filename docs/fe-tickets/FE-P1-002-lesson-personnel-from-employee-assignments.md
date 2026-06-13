# FE-P1-002 — Cột "Nhân sự" của buổi học đọc từ `employee_assignments`

**Ngày:** 2026-06-12
**Loại:** Sửa lỗi bất nhất dữ liệu (data consistency)
**Khu vực:** Management Services → Tuần học (study-week)

---

## 1. Vấn đề

Trong danh sách buổi học của một tuần, cột **"Nhân sự"** hiển thị `Buổi học này chưa sắp xếp nhân sự`,
trong khi mở chi tiết buổi học đó thì panel **"Điểm danh nhân sự"** vẫn liệt kê đầy đủ người
(ví dụ: 2 TA đang chờ điểm danh).

Hai chỗ lẽ ra cùng nói về "nhân sự của buổi học" nhưng lại mâu thuẫn nhau.

### Ảnh chụp tình huống

- Buổi VDC – Chủ Nhật 31/05 – 10:30 → cột ngoài: *chưa sắp xếp nhân sự*
- Cùng buổi đó, panel chi tiết: Tạ Gia Khang (TA), Nguyễn Bảo Ân (TA)

---

## 2. Nguyên nhân gốc

Hai chỗ dùng **hai nguồn dữ liệu khác nhau**:

| Vị trí | Nguồn (trước khi sửa) | Bản chất |
|---|---|---|
| Cột ngoài (`lesson-row`) | RA template + khớp **slot key** | Live — bám theo template |
| Panel trong (`record-attendance-panel`) | `lesson.employee_assignments` | Frozen — gắn cứng `lesson_uuid` |

**Cơ chế khớp slot key của cột ngoài:**

```
slot key lesson = lessonType | dayOfWeek | lesson_start_time
slot key RA     = lessonType | dayOfWeek | start_time
```

Khi đổi giờ trong Timetable Template, `template-sync` dời `start_time` của RA item sang giờ mới
(vd: 08:00 → 10:30). Nhưng `lesson.lesson_start_time` của buổi đã tạo **không đổi**. Hai slot key
lệch nhau → không khớp → cột ngoài mất nhân sự.

Trong khi đó `lesson.employee_assignments` gắn trực tiếp qua `lesson_uuid` (không qua slot key),
được backend chụp lại (snapshot) lúc tạo buổi học và **đóng băng** → panel trong vẫn giữ đủ người.

→ Đây là **hai nguồn sự thật song song**, gây bất nhất khi template thay đổi.

---

## 3. Thay đổi đã thực hiện

Cho cột ngoài đọc cùng nguồn với panel trong: `lesson.employee_assignments`.
Loại bỏ hoàn toàn nhánh khớp slot key từ RA template cho mục đích **hiển thị**.

### File thay đổi

| File | Thay đổi |
|---|---|
| `study-week/types.ts` | Thêm type `LessonEmployeeAssignment` (alias `ResLessonEmployeeAssignmentDTO`) |
| `study-week/components/lesson-row.tsx` | Đọc `lesson.employee_assignments`; bỏ prop `personnel` / `isPersonnelLoading` / `isPersonnelError`; đổi key item sang `lesson_employee_assignment_uuid` |
| `study-week/components/study-week-detail.tsx` | Bỏ hook `useLessonPersonnelByGrade` và các prop truyền xuống `LessonRow` |
| `study-week/hooks/use-lesson-personnel-by-grade.ts` | **Đã xóa** (dead code) |
| `study-week/lib/lesson-personnel.ts` | Rút gọn còn mỗi hằng `UNASSIGNED_PERSONNEL_MESSAGE` (vẫn dùng chung với panel điểm danh); xóa các hàm khớp slot key |

### Trước / Sau (cốt lõi)

**Trước** — `study-week-detail.tsx`:
```tsx
const personnelQuery = useLessonPersonnelByGrade(lessonsQuery.lessons, resolvedGradeId);
// ...
<LessonRow
  personnel={personnelQuery.personnelByLessonUuid.get(lesson.lesson_uuid) ?? []}
  isPersonnelLoading={personnelQuery.isLoading}
  isPersonnelError={personnelQuery.isError}
  ...
/>
```

**Sau** — `lesson-row.tsx`:
```tsx
const personnel = lesson.employee_assignments ?? [];
```

---

## 4. Lý do chọn `employee_assignments`

1. **Nhất quán hai chỗ** — cột ngoài và panel điểm danh cùng một nguồn, không còn lệch.
2. **Không "biến mất" khi đổi template** — `employee_assignments` gắn cứng `lesson_uuid`, không phụ
   thuộc việc `lesson_start_time` có khớp `start_time` của RA item hay không.
3. **Đúng ngữ nghĩa chấm công** — roster của một buổi học đã lên lịch phải ổn định, không được
   xê dịch khi ai đó sửa template vài tháng sau.
4. **Đơn giản hơn** — bỏ được cả chuỗi query (template-by-grade → RA-by-tt) và logic slot matching.

---

## 5. Đánh đổi (cần biết)

Hành vi cột ngoài thay đổi bản chất từ **live** sang **frozen**:

| | Trước (RA template) | Sau (employee_assignments) |
|---|---|---|
| Sửa template → tuần đã tạo | Cột ngoài đổi theo | Cột ngoài **giữ nguyên** |
| Thêm người vào template sau | Tuần cũ hiện người mới | Tuần cũ **không** hiện |

→ Sau thay đổi, sửa RA template **chỉ áp cho các buổi học tạo sau đó**, không hồi tố tuần cũ.
Điều này khớp với hành vi của panel điểm danh và đúng với logic chấm công.

---

## 6. Giả định đã được xác nhận

Thay đổi này dựa trên giả định (đã được xác nhận với phía dự án):

> Backend **luôn populate `employee_assignments` cho mọi lesson** tại thời điểm tạo study-week.

Nếu giả định này sai (có lesson không được gán assignments), cột ngoài sẽ hiển thị
*chưa sắp xếp nhân sự* cho các buổi đó — cần backend đảm bảo populate đầy đủ.

---

## 7. Kiểm tra

- `npx tsc --noEmit` → không lỗi.
- Cột ngoài và panel điểm danh hiển thị cùng danh sách nhân sự cho cùng một buổi.
- Đổi giờ Timetable Template → nhân sự ở cột ngoài của tuần đã tạo **không biến mất**.

---

## 8. Việc tiếp theo (gợi ý, ngoài phạm vi ticket)

- Nếu cần cho phép sửa roster của buổi học đã tạo: backend bổ sung write path cho
  `employee_assignments` (hiện `ReqUpdateLessonDTO` chưa có field này), kèm UI tương ứng.
- Cân nhắc thêm nhãn UI phân biệt rõ "dự kiến (template)" vs "thực tế (buổi học)" nếu sau này
  cần hiển thị cả hai.
