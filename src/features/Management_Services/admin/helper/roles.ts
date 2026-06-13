import type { ResUserDTO, StaffRoleName, StaffRoleOption } from '@/features/Management_Services/admin/types';

/**
 * Danh sách vai trò nhân sự kèm ID khớp CHÍNH XÁC với bảng `roles` của backend.
 * Nguồn ID (bảng roles): STUDENT=1, TEACHER=2, MANAGER=3, TA=4, COLAB_TEACHER=5.
 *
 * - Loại STUDENT (id 1) vì màn này chỉ quản lý nhân sự.
 * - Không có role ADMIN trong hệ thống: TEACHER chính là vai trò admin.
 *
 * TODO: thay bằng dữ liệu từ `GET /api/v1/roles` khi backend cung cấp endpoint,
 * để không phải hardcode ID nữa.
 */
export const STAFF_ROLES: StaffRoleOption[] = [
  { id: 2, name: 'TEACHER', description: 'Giáo viên' },
  { id: 3, name: 'MANAGER', description: 'Quản lý vận hành' },
  { id: 4, name: 'TA', description: 'Trợ giảng' },
  { id: 5, name: 'COLAB_TEACHER', description: 'Giáo viên cộng tác' },
];

const STAFF_ROLE_NAMES: StaffRoleName[] = STAFF_ROLES.map((role) => role.name);

export function isStaffRoleName(value?: string | null): value is StaffRoleName {
  return STAFF_ROLE_NAMES.includes(value as StaffRoleName);
}

export function isStaffUser(user: ResUserDTO) {
  return isStaffRoleName(user.role?.name);
}

/**
 * Trả về danh sách vai trò nhân sự để render dropdown.
 * Dùng nguồn hardcode `STAFF_ROLES` (ID đúng, không trùng) thay vì suy ra từ
 * danh sách user — vốn là nguyên nhân gây trùng ID khiến select bị nhảy chọn.
 */
export function buildStaffRoleOptions(): StaffRoleOption[] {
  return STAFF_ROLES;
}
