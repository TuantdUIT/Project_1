# Quy trình triển khai thống kê học sinh theo khối

Tài liệu này mô tả quy trình chuẩn để hiển thị các con số thống kê học sinh trên FE (Project1_FE), sau khi backend đã chuyển nguồn thống kê chính thức sang endpoint `GET /api/v1/grades`.

---

## 1. Mục tiêu

- Thay thế toàn bộ các con số thống kê đang được tính bằng cách đếm phần tử từ dữ liệu phân trang (`array.length`) bằng số liệu BE đã tính sẵn.
- Tách biệt rạch ròi: query phân trang chỉ phục vụ render danh sách; query tổng hợp chỉ phục vụ render thống kê.
- Đồng bộ types FE với response mới của `GET /api/v1/grades`.

## 2. Phạm vi hiện tại

- Chỉ thống kê học sinh ở trạng thái `ACTIVE`.
- Các trạng thái khác (`WAITING`, `INACTIVE`, ...) sẽ được bổ sung sau khi BE mở rộng response. Khi đó áp dụng lại cùng quy trình này.

## 3. Nguyên tắc vàng

1. Khi cần con số tổng hợp (tổng HS, HS theo khối...), luôn ưu tiên endpoint BE đã tính sẵn. Không tự đếm từ FE.
2. Cấm dùng `array.length` trên kết quả phân trang để suy ra tổng (kể cả khi đã nâng `size` lên 100/1000). Nếu thực sự buộc phải lấy tổng từ endpoint phân trang khi BE chưa hỗ trợ, chỉ dùng `meta.totalItems` với `size: 1`.
3. Một query React Query phục vụ một mục đích duy nhất: hoặc danh sách, hoặc thống kê. Không trộn.
4. Sửa types trước, sửa UI sau. Nếu sửa UI trước, optional chaining sẽ nuốt im lặng lỗi shape.

## 4. Nguồn dữ liệu chính thức

