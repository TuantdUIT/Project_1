# Plan — Quản lý nhân sự (User CRUD)

> Wire toàn bộ API của [API Guide 2 - User](../guide/API%20Guide%202%20-%20User.md) vào admin portal qua một mục navbar mới **"Quản lý nhân sự"**.
>
> Module này quản lý tài khoản nhân sự (`MANAGER`, `TEACHER`, `TA`, `ADMIN`) — **không** dùng để tạo học sinh (Student có module riêng theo Guide 3, đã wire ở `features/admin/api/students.ts`).

---

## 1. Mục tiêu

- Manager có 1 màn quản lý user nhân sự độc lập với màn quản lý học sinh.
- Wire 5 endpoint của module User vào FE bằng React Query hooks.
- Thêm 1 mục navbar mới trong sidebar admin portal: **"Quản lý nhân sự"**.

## 2. Phạm vi

### In scope
- Feature module mới: `features/admin-users/`.
- 5 React Query hooks (list, detail, create, update, delete).
- Route mới `/admin-portal/users` với UI: list + filter + create/edit/delete (qua modal).
- NavLink mới trong `admin-portal.tsx` với icon Users (`lucide-react`).
- Tách biệt rõ với module Student — không tái sử dụng `useStudentsQuery`.

### Out of scope
- Role CRUD (chưa có Guide riêng — chỉ dùng để render dropdown).
- Bulk import/export user.
- Permission/scope chi tiết.
- Reset password flow.
- Audit log thay đổi user.

---

## 3. Endpoint cần wire

| # | Method | Path | Hook FE | Mục đích |
|---|--------|------|---------|----------|
| 1 | GET | `/api/v1/users` | `useUsersQuery({page,size,sort})` | List phân trang |
| 2 | GET | `/api/v1/users/{id}` | `useUserDetailQuery(uuid)` | Detail 1 user |
| 3 | POST | `/api/v1/users` | `useCreateUser()` | Tạo user |
| 4 | PUT | `/api/v1/users/{id}` | `useUpdateUser()` | Partial update |
| 5 | DELETE | `/api/v1/users/{id}` | `useDeleteUser()` | Xóa user, BE trả `204 No Content` |

Schema (đã có sẵn trong `src/types/openapi.ts`):
- `ResUserDTO` (snake_case: `id`, `user_fullname`, `user_phone_number`, `fb_link`, `user_email`, `role`, …) — line 787
- `ReqCreateUserDTO` (camelCase: `fullName`, `phoneNumber`, `fbLink`, `email`, `password`, `roleId`) — line 1333
- `ReqUpdateUserDTO` (camelCase, mọi field optional) — line 747
- `ResRoleDTO` (lồng trong `ResUserDTO`) — line 773

---

## 4. Ghi chú nghiệp vụ / kỹ thuật

Từ Guide 2 mục 2 & 6:
- `password` **chỉ có ở request create/update**, không bao giờ trả về ở response.
- `password` được BE mã hóa qua `PasswordEncoder` trước khi lưu — FE gửi plaintext qua HTTPS.
- API list không paginate đồng đều với các module khác — phải đọc `meta` để dựng controller phân trang.
- `User` là tài khoản **chung**: bản chất bao gồm cả Student. Nhưng UX bắt buộc tách kênh — Student tạo qua `/manager/student/register` để có nghiệp vụ riêng (SID, password = phone, grade, status).
- Module này phụ thuộc `Role` ở mức dữ liệu (mỗi user cần `roleId`).

Lưu ý request/response shape (theo P1-FEATURES-PLAN §0 ghi chú `id`):
- `id` của user là **UUID** (string), không phải Long.
- `roleId` là **Long** (number).
- Response dùng snake_case, request dùng camelCase — **không gộp 2 shape** vào 1 type, viết riêng adapter nếu cần.

---

## 5. Cấu trúc thư mục đề xuất

```
src/features/admin-users/
├── api/
│   └── users.ts              # fetchers + 5 hooks React Query
├── components/
│   ├── user-management.tsx   # main: table + filter + paging + open modal
│   ├── user-create-modal.tsx # form tạo mới
│   └── user-detail-modal.tsx # detail + edit + delete (pattern theo StudentDetailModal)
├── types.ts                  # re-export DTO từ openapi.ts
└── index.ts                  # barrel export

src/app/routes/admin/
└── users.tsx                 # route component, lazy-load UserManagement
```

Lý do tách `admin-users` thành module riêng (không nhét vào `features/admin/`):
- Tránh `admin/api/` phình to lẫn lộn nghiệp vụ HS và nhân sự.
- Reuse `features/admin/components/registration-management.tsx` làm chỗ tham chiếu pattern nhưng không import chéo.

---

## 6. Chi tiết wire API

