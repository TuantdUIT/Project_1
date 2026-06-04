# Plan — Điểm danh nhân sự tại buổi học

> Bổ sung component **`RecordAttendancePanel`** chấm công nhân sự (giảng viên / trợ giảng / non-student) cho từng `Lesson`, hiển thị song song với panel điểm danh học sinh. Trang [lesson-detail.tsx](../../src/features/study-week/components/lesson-detail.tsx) đổi từ 1 panel mặc định sang **2 dropdown menu** tách biệt:
>
> - **"Điểm danh học sinh"** — dùng lại `AttendancePanel` hiện hữu.
> - **"Điểm danh nhân sự"** — `RecordAttendancePanel` mới, chỉ chấm công cho nhân sự **đã được gán từ thời khóa biểu** (`lesson.employee_assignments`). Không thêm/xoá nhân sự tại đây.

---

## 1. Mục tiêu

- Tách bạch UX điểm danh học sinh và nhân sự: hai vùng riêng, mở/đóng độc lập, không tranh chấp filter/search.
- `RecordAttendancePanel` **chỉ chấm công** cho danh sách nhân sự được trả về từ `lesson.employee_assignments`. Việc gán nhân sự cho buổi học là trách nhiệm của luồng **thời khóa biểu** (template-level), không xử lý tại trang lesson-detail.
- Trường hợp `lesson.employee_assignments` trống → hiển thị thông báo hướng dẫn user vào thời khóa biểu để gán, không có CTA "Thêm nhân sự" tại panel này.
- Tái sử dụng tối đa pattern state machine của `AttendancePanel` (Chưa mở `pendingTicks`, save batch, dirty count) để giảm chi phí maintain.

## 2. Phạm vi

### In scope
- File mới [src/features/attendance/components/record-attendance-panel.tsx](../../src/features/attendance/components/record-attendance-panel.tsx).
- Sửa [src/features/study-week/components/lesson-detail.tsx](../../src/features/study-week/components/lesson-detail.tsx): thay tab buttons bằng 2 dropdown menu collapsible — "Điểm danh học sinh" và "Điểm danh nhân sự".
- Hook React Query mới cho `record-attendances` (đặt tại `src/features/attendance/api/record-attendances.ts`) phục vụ chấm công (POST / PUT / DELETE).

### Out of scope
- Sửa cấu trúc `AttendancePanel` hiện có (chỉ wrap trong dropdown, không refactor logic).
- **Thêm / xoá nhân sự cho buổi học** — diễn ra ở luồng thời khóa biểu (`employee-ra-templates` / `lesson-employee-assignments`), không thuộc panel này.
- CRUD độc lập cho `EmployeeRATemplate` từ menu admin (đã thuộc plan riêng nếu có).
- Tính lương / OT từ `lessonTime` & `overtime` (chỉ ghi, không tổng hợp).

## 3. Cấu trúc UI tổng quan

```
┌─ Section: Chi tiết buổi học (giữ nguyên header info) ────────────┐
│   Tuần · Ngày học · Bắt đầu · Khối · Loại buổi                   │
└──────────────────────────────────────────────────────────────────┘

▼ Dropdown 1: "Điểm danh học sinh"      (mặc định: mở)
   └─ <AttendancePanel lesson={lesson} />

▼ Dropdown 2: "Điểm danh nhân sự"        (mặc định: đóng — vì có thể trống)
   ├─ Header con: tổng số nhân sự đã gán · Có mặt
   ├─ Bảng (nếu có nhân sự): Checkbox · Họ tên · Vai trò · Số tiết · OT · Trạng thái
   └─ Empty state (khi `lesson.employee_assignments` rỗng):
       icon + "Chưa có nhân sự nào" + ghi chú "Hãy thêm nhân sự từ thời khóa biểu"
```

### Hành vi dropdown
- Mỗi dropdown là một section riêng (`<section>`) với header bấm vào để toggle. Mở 1 dropdown không ảnh hưởng dropdown còn lại.
- Lưu trạng thái mở/đóng cục bộ trong state component cha `LessonDetail` (không cần persist localStorage).

## 4. Component mới — `RecordAttendancePanel`

### Props
```ts
type Props = {
  lesson: Lesson;
};
```

