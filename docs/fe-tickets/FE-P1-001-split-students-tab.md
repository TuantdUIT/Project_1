# FE-P1-001: Split admin-portal "Students" into "Registrations" and "Classes"

## Mục tiêu

Tách tab **Quản lý học sinh** hiện tại của admin-portal thành **2 tab độc lập** để phản ánh đúng 2 luồng nghiệp vụ:

1. **Đăng ký** — tiếp nhận HS từ form web + manager tự tạo (HS `WAITING`).
2. **Lớp học** — quản lý HS đang học, group theo Khối (HS `ACTIVE`).

**Ràng buộc**: BE giữ nguyên 100% — không thêm/sửa endpoint. Toàn bộ logic xử lý ở FE bằng cách filter `studentStatus` và group dữ liệu trả về.

---

## Bối cảnh

BE coi "đăng ký qua web" và "trong lớp" là **2 trạng thái** (`WAITING` → `ACTIVE`) của **cùng một record học sinh**, không phải 2 entity. Hiện FE đang gộp cả 2 luồng vào một component `StudentManagement` với dropdown filter `studentStatus` — manager phải tự chuyển filter, dễ nhầm và không tách bạch action.

Tham khảo:
- [API_ENDPOINTS.md mục 3 — Student](../API_ENDPOINTS.md)
- [features/admin/api/students.ts](../../src/features/admin/api/students.ts)
- [features/admin/components/student-management.tsx](../../src/features/admin/components/student-management.tsx)

---

## Phạm vi thay đổi

### 1. Routing & paths

`src/config/paths.ts` — thêm 2 path:

```ts
adminPortalRegistrations: '/admin-portal/registrations',
adminPortalClasses: '/admin-portal/classes',
```

Có thể xoá `adminPortalStudents` (hoặc giữ tạm để redirect → `/registrations` cho compatibility).

`src/app/router.tsx` — đổi children của `/admin-portal`:

```
index            → <Navigate to="/admin-portal/registrations" replace />
/overview        → loadAdminOverviewRoute (giữ)
/registrations   → loadAdminRegistrationsRoute (mới)
/classes         → loadAdminClassesRoute (mới)
```

### 2. Layout — sidebar 3 mục

`src/app/routes/admin/admin-portal.tsx`:

- 2 NavLink hiện tại → **3 NavLink**: Tổng quan / Đăng ký / Lớp học.
- `isOverviewActive` → thay bằng switch theo `pathname` để chọn `headerTitle`:
  - `/registrations` → "Học sinh đăng ký"
  - `/classes` → "Lớp học"
  - `/overview` → "Tổng quan"

### 3. Component mới

```
src/features/admin/components/
  registration-management.tsx  ◄── tách & rút gọn từ student-management.tsx
  class-management.tsx         ◄── mới hoàn toàn
  student-management.tsx       ◄── xoá sau khi 2 file trên ổn định
```

`src/app/routes/admin/`:

```
registrations.tsx   ◄── wrap <RegistrationManagement />
classes.tsx         ◄── wrap <ClassManagement />
students.tsx        ◄── xoá
```

---

## Spec từng tab

### Tab 1 — `RegistrationManagement` (`/admin-portal/registrations`)

**Mục đích**: chỗ duy nhất manager xử lý HS chưa nhận vào lớp.

**Filter**:
- `studentStatus = 'WAITING'` (cố định, không cho đổi).
- `schoolYear` — dropdown năm.
- (Optional) search theo tên/email/SĐT (client-side).

**Block UI**:

| Block | Logic | API |
|-------|-------|-----|
| Form "Tạo nhanh HS" | Giữ form hiện tại, body luôn có `studentStatus: 'WAITING'` | `useCreateStudent` |
| Bộ lọc năm + search | local state | — |
| Bảng HS chờ duyệt | Cột: Họ tên · Liên hệ · Ngày đăng ký · Khối nguyện vọng · [Nhận vào lớp][Từ chối] | `useStudentsQuery({ studentStatus: 'WAITING', schoolYear, page, size })` |

**Action**:
- **Nhận vào lớp** → `useUpdateStudentByUuid({ studentStatus: 'ACTIVE' })` (mặc định giữ `gradeIds` đã có).
- **Từ chối** → `useUpdateStudentByUuid({ studentStatus: 'INACTIVE' })`.

### Tab 2 — `ClassManagement` (`/admin-portal/classes`)

**Mục đích**: nhìn tổng thể HS đang học, group theo **Khối** (Grade) — không group theo `className` ở giai đoạn này.

**Filter**:
- `studentStatus = 'ACTIVE'` (cố định).
- `schoolYear` — dropdown năm.
- `gradeId` — dropdown "Tất cả / Khối 6 / Khối 7…" (client-side filter sau khi fetch).
- (Optional) search.

**Block UI**:

