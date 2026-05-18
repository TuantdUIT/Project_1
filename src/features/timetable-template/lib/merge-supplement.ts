/**
 * SHARE UTIL — Merge timetable items theo quan hệ "primary ⇐ supplements".
 *
 * Logic "merge K12 + VDC + DGNL thành section K12 với badge" cần chạy ở 2 nơi:
 *
 *   Nơi 1: View per-grade K12 (/admin-portal/timetable/grade/3).
 *   Nơi 2: Section K12 trong view "Tất cả" (/admin-portal/timetable/all).
 *
 * Nếu viết riêng 2 lần, sẽ có 2 đoạn code giống nhau ở 2 file → khi sửa logic
 * (vd đổi cách gắn badge), phải nhớ sửa cả 2 chỗ. Dễ quên → bug.
 *
 * Giải pháp "share util": tách logic ra 1 hàm riêng (file này) để cả 2 view
 * cùng import dùng. Khi cần đổi logic merge → sửa 1 chỗ duy nhất.
 */

import type { MergedTimetableItem, TimetableTemplate } from '../types';
import {
  GRADE_BADGE_BY_ID,
  SUPPLEMENT_GRADE_IDS_BY_PRIMARY_ID,
  type PrimaryGradeId,
} from './supplement-grades';

export type TemplatesByGradeId = ReadonlyMap<number, TimetableTemplate | undefined>;

/**
 * Trả về mảng items đã merge cho 1 primary grade.
 * - Lấy items của template chính (primaryId).
 * - Gộp thêm items của tất cả supplement templates.
 * - Mỗi item được gắn `_source_grade_id`, `_source_grade_name` để badge biết nguồn.
 */
export function mergeItemsForPrimary(
  primaryId: PrimaryGradeId,
  templatesByGradeId: TemplatesByGradeId,
): MergedTimetableItem[] {
  const supplementIds = SUPPLEMENT_GRADE_IDS_BY_PRIMARY_ID[primaryId] ?? [];
  const gradeIds = [primaryId, ...supplementIds];

  return gradeIds.flatMap((gradeId) => {
    const template = templatesByGradeId.get(gradeId);
    if (!template) return [];

    const resolvedName = template.grade?.name ?? GRADE_BADGE_BY_ID[gradeId] ?? `#${gradeId}`;
    const resolvedId = template.grade?.id ?? gradeId;

    return (template.items ?? []).map<MergedTimetableItem>((item) => ({
      ...item,
      _source_grade_id: resolvedId,
      _source_grade_name: resolvedName,
      _template_uuid: template.timetable_template_uuid,
    }));
  });
}

/**
 * Build Map<gradeId, template> từ mảng templates (vd của `GET /api/v1/timetable-templates`).
 * Mặc định lọc `active=true`. Nếu cùng gradeId có nhiều template active,
 * chọn cái có `apply_from` mới nhất.
 */
export function buildTemplatesByGradeId(
  templates: readonly TimetableTemplate[],
  options: { activeOnly?: boolean } = {},
): TemplatesByGradeId {
  const activeOnly = options.activeOnly ?? true;
  const filtered = activeOnly
    ? templates.filter((template) => template.active === true)
    : [...templates];

  filtered.sort((a, b) => (b.apply_from ?? '').localeCompare(a.apply_from ?? ''));

  const map = new Map<number, TimetableTemplate>();
  for (const template of filtered) {
    const id = template.grade?.id;
    if (id == null) continue;
    if (!map.has(id)) {
      map.set(id, template);
    }
  }
  return map;
}
