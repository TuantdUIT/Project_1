import type { ResUserDTO, StaffRoleName, StaffRoleOption } from '@/features/admin/types';

const STAFF_ROLE_NAMES: StaffRoleName[] = ['MANAGER', 'TEACHER', 'TA', 'ADMIN'];

export const FALLBACK_STAFF_ROLES: StaffRoleOption[] = [
  { id: 1, name: 'MANAGER', description: 'Quản lý vận hành' },
  { id: 2, name: 'TA', description: 'Trợ giảng' },
  { id: 3, name: 'TEACHER', description: 'Giáo viên' },
  { id: 4, name: 'ADMIN', description: 'Quản trị hệ thống' },
];

export function isStaffRoleName(value?: string | null): value is StaffRoleName {
  return STAFF_ROLE_NAMES.includes(value as StaffRoleName);
}

export function isStaffUser(user: ResUserDTO) {
  return isStaffRoleName(user.role?.name);
}

export function buildStaffRoleOptions(users: ResUserDTO[]): StaffRoleOption[] {
  const byName = new Map<StaffRoleName, StaffRoleOption>();

  for (const user of users) {
    const role = user.role;

    if (isStaffRoleName(role?.name) && role.id != null) {
      byName.set(role.name, {
        id: role.id,
        name: role.name,
        description: role.description,
      });
    }
  }

  for (const role of FALLBACK_STAFF_ROLES) {
    if (!byName.has(role.name)) {
      byName.set(role.name, role);
    }
  }

  return STAFF_ROLE_NAMES
    .map((name) => byName.get(name))
    .filter((role): role is StaffRoleOption => Boolean(role));
}