### 6.1 `types.ts`
```ts
import type { components } from '@/types/openapi';

export type ResUserDTO = components['schemas']['ResUserDTO'];
export type ReqCreateUserDTO = components['schemas']['ReqCreateUserDTO'];
export type ReqUpdateUserDTO = components['schemas']['ReqUpdateUserDTO'];
export type ResRoleDTO = components['schemas']['ResRoleDTO'];
```

### 6.2 `api/users.ts`

Pattern theo `features/admin/api/students.ts` — fetchers thuần + hooks `useQuery`/`useMutation`.

Query keys (cố định để invalidate đúng):
```
['admin', 'users']                            # prefix
['admin', 'users', { page, size, sort }]      # list (queryKey[2] là object)
['admin', 'users', userUuid]                  # detail (queryKey[2] là string)
```

Mutation `onSuccess` **bắt buộc** theo pattern đã rút ra từ bug Student modal (xem `useUpdateStudentByUuid` sau fix):
1. `setQueryData(['admin', 'users', userUuid], data)` — seed detail bằng response ngay
2. `invalidateQueries({ predicate: q => typeof q.queryKey[2] === 'object' })` — chỉ invalidate list, **không** invalidate detail (tránh BE GET trả stale làm overwrite cache vừa seed)

Cụ thể:
```ts
useUsersQuery(params)        → GET /api/v1/users?page=&size=&sort=
useUserDetailQuery(uuid)     → GET /api/v1/users/{uuid}
useCreateUser()              → POST + invalidate list
useUpdateUser()              → PUT + setQueryData(detail) + invalidate list (predicate)
useDeleteUser()              → DELETE + removeQueries(detail) + invalidate list
```

### 6.3 Pagination
- Dùng `buildPageQuery` từ `@/utils/pagination` (đã có sẵn, được `students.ts` dùng).
- BE trả `data: { meta, result }` — `PaginatedResult<ResUserDTO>`.
- Chốt index BE: P1-FEATURES-PLAN §0 cảnh báo Pageable 0-indexed nhưng meta 1-indexed → smoke test 2 page rồi gắn util cho khớp.

---

## 7. UI

### 7.1 Trang list `/admin-portal/users`

| Vùng | Nội dung |
|---|---|
| Header | Title "Quản lý nhân sự" + nút primary "Tạo user mới" |
| Filter bar | Search box (client-side substring match — pattern hiện tại của ClassManagement: lowercase + `includes` qua `fullName + email + phone`), dropdown filter Role |
| Table | Cột: Họ tên · Email · SĐT · Role · Ngày tạo · Thao tác (Xem / Xóa) |
| Footer | Pagination hiển thị `meta.page / meta.totalPages`, mỗi page `size = 10` |
| Empty state | "Chưa có user nào" hoặc "Không tìm thấy user khớp" |

### 7.2 Modal tạo user (`user-create-modal.tsx`)

Field theo `ReqCreateUserDTO`:
- `fullName` (bắt buộc)
- `email` (bắt buộc, validate format ở FE bằng `type="email"`)
- `phoneNumber` (optional, chỉ digits)
- `password` (bắt buộc; FE check `length >= 6` để tránh BE reject)
- `roleId` (bắt buộc, dropdown — xem §9 về nguồn role list)
- `fbLink` (optional, validate URL)

Submit → `useCreateUser.mutateAsync` → close modal → list refetch tự động.

### 7.3 Modal chi tiết / edit (`user-detail-modal.tsx`)

Pattern bám sát `StudentDetailModal` ở `class-management.tsx`:
- `originals` lấy từ response detail → `form` mirror → `isDirty` = diff.
- `EditableRow` component reuse (extract sang `components/ui/` nếu chưa có chỗ chung).
- Password để **trống mặc định**; chỉ gửi khi user nhập (BE PUT là partial update).
- Nút "Xóa" có confirm 2 bước (modal nhỏ "Xóa user này?") tránh xóa nhầm.
- Sau khi PUT thành công: header `<h3>` đọc `student.user_fullname` cập nhật ngay nhờ `setQueryData` seed detail cache.

### 7.4 Navbar integration (`admin-portal.tsx`)

Thêm mục thứ 4 dưới "Lớp học":
```tsx
<NavLink to={paths.adminPortalUsers} ...>
  <Users size={18} className="shrink-0" />
  {!isCompact ? <span>{usersLabel}</span> : null}
</NavLink>
```
- Icon: `Users` từ `lucide-react`.
- Label dynamic theo width sidebar: wide → "Quản lý nhân sự", narrow → "Nhân sự".
- Cập nhật `headerTitle` switch để cover path mới.

---

## 8. Route + paths

### 8.1 `src/config/paths.ts`
```ts
adminPortalUsers: '/admin-portal/users',
```

### 8.2 `src/app/router.tsx`
- Thêm `loadAdminUsersRoute` lazy loader.
- Thêm child route `'users'` trong block `adminPortal`.

### 8.3 `src/app/routes/admin/users.tsx`
```ts
import UserManagement from '@/features/admin-users/components/user-management';

export default function AdminUsersRoute() {
  return <UserManagement />;
}
```

