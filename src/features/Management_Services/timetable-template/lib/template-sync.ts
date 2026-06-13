import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateTimetableTemplate } from '@/features/Management_Services/timetable-template/api/templates';
import { updateEmployeeRATemplate } from '@/features/Management_Services/employee-ra-template/api/employee-ra-templates';
import { formatMinutes, parseHHmm } from '@/features/Management_Services/timetable-template/lib/time';
import type {
  ReqUpdateTimetableTemplate,
  TimetableTemplate,
  TimetableTemplateItem,
} from '@/features/Management_Services/timetable-template/types';
import type {
  EmployeeRATemplate,
  EmployeeRATemplateItem,
} from '@/features/Management_Services/employee-ra-template/types';
import type { components } from '@/types/openapi_MS';

type ReqTtItem = components['schemas']['ReqTimetableTemplateItemDTO'];
type ReqRaItem = components['schemas']['ReqEmployeeRATemplateItemDTO'];

/**
 * Ý nghĩa: Điều phối thao tác cập nhật Mẫu thời khóa biểu một cách an toàn cho
 * nhân sự. Vì nhân sự (RA template) ghép với tiết qua khóa
 * `lessonType|day|startTime` chứ không có khóa ngoại, đổi giờ một tiết phải
 * đồng bộ luôn các Mẫu chấm công liên kết, nếu không nhân sự sẽ rớt khỏi slot.
 *
 * Khi có đổi giờ và có nhân sự bị ảnh hưởng, dùng quy trình 3 bước "giữ cả hai
 * giờ" để KHÔNG bao giờ tồn tại khoảnh khắc nhân sự mồ côi:
 *   1. PUT TKB: giữ slot giờ cũ + thêm slot giờ mới (tồn tại song song).
 *   2. PUT từng RA liên kết: dời nhân sự từ giờ cũ sang giờ mới.
 *   3. PUT TKB: bỏ slot giờ cũ (chỉ còn giờ mới).
 *
 * Mọi PUT đều gửi đủ cả mảng items để tránh rủi ro mất dữ liệu nếu backend
 * dùng cơ chế replace.
 */

export type TimetableMetadata = {
  name?: string;
  gradeId?: number;
  schoolYear?: number;
  applyFrom?: string;
  active?: boolean;
};

export type SlotTimeChange = {
  lessonTypeId: string;
  dayOfWeek: string;
  /** Phút trong ngày của giờ cũ — dùng để khớp slot cần đổi. */
  oldMinutes: number;
  /** Giờ mới dạng "HH:mm" (từ input time). */
  newStartTime: string;
};

/** Chuẩn hóa "HH:mm" hoặc "HH:mm:ss" về dạng API "HH:mm:00". */
function toApiTime(value: string) {
  const minutes = parseHHmm(value);
  return minutes == null ? value : `${formatMinutes(minutes)}:00`;
}

function ttItemToReq(item: TimetableTemplateItem, overrideStartTime?: string): ReqTtItem {
  return {
    lessonTypeId: item.lesson_type_uuid ?? '',
    dayOfWeek: (item.day_of_week ?? 'MONDAY') as ReqTtItem['dayOfWeek'],
    startTime: overrideStartTime ? toApiTime(overrideStartTime) : (item.start_time ?? ''),
    sortOrder: item.sort_order ?? 0,
  };
}

function raItemToReq(item: EmployeeRATemplateItem, overrideStartTime?: string): ReqRaItem {
  return {
    lessonTypeId: item.lesson_type_uuid ?? '',
    userUuid: item.user_uuid ?? '',
    dayOfWeek: (item.day_of_week ?? 'MONDAY') as ReqRaItem['dayOfWeek'],
    startTime: overrideStartTime ? toApiTime(overrideStartTime) : (item.start_time ?? ''),
    sortOrder: item.sort_order ?? 0,
  };
}