### State chính (theo pattern `AttendancePanel`)
```ts
const [assignees, setAssignees] = useState<AssigneeRow[]>([]);     // nhân sự đã gán cho buổi (từ lesson.employee_assignments)
const [rows, setRows] = useState<Record<userUuid, RecordRow>>({});  // map UI state
const [pendingTicks, setPendingTicks] = useState<Record<userUuid, boolean>>({});
const [pendingMetrics, setPendingMetrics] = useState<Record<userUuid, { lessonTime?: number; overtime?: number }>>({});
```

`RecordRow` cần lưu thêm hai số `lessonTime`, `overtime` để map sang `ReqCreateRecordAttendanceDTO` (xem [openapi.ts:1717-1728](../../src/types/openapi.ts#L1717-L1728)):
```ts
type RecordRow = {
  initiallyTicked: boolean;
  currentlyTicked: boolean;
  initialLessonTime: number;
  initialOvertime: number;
  raAttdUuid?: string;
  error?: string;
};
```

### Nguồn dữ liệu nhân sự
- Đọc trực tiếp từ `lesson.employee_assignments` ([openapi.ts:1463](../../src/types/openapi.ts#L1463)).
- Panel **không có** thao tác Thêm/Xoá nhân sự — nếu user muốn điều chỉnh danh sách, vào thời khóa biểu.

### Cột bảng
| # | Cột | Nguồn |
|---|---|---|
| 1 | Checkbox điểm danh | `pendingTicks[uuid] ?? row.currentlyTicked` |
| 2 | Họ tên | `assignee.full_name` |
| 3 | Vai trò | `assignee.role_name` |
| 4 | Số tiết (input number) | `pendingMetrics[uuid].lessonTime ?? row.initialLessonTime` |
| 5 | OT (input number) | `pendingMetrics[uuid].overtime ?? row.initialOvertime` |
| 6 | Trạng thái (pill "Có mặt"/"Chưa có") | `pendingTicks[uuid] ?? row.currentlyTicked` |

### Save semantics
Khác `AttendancePanel`:
- **Tick mới** (ban đầu không có record): POST `/api/v1/record-attendances` với `{ userUuid, lessonUuid, lessonTime, overtime }`.
- **Bỏ tick** (có record cũ): DELETE `/api/v1/record-attendances/{ra_attd_uuid}`.
- **Vẫn tick nhưng đổi `lessonTime`/`overtime`**: PUT `/api/v1/record-attendances/{ra_attd_uuid}` — case mới so với student attendance.
- Build operations dùng `mergedRows = rows ∪ pendingTicks ∪ pendingMetrics`. Diff so với `initially*` để quyết định create / delete / update.

## 5. Sửa [lesson-detail.tsx](../../src/features/study-week/components/lesson-detail.tsx)

### Thay đổi
- Bỏ block `tabs` (`'Điểm danh', 'Ghi nhận buổi học', 'Xử lý vi phạm'`) — không còn dùng.
- Thay phần `<section><AttendancePanel /></section>` bằng 2 dropdown.

### Skeleton mới
```tsx
const [isStudentOpen, setStudentOpen] = useState(true);
const [isStaffOpen, setStaffOpen] = useState(false);

return (
  <>
    <section className="...">/* header info giữ nguyên */</section>

    <DropdownSection
      title="Điểm danh học sinh"
      isOpen={isStudentOpen}
      onToggle={() => setStudentOpen(o => !o)}
    >
      <AttendancePanel lesson={lesson} />
    </DropdownSection>

    <DropdownSection
      title="Điểm danh nhân sự"
      isOpen={isStaffOpen}
      onToggle={() => setStaffOpen(o => !o)}
    >
      <RecordAttendancePanel lesson={lesson} />
    </DropdownSection>
  </>
);
```

`DropdownSection` là component nội bộ của file `lesson-detail.tsx` (không tách feature riêng) — header có chevron xoay, animate grid-rows-[0fr→1fr] giống `study-week-list.tsx`.

## 6. Nguồn API & ràng buộc

- **Đọc nhân sự đã gán:** field `lesson.employee_assignments[]` đã có sẵn trong response của `GET /api/v1/lessons/{id}` ([openapi.ts:1463](../../src/types/openapi.ts#L1463)). Panel chỉ tiêu thụ field này, không gọi thêm endpoint nào để list.
- **Ghi nhận có mặt / số tiết / OT:** dùng các endpoint `record-attendances` (POST / PUT / DELETE) như §4.
- **Gán / bỏ gán nhân sự cho buổi:** ngoài phạm vi panel — luồng thời khóa biểu chịu trách nhiệm (template `employee-ra-templates` hoặc `lesson-employee-assignments`). Panel chỉ hiển thị thông báo "Hãy thêm nhân sự từ thời khóa biểu" khi danh sách trống.

## 7. Trình tự implement

| # | Bước | File chính | Phụ thuộc |
|---|---|---|---|
| 1 | Tạo hook React Query cho `record-attendances` (GET / POST / PUT / DELETE) | `src/features/attendance/api/record-attendances.ts` | openapi types |
| 2 | Helper `buildAssigneeRows` map từ `lesson.employee_assignments` sang `AssigneeRow` | inline trong `record-attendance-panel.tsx` | — |
| 3 | Hoàn thiện `RecordAttendancePanel` — bảng + state machine `pendingTicks` / `pendingMetrics` + empty state với thông báo "Hãy thêm nhân sự từ thời khóa biểu" | `record-attendance-panel.tsx` | §1-2 |
| 4 | Wire save: build operations diff → POST / PUT / DELETE batch (giống `AttendancePanel.saveAttendance`) | `record-attendance-panel.tsx` | §3 |
| 5 | Tạo `DropdownSection` nội bộ trong `lesson-detail.tsx`; replace tabs + section cũ bằng 2 dropdown | `lesson-detail.tsx` | §3-4 |
| 6 | Test thủ công: lesson không có nhân sự → hiển thị thông báo · lesson có nhân sự → tick có mặt → đổi `lessonTime` → Lưu → reload kiểm tra | — | §5 |

## 8. Acceptance criteria

- [ ] Trang lesson-detail có 2 dropdown menu riêng, tên đúng "Điểm danh học sinh" và "Điểm danh nhân sự".
- [ ] Đóng/mở mỗi dropdown độc lập, không ảnh hưởng filter/search trong panel còn lại.
- [ ] `RecordAttendancePanel` khi `lesson.employee_assignments` trống → hiển thị empty state với thông báo "Hãy thêm nhân sự từ thời khóa biểu" (không có nút thêm).
- [ ] Khi có nhân sự: render bảng với checkbox + Số tiết + OT cho từng người (không có cột Hành động xoá).
- [ ] Tick / nhập số tiết / OT chỉ thay đổi state Chưa mở; nút Lưu disabled khi không có diff.
- [ ] Bấm Lưu phát đúng POST / PUT / DELETE theo diff; sau khi thành công bảng phản ánh state mới.
- [ ] Hoàn tác xoá toàn bộ Chưa mở, không gọi API.
- [ ] Nếu lỗi 4xx/5xx riêng từng dòng: dòng đó hiển thị error pill, dòng khác vẫn lưu thành công.
- [ ] Type-check (`pnpm run lint`) và build (`pnpm run build`) pass.

## 9. Câu hỏi mở cần làm rõ

1. Default `lessonTime` khi tick mới là `0`, `lesson.lesson_type.lesson_time`, hay yêu cầu user nhập trước khi tick? (Hiện type `ReqCreateRecordAttendanceDTO` yêu cầu `lessonTime` là `int32` required — xem [openapi.ts:1725](../../src/types/openapi.ts#L1725).)
2. Có cần hiển thị thời điểm tạo record (`ra_attd_time`) như cột phụ?
3. Khi user phát hiện thiếu nhân sự, có cần nút điều hướng sang trang thời khóa biểu (deep link tới đúng template + slot) không, hay chỉ dòng text hướng dẫn là đủ?

## 10. Tham chiếu

- Component mẫu: [src/features/attendance/components/attendance-panel.tsx](../../src/features/attendance/components/attendance-panel.tsx)
- Schema API liên quan:
  - `ResRecordAttendanceDTO`, `ReqCreateRecordAttendanceDTO`, `ReqUpdateRecordAttendanceDTO` — [openapi.ts:1187, 1717, 1159](../../src/types/openapi.ts)
  - `ResLessonEmployeeAssignmentDTO` — [openapi.ts:1471-1485](../../src/types/openapi.ts#L1471-L1485)
  - `ResEmployeeRATemplateDTO` / `ResEmployeeRATemplateItemDTO` (cho luồng thời khóa biểu) — [openapi.ts:1555-1586](../../src/types/openapi.ts#L1555-L1586)
- Plan nền: [tuan-hoc.md](tuan-hoc.md), [FE_PLAN_DIEM_DANH.md](be-instructs/FE_PLAN_DIEM_DANH.md)