---

## 9. Phụ thuộc cần làm rõ trước khi code

### 9.1 Nguồn data cho dropdown Role
Form create/update cần list role để chọn `roleId`. Hiện trạng:
- BE có entity `Role` nhưng **chưa có guide riêng** trong `docs/guide/`.
- `ResRoleDTO` đã có schema trong `openapi.ts:773`.
- Cần xác định endpoint `GET /api/v1/roles` có sẵn không.

Phương án:
| # | Cách | Pro | Con |
|---|---|---|---|
| (a) | Hardcode `[{id:1,name:'MANAGER'},...]` | Nhanh, không chờ BE | Dễ lệch khi BE đổi ID |
| (b) | Smoke `GET /api/v1/roles`, nếu có dùng luôn | Đúng dữ liệu BE | Phải verify trước |
| (c) | Hỏi BE bổ sung Guide | Đủ docs | Block tiến độ |

**Đề xuất:** Thực hiện (b). Nếu BE chưa có, tạm dùng (a) với comment `TODO: replace when role API available` và mở ticket BE.

### 9.2 Password policy
Guide 2 chỉ ghi "password bắt buộc" khi create, không nói độ dài tối thiểu. FE đề xuất:
- Min length 6
- Hiển thị toggle eye/eye-off
- Không enforce ký tự đặc biệt (BE có thể từ chối khác)

### 9.3 Role-guard cho navbar
Trang chỉ MANAGER được vào — đã có sẵn `<RoleGuard roleName="MANAGER">` ở router root level, không cần wrap thêm.

---

## 10. Test plan

### Smoke (manual)
- [ ] Đăng nhập manager → vào `/admin-portal` → thấy nav "Quản lý nhân sự"
- [ ] Click nav → load list, kiểm tra Network: `GET /api/v1/users?page=0&size=10`
- [ ] Tạo user mới với email mới → BE trả 201, list xuất hiện row mới
- [ ] Tạo user trùng email → BE trả 400 `User with email '...' already exists` → FE hiển thị toast
- [ ] Mở chi tiết user → đổi `fullName` → Áp dụng → modal title cập nhật ngay
- [ ] Update không gõ password → request body không có `password`
- [ ] Xóa user → BE trả 204 → row biến mất khỏi list
- [ ] Filter role dropdown lọc đúng client-side
- [ ] Search box match được fullName/email/phone

### Unit / integration (nếu có)
- [ ] `useUpdateUser.onSuccess` không bị invalidate detail (predicate đúng)
- [ ] `buildPageQuery` với `page=0,size=10` đúng query string khi BE 0-indexed

---

## 11. Risks & open questions

| Risk | Mức | Mitigation |
|---|---|---|
| Endpoint `GET /api/v1/roles` chưa có | Med | §9.1 phương án (b) → (a) tạm |
| BE GET detail trả stale sau PUT | Low | Đã có pattern setQueryData từ fix Student |
| Page index BE lệch (0 vs 1) | Low | Smoke test page=0 và page=1, sửa util |
| Khi sửa email user, conflict với student có cùng email | Med | BE đã check qua `email already exists` → FE chỉ surface |
| User module có thể tạo trùng student (`role=STUDENT`) | Low | UX phải khóa role STUDENT khỏi dropdown — chỉ cho 4 role nhân sự |

**Open:**
- Có cần cho phép manager xem user của mình không? Hay chỉ thấy người khác?
- Có hỗ trợ deactivate (soft delete) thay vì DELETE hẳn không? Guide 2 chỉ có DELETE cứng.

---

## 12. Acceptance criteria

- [ ] 5 endpoint của Guide 2 đã wire vào FE, kiểm tra được trên DevTools Network.
- [ ] Một sidebar item mới "Quản lý nhân sự" xuất hiện sau "Lớp học", active state hoạt động.
- [ ] CRUD đầy đủ cho user nhân sự, có pagination + search + filter role.
- [ ] Code build sạch `tsc --noEmit`, không warning lint.
- [ ] Không reuse path `/api/v1/users` cho luồng tạo Student (giữ nguyên `/manager/student/register`).
- [ ] Update PR description tham chiếu Guide 2 + plan này.

---

## 13. Bước triển khai gợi ý (theo thứ tự)

1. Tạo `src/features/admin-users/types.ts` + `api/users.ts` với fetchers thuần (không hook) → smoke 1 call list để verify shape + page index.
2. Bọc hooks React Query, áp pattern `setQueryData` + predicate invalidate.
3. Tạo `paths.adminPortalUsers` + route loader + route component placeholder.
4. Build skeleton `UserManagement` (chỉ list + empty state) → wire navbar item.
5. Thêm modal tạo user (verify endpoint Role có sẵn không, chốt §9.1).
6. Thêm modal chi tiết + edit + delete.
7. Polish: search, filter role, pagination control, error toasts.
8. Test plan §10.