```
┌─ Bộ lọc ────────────────────────────────────────────┐
│ Năm: [2026 ▼]   Khối: [Tất cả ▼]   Search: [_____]  │
└─────────────────────────────────────────────────────┘

┌─ Tổng quan các khối ────────────────────────────────┐
│ ┌───────────┐ ┌───────────┐ ┌───────────┐           │
│ │ Khối 6    │ │ Khối 7    │ │ Khối 8    │           │
│ │ 24 HS     │ │ 18 HS     │ │ 12 HS     │           │
│ └───────────┘ └───────────┘ └───────────┘           │
└─────────────────────────────────────────────────────┘

┌─ Danh sách HS (filtered by gradeId nếu chọn) ───────┐
│ Cột: HS · Khối · Lớp (className) · Trường ·         │
│      [Chuyển khối][Dừng học]                        │
└─────────────────────────────────────────────────────┘
```

**Logic group theo khối**:
- Lấy `students[]` từ `useStudentsQuery({ studentStatus: 'ACTIVE' })`.
- Group ở FE: `groupBy(students, s => s.grades?.[0]?.id)` (fallback "Chưa xếp khối" nếu rỗng).
- Cards "Khối N" hiển thị `count` của mỗi nhóm; click card → set `gradeId` filter.

**Action**:
- **Chuyển khối** → modal chọn grade mới → `useUpdateStudentByUuid({ gradeIds: [newGradeId] })`.
- **Dừng học** → confirm → `useUpdateStudentByUuid({ studentStatus: 'INACTIVE' })`.

---

## Reuse hook hiện có

Không thêm hook mới. Tận dụng:

| Hook | Dùng ở | Filter param |
|------|--------|--------------|
| `useStudentsQuery` | Cả 2 tab + overview | `studentStatus` khác nhau → cache key khác |
| `useCreateStudent` | Tab Đăng ký | — |
| `useUpdateStudentByUuid` | Cả 2 tab | body khác nhau |
| `useGradesQuery` | Tab Lớp học (dropdown + group label) | — |

**Cache invalidation** đã đúng: mutation invalidate prefix `['admin','students']` ([api/students.ts:67,77](../../src/features/admin/api/students.ts)) → đổi status ở tab Đăng ký sẽ tự refresh tab Lớp học và Tổng quan.

---

## Acceptance Criteria

- [ ] Vào `/admin-portal` tự redirect sang `/admin-portal/registrations`.
- [ ] Sidebar có 3 mục: Tổng quan / Đăng ký / Lớp học, active state đúng với URL hiện tại.
- [ ] Tab Đăng ký:
  - [ ] Bảng chỉ hiển thị HS `WAITING`.
  - [ ] Form tạo HS mới luôn submit `studentStatus: 'WAITING'`.
  - [ ] Action "Nhận vào lớp" → HS biến mất khỏi tab Đăng ký và xuất hiện ở tab Lớp học (không reload).
  - [ ] Action "Từ chối" → HS biến mất khỏi cả 2 tab.
- [ ] Tab Lớp học:
  - [ ] Bảng chỉ hiển thị HS `ACTIVE`.
  - [ ] Cards thống kê HS/khối hiển thị đúng số lượng.
  - [ ] Click card khối → bảng dưới lọc đúng theo khối đó.
  - [ ] Action "Chuyển khối" → HS đổi nhóm khối ngay sau khi mutate xong.
  - [ ] Action "Dừng học" → HS biến mất khỏi tab Lớp học.
- [ ] KPI ở tab Tổng quan tự cập nhật khi có mutation ở 2 tab kia.
- [ ] Không có warning React Query / không có request thừa.
- [ ] Không phải gọi BE endpoint mới nào.

---

## Out of scope (sẽ làm ở ticket khác)

- Entity Class thực sự (GVCN, sĩ số tối đa, lịch học theo lớp) → cần BE mới.
- Group theo `className` (Lớp 6A1, 6A2…) → chờ chuẩn hoá field này, hiện chỉ group theo Khối.
- Bulk action (chấp nhận nhiều HS cùng lúc).
- Lịch sử thay đổi trạng thái (audit log) — BE chưa có.
- Modal "Nhận vào lớp" với form chọn lớp/GVCN — chờ entity Class.

---

## Effort ước tính

| Việc | Effort |
|------|--------|
| Paths + router + sidebar 3 NavLink | 15 phút |
| `registrations.tsx` + `classes.tsx` (route wrappers) | 10 phút |
| `RegistrationManagement` (tách từ file cũ) | 30 phút |
| `ClassManagement` (group + cards + modal chuyển khối) | 75 phút |
| Smoke test 2 luồng + dọn `student-management.tsx` | 20 phút |
| **Tổng** | **~2.5 giờ** |

---

## Migration plan

1. Thêm 2 path mới + router children → giữ `/students` route trỏ về `RegistrationManagement` tạm thời.
2. Tạo 2 component mới, viết test thủ công cho 2 luồng.
3. Đổi sidebar 2 → 3 NavLink.
4. Xoá `student-management.tsx` + path `students` sau khi 2 tab chạy ổn định.
