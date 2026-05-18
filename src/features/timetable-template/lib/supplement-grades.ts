/**
 * Hardcode quan hệ "khối chính ⇐ khối ảo cần ghép vào view".
 *
 * Dùng gradeID làm khoá (không dùng tên) — ID khớp với DB hiện tại
 * (xem `GET /api/v1/grades`): K10=1, K11=2, K12=3, VDC=4, DGNL=5.
 *
 * Khi nghiệp vụ đổi (thêm grade ảo mới, đổi mapping, đổi ID), sửa duy nhất file này.
 */

export const PRIMARY_GRADE_IDS = [1, 2, 3] as const;
export type PrimaryGradeId = (typeof PRIMARY_GRADE_IDS)[number];

export const SUPPLEMENT_GRADE_IDS_BY_PRIMARY_ID: Record<PrimaryGradeId, readonly number[]> = {
  1: [],
  2: [],
  3: [4, 5],
};

export const GRADE_DISPLAY_NAME_BY_ID: Record<number, string> = {
  1: 'Khối 10',
  2: 'Khối 11',
  3: 'Khối 12',
  4: 'VDC',
  5: 'DGNL',
};

export const GRADE_BADGE_BY_ID: Record<number, string> = {
  1: 'K10',
  2: 'K11',
  3: 'K12',
  4: 'VDC',
  5: 'DGNL',
};

export function isPrimaryGradeId(gradeId: number): gradeId is PrimaryGradeId {
  return (PRIMARY_GRADE_IDS as readonly number[]).includes(gradeId);
}

export function gradeDisplayName(gradeId: number | undefined, fallback?: string): string {
  if (gradeId == null) return fallback ?? '—';
  return GRADE_DISPLAY_NAME_BY_ID[gradeId] ?? fallback ?? `Khối #${gradeId}`;
}

export function gradeBadge(gradeId: number | undefined, fallback?: string): string {
  if (gradeId == null) return fallback ?? '?';
  return GRADE_BADGE_BY_ID[gradeId] ?? fallback ?? `#${gradeId}`;
}

export function primaryGradeTitle(primaryId: PrimaryGradeId): string {
  const base = GRADE_DISPLAY_NAME_BY_ID[primaryId] ?? `Khối #${primaryId}`;
  const supplementIds = SUPPLEMENT_GRADE_IDS_BY_PRIMARY_ID[primaryId];
  if (supplementIds.length === 0) return base;
  const supplementNames = supplementIds.map((id) => GRADE_BADGE_BY_ID[id] ?? `#${id}`);
  return `${base}`;
}
