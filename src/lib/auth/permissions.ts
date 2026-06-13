import type { AuthRoleName } from '@/lib/auth/auth-api';

/**
 * Ý nghĩa: Tập trung toàn bộ luật phân quyền phía frontend ở một chỗ để
 * router, sidebar và các form dùng chung một nguồn sự thật.
 */

/**
 * Các vai trò được phép mở Admin Portal.
 * Hệ thống không có role ADMIN — TEACHER chính là vai trò admin.
 */
export const ADMIN_PORTAL_ROLES: AuthRoleName[] = ['MANAGER', 'TEACHER', 'TA'];

/**
 * Các vai trò được phép truy cập Exam Services (ngân hàng câu hỏi, phòng thi, OMR).
 * TEACHER và TA được phép; MANAGER bị chặn.
 */
export const EXAM_SERVICES_ROLES: AuthRoleName[] = ['TEACHER', 'TA'];

/**
 * Các vai trò được phép truy cập Management Services (vận hành, nhân sự, tài chính...).
 * TA chỉ làm việc trong Exam Services nên bị chặn khỏi nhóm này.
 */
export const MANAGEMENT_SERVICES_ROLES: AuthRoleName[] = ['MANAGER', 'TEACHER'];

/**
 * Kiểm tra một vai trò có được truy cập Exam Services hay không.
 * Dùng chung cho router (RoleGuard) và sidebar để tránh lệch luật phân quyền.
 */
export function canAccessExamServices(roleName?: AuthRoleName | null): boolean {
  return roleName != null && EXAM_SERVICES_ROLES.includes(roleName);
}

export function canAccessManagementServices(roleName?: AuthRoleName | null): boolean {
  return roleName != null && MANAGEMENT_SERVICES_ROLES.includes(roleName);
}

/** Các vai trò mà MANAGER KHÔNG được phép tạo / gán cho nhân sự. */
export const MANAGER_FORBIDDEN_ROLE_NAMES = [] as const;

/**
 * Lọc danh sách vai trò mà người dùng hiện tại được phép gán khi tạo/sửa nhân sự.
 * Hiện mọi actor đều gán được mọi vai trò nhân sự (TEACHER, MANAGER, TA, COLAB_TEACHER).
 */
export function filterAssignableRoles<T extends { name: string }>(
  options: T[],
  actorRole?: AuthRoleName | null,
): T[] {
  if (actorRole === 'MANAGER') {
    return options.filter(
      (option) => !MANAGER_FORBIDDEN_ROLE_NAMES.includes(option.name as never),
    );
  }

  return options;
}