`GET /api/v1/grades` — sau khi `apiClient` unwrap `data` ([api-client.ts:47-48](../src/lib/api-client.ts#L47-L48)) trả về:

```ts
{
  totalActiveStudents: number;          // tổng HS ACTIVE toàn hệ thống
  grades: Array<{
    id: number;
    name: string;
    studentsInPeriodCount: number;      // số HS có Period còn hiệu lực của từng khối
  }>;
}
```

Cache key React Query: `['curriculum', 'grades']` — đã được dùng chung bởi `useGradesQuery()`.

## 5. Quy trình thực hiện (từng bước)

### Bước 1 — Cập nhật types

Mục tiêu: TypeScript phải bắt được mọi call site đang treat data như `Grade[]`.

- Path entries trong [openapi.ts:231-246](../src/types/openapi.ts#L231-L246) (`/api/v1/grades/{id}`) và [openapi.ts:503-518](../src/types/openapi.ts#L503-L518) (`/api/v1/grades`) đã chuẩn — **không sửa**.
- Sửa schema `ResGradeDTO` tại [openapi.ts:822-826](../src/types/openapi.ts#L822-L826): thêm `studentsInPeriodCount?: number`.
- Sửa response của operation `getAllGrades` tại [openapi.ts:3402-3421](../src/types/openapi.ts#L3402-L3421): đổi `"*/*": components["schemas"]["ResGradeDTO"][]` sang shape mới `{ totalActiveStudents: number; grades: components["schemas"]["ResGradeDTO"][] }`. Có thể tạo schema mới (vd `ResGradesOverviewDTO`) để giữ cho `openapi.ts` đồng nhất với phần còn lại.
- Thêm export type trong [curriculum/types.ts](../src/features/curriculum/types.ts): `export type GradesOverview = ...` (lấy từ operation response).

**Lưu ý quan trọng**: xác nhận với chủ dự án xem `openapi.ts` có phải sinh tự động từ BE OpenAPI spec không.
- Nếu auto-generate: BE cập nhật spec trước, FE chạy lại generator. Không sửa tay.
- Nếu viết tay: sửa trực tiếp theo mô tả trên.

### Bước 2 — Cập nhật API layer

[curriculum/api/grades.ts:5-7](../src/features/curriculum/api/grades.ts#L5-L7):

- Đổi generic của `apiClient.get<Grade[]>('/api/v1/grades')` thành `apiClient.get<GradesOverview>('/api/v1/grades')`.
- Giữ nguyên `useGradesQuery()` và cache key `['curriculum', 'grades']`.

### Bước 3 — Refactor các điểm thống kê

#### 3.1. `class-management.tsx`

File: [class-management.tsx](../src/features/admin/components/class-management.tsx)

- [line 53-58](../src/features/admin/components/class-management.tsx#L53-L58): bỏ `size: 100`. Đưa về phân trang thật (vd `size: 20`) và bind UI phân trang vào `searchParams.page`. Từ giờ `studentsQuery` chỉ phục vụ render bảng danh sách HS, không phục vụ count.
- [line 77](../src/features/admin/components/class-management.tsx#L77): `allStudents` chỉ chứa HS của trang hiện tại, không dùng cho count.
- [line 79-105](../src/features/admin/components/class-management.tsx#L79-L105): bỏ logic build `groups` từ `allStudents`. Tạo `groups` mới từ `gradesQuery.data.grades`, với `count = grade.studentsInPeriodCount`.
- [line 145](../src/features/admin/components/class-management.tsx#L145): `count={allStudents.length}` → `count={gradesQuery.data?.totalActiveStudents ?? 0}`.
- [line 149-158](../src/features/admin/components/class-management.tsx#L149-L158): mỗi `GradeCard` đọc `count` từ `grade.studentsInPeriodCount`.
- [line 206](../src/features/admin/components/class-management.tsx#L206): `(gradesQuery.data ?? []).map(...)` → `(gradesQuery.data?.grades ?? []).map(...)`.
- [line 211-213](../src/features/admin/components/class-management.tsx#L211-L213): option "Chưa xếp khối" — BE mới không trả nhóm này. Hành xử mặc định: **bỏ option** (xác nhận lại với chủ dự án trước khi xóa).
- [line 108-110](../src/features/admin/components/class-management.tsx#L108-L110): khi user chọn 1 khối để xem danh sách, FE nên truyền `gradeId` vào `useStudentsQuery` để BE filter, thay vì lọc client-side. **Điều kiện tiên quyết**: BE `/api/v1/manager/students` đã hỗ trợ filter theo `gradeId`. Nếu chưa hỗ trợ, mở ticket BE; trong thời gian chờ, giữ filter client-side trên page hiện tại nhưng phải hiển thị banner cảnh báo "đang xem trang hiện tại" để tránh hiểu nhầm với con số tổng.

#### 3.2. `overview.tsx`

File: [overview.tsx](../src/app/routes/admin/overview.tsx)

- [line 7-12](../src/app/routes/admin/overview.tsx#L7-L12): xoá `activeStudentsQuery`. `StatsCards.totalStudents` đọc từ `gradesQuery.data?.totalActiveStudents ?? 0`.
- [line 13-18](../src/app/routes/admin/overview.tsx#L13-L18): **giữ nguyên** `waitingStudentsQuery` (BE chưa trả `totalWaitingStudents` trong `/api/v1/grades`; vẫn dùng `useStudentsQuery({ studentStatus: 'WAITING', size: 1 })` rồi đọc `meta.totalItems`). Khi BE bổ sung field WAITING, xoá query này theo đúng quy trình.
- [line 27](../src/app/routes/admin/overview.tsx#L27): `gradesQuery.data?.length ?? 0` → `gradesQuery.data?.grades.length ?? 0`.

### Bước 4 — Cập nhật các call site còn lại của `useGradesQuery` (TypeScript fix)

5 file dưới đây không liên quan thống kê nhưng đang treat data là array, sẽ vỡ TypeScript sau khi đổi shape — cần sửa cùng PR:

- [registration-management.tsx:48](../src/features/admin/components/registration-management.tsx#L48) — đổi nơi render option khối.
- [period-form-modal.tsx:103](../src/features/admin/components/period-form-modal.tsx#L103).
- [period-setting-form-modal.tsx:79](../src/features/period-setting/components/period-setting-form-modal.tsx#L79).
- [period-setting-list.tsx:24](../src/features/period-setting/components/period-setting-list.tsx#L24).
- [consultation-form.tsx:9](../src/features/landing/components/consultation-form.tsx#L9).

Pattern thay thế: `gradesQuery.data` (array) → `gradesQuery.data?.grades ?? []`.

### Bước 5 — Cache invalidation

Thêm `queryClient.invalidateQueries({ queryKey: ['curriculum', 'grades'] })` vào các mutation sau (vì chúng thay đổi `totalActiveStudents` hoặc `studentsInPeriodCount`):

- Activate HS từ WAITING sang ACTIVE.
- Update HS đổi grade hoặc đổi status.
- Create / Update / Delete Period.
- Create / Update / Delete Period Setting (gián tiếp ảnh hưởng vì Period sinh từ Setting).

Hiện tại các mutation chỉ invalidate `['admin', 'students']` ([students.ts:98-101](../src/features/admin/api/students.ts#L98-L101)) — chưa đủ.

## 6. Checklist verify trước khi merge

- [ ] Mở DevTools Network: trang Class Management chỉ gọi `/api/v1/grades` đúng 1 lần cho cache; không còn `/api/v1/manager/students?...size=100`.
- [ ] `GradeCard "Tất cả"` hiển thị đúng `totalActiveStudents` của BE (đối chiếu bằng DB hoặc Postman).
- [ ] Mỗi `GradeCard` khối hiển thị đúng `studentsInPeriodCount` của BE.
- [ ] Bảng danh sách HS phía dưới phân trang đúng, chuyển trang được, không phụ thuộc số 100.
- [ ] Sau khi activate 1 HS từ WAITING sang ACTIVE: card "Tất cả" và card khối tương ứng tăng số ngay (cache invalidation đúng).
- [ ] Sau khi tạo/xoá 1 Period: số HS của khối tương ứng cập nhật.
- [ ] TypeScript build sạch, không còn `gradesQuery.data` dùng như array ở bất kỳ file nào.
- [ ] Không còn cảnh báo nhập nhằng giữa "số đếm tổng" và "số HS hiển thị trên page hiện tại".

## 7. Mở rộng tương lai

Khi BE bổ sung các trạng thái khác vào response `/api/v1/grades` (vd `totalWaitingStudents`, `totalInactiveStudents`, hoặc `grades[].studentsInPeriodCountByStatus`), áp dụng lại đúng quy trình ở Bước 1 → Bước 4:

1. Mở rộng schema trong `openapi.ts`.
2. Mở rộng type `GradesOverview`.
3. Thay các nơi đang fallback sang `useStudentsQuery({ size: 1 })` để đọc `meta.totalItems` bằng field mới của `/api/v1/grades`.
4. Xoá những `useStudentsQuery` chỉ phục vụ count để giảm số request.

## 8. Câu hỏi cần chốt với chủ dự án trước khi code

1. `openapi.ts` có phải sinh tự động không?
2. BE đã hỗ trợ filter `gradeId` cho `GET /api/v1/manager/students` chưa?
3. Nhóm "Chưa xếp khối" có còn nghiệp vụ không? Nếu còn, BE có kế hoạch trả nhóm này trong `grades[]` không?
4. Bao giờ BE bổ sung `totalWaitingStudents` vào `/api/v1/grades`?