/** Item (TKB hoặc RA) có khớp với slot giờ-cũ của một thay đổi không. */
function matchesOldSlot(
  item: { lesson_type_uuid?: string; day_of_week?: string; start_time?: string },
  change: SlotTimeChange,
) {
  return (
    item.lesson_type_uuid === change.lessonTypeId
    && item.day_of_week === change.dayOfWeek
    && parseHHmm(item.start_time) === change.oldMinutes
  );
}

export type ApplyTimetableUpdateInput = {
  template: TimetableTemplate;
  metadata: TimetableMetadata;
  changes: SlotTimeChange[];
  linkedRaTemplates: EmployeeRATemplate[];
};

export type ApplyTimetableUpdateResult = {
  syncedRaTemplates: number;
  movedAssignments: number;
};

export async function applyTimetableTemplateUpdate({
  template,
  metadata,
  changes,
  linkedRaTemplates,
}: ApplyTimetableUpdateInput): Promise<ApplyTimetableUpdateResult> {
  const templateUuid = template.timetable_template_uuid;
  if (!templateUuid) {
    throw new Error('Thiếu UUID của mẫu thời khóa biểu.');
  }

  const originalItems = template.items ?? [];
  const ttBody = (items: ReqTtItem[]): ReqUpdateTimetableTemplate => ({ ...metadata, items });

  // Trạng thái TKB cuối cùng: áp giờ mới ngay tại slot tương ứng.
  const finalItems = originalItems.map((item) => {
    const change = changes.find((candidate) => matchesOldSlot(item, candidate));
    return ttItemToReq(item, change?.newStartTime);
  });

  // RA template bị ảnh hưởng = có ít nhất một phân công ở slot giờ-cũ vừa đổi.
  const affected = linkedRaTemplates.filter((raTemplate) =>
    (raTemplate.items ?? []).some((item) => changes.some((change) => matchesOldSlot(item, change))),
  );

  // Không có nhân sự bị ảnh hưởng (đổi giờ slot trống, hoặc chỉ sửa metadata)
  // → một PUT tại chỗ là đủ, không cần quy trình 3 bước.
  if (affected.length === 0) {
    await updateTimetableTemplate(templateUuid, ttBody(finalItems));
    return { syncedRaTemplates: 0, movedAssignments: 0 };
  }

  // Bước 1: TKB giữ giờ cũ + thêm bản sao giờ mới (song song).
  const bothItems: ReqTtItem[] = [
    ...originalItems.map((item) => ttItemToReq(item)),
    ...changes.flatMap((change) => {
      const source = originalItems.find((item) => matchesOldSlot(item, change));
      return source ? [ttItemToReq(source, change.newStartTime)] : [];
    }),
  ];
  await updateTimetableTemplate(templateUuid, ttBody(bothItems));

  // Bước 2: dời nhân sự sang giờ mới trong từng RA liên kết.
  let movedAssignments = 0;
  for (const raTemplate of affected) {
    const items = (raTemplate.items ?? []).map((item) => {
      const change = changes.find((candidate) => matchesOldSlot(item, candidate));
      if (change) movedAssignments += 1;
      return raItemToReq(item, change?.newStartTime);
    });

    if (raTemplate.employee_ra_template_uuid) {
      await updateEmployeeRATemplate(raTemplate.employee_ra_template_uuid, {
        name: raTemplate.employee_ra_template_name ?? undefined,
        timetableTemplateId: raTemplate.timetable_template_uuid ?? undefined,
        items,
      });
    }
  }

  // Bước 3: TKB bỏ slot giờ cũ — chỉ còn trạng thái cuối.
  await updateTimetableTemplate(templateUuid, ttBody(finalItems));

  return { syncedRaTemplates: affected.length, movedAssignments };
}

export function useApplyTimetableTemplateUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: applyTimetableTemplateUpdate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetable-template'] });
      queryClient.invalidateQueries({ queryKey: ['employee-ra-template'] });
    },
  });
}
