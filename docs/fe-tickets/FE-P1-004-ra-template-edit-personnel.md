# FE-P1-004 — UI sửa nhân sự cho Mẫu chấm công (RA template)

**Ngày:** 2026-06-13
**Loại:** Tính năng mới (FE)
**Khu vực:** Management Services → Tổng hợp template → Mẫu chấm công (RA template)

---

## 1. Bối cảnh

Trước đây FE **không có đường** sửa nhân sự (`items`) của RA template:
- Modal chi tiết RA cố tình **bỏ `items`** khi PUT (comment: "không gửi items để giữ nguyên phân công"), vì backend dùng cơ chế **replace toàn bộ** — gửi thiếu là xóa nhầm.
- Nhân sự chỉ thay đổi tự động qua `template-sync` khi đổi **giờ** timetable (dời slot), không có cách đổi **người**.

Backend đã sẵn sàng: `ReqUpdateEmployeeRATemplateDTO.items` nhận đầy đủ.

→ Ticket này bổ sung UI để gán/bỏ nhân sự theo từng slot, gửi `items` đầy đủ.

---

## 2. Thay đổi

| File | Thay đổi |
|---|---|
| `employee-ra-template/types.ts` | Thêm type `ReqEmployeeRATemplateItem` |
| `employee-ra-template/components/ra-template-detail-modal.tsx` | Thêm editor gán nhân sự theo slot + gửi `items` đầy đủ khi nhân sự đổi |

### Nguồn dữ liệu

- **Slot:** lấy từ `items` của timetable template **đang liên kết** (prop `timetableTemplates`, list đã kèm items). Mỗi slot = `lessonType | dayOfWeek | startTime` (chuẩn hóa bằng `makeSlotKey`).
- **Nhân sự khả dụng:** `useNonStudentUsersQuery()` (TEACHER / MANAGER / TA / COLAB_TEACHER).
- **Phân công ban đầu:** group `template.items` hiện tại theo slot key.

### Hành vi

- Chế độ xem: danh sách phân công read-only (như cũ).
- Chế độ sửa: mỗi slot hiển thị chip nhân sự đã gán (xóa được) + dropdown thêm người (chỉ người chưa gán slot đó).
- Chỉ gán cho **slot có sẵn** của timetable template — không nhập tự do giờ/ngày (đúng domain rule: RA item phải khớp slot timetable).

---

## 3. Quy tắc an toàn đã tuân thủ

1. **Replace đầy đủ:** chỉ gửi `items` khi `personnelDirty = true`; khi gửi, build từ **mọi slot** (kể cả slot không đổi) → không mất phân công.
2. **Sửa tên-only không đụng items:** nếu chỉ đổi tên/liên kết, `items` không được gửi → backend giữ nguyên phân công.
3. **Khớp slot:** gán theo slot của timetable template (`lessonTypeId | dayOfWeek | startTime`), đúng rule backend.

---

## 4. Tác động tới study-week

- Sửa RA template **chỉ đụng master** — study-week cũ giữ nguyên (`employee_assignments` đã frozen, xem [[FE-P1-002]] / [[FE-P1-003]]).
- Study-week **tạo sau** khi sửa → backend copy RA mới → nhận nhân sự mới.

→ Luồng đúng: **sửa RA template trước → tạo study-week mới sau**.

---

## 5. Đánh đổi / lưu ý

- Khi lưu nhân sự, chỉ các slot **hiện có** trong timetable template liên kết được giữ. RA item "mồ côi" (không khớp slot nào) sẽ bị loại khi build lại — đúng nghiệp vụ (RA chỉ hợp lệ khi khớp slot).
- Nếu đổi mẫu timetable liên kết **đồng thời** với sửa nhân sự: slot đổi theo link mới, phân công cũ (key khác) sẽ không map sang. Nên đổi link và gán người ở 2 lần lưu riêng cho rõ ràng.

---

## 6. Kiểm tra

- `npx tsc --noEmit` → không lỗi.
- Mở RA template → Sửa → mỗi slot gán/bỏ người → Lưu → PUT gửi `items` đầy đủ.
- Đổi tên (không động nhân sự) → `items` không gửi → phân công giữ nguyên.

---

## 7. Liên quan

- [[FE-P1-002]] — study-week đọc `employee_assignments`.
- [[FE-P1-003]] — calendar lesson-based.
- Domain: `docs/guide/Ghi chú domain - EmployeeRATemplate-LessonEmployeeAssignment.md` (mục 6 rule khớp slot, mục 11 gợi ý UI).
- Backend replace items: `docs/guide/API Guide 20 - Employee RA Template.md`.
