import { parseHHmm } from '@/features/Management_Services/timetable-template/lib/time';
import { intervalsOverlap } from '@/features/Management_Services/timetable-template/lib/slot-overlap';

/**
 * Logic thuần phát hiện nhân sự bị double-booking trong MỘT RA template:
 * cùng một người được gán cho 2 slot CÙNG ngày có khoảng giờ giao nhau.
 *
 * Phạm vi: trong cùng template (1 khối). Chưa quét cross-grade (sẽ cần load
 * thêm RA template các khối khác — để mở rộng sau).
 */

const DEFAULT_DURATION_MINUTES = 60;

export type AvailabilitySlot = {
  key: string;
  lessonTypeId: string;
  lessonTypeName: string;
  dayOfWeek: string;
  startTime: string;
};

export type PersonnelConflict = {
  userUuid: string;
  dayOfWeek: string;
  firstLabel: string;
  secondLabel: string;
};

export function findPersonnelConflicts(
  personnelBySlot: Record<string, string[]>,
  slots: AvailabilitySlot[],
  durationByLessonType: Map<string, number>,
): PersonnelConflict[] {
  type Interval = { day: string; start: number; end: number; label: string };
  const byUser = new Map<string, Interval[]>();

  for (const slot of slots) {
    const start = parseHHmm(slot.startTime);
    if (start == null) continue;

    const duration = durationByLessonType.get(slot.lessonTypeId) ?? DEFAULT_DURATION_MINUTES;
    const interval: Interval = {
      day: slot.dayOfWeek,
      start,
      end: start + duration,
      label: `${slot.lessonTypeName} (${slot.startTime})`,
    };

    for (const userUuid of personnelBySlot[slot.key] ?? []) {
      const list = byUser.get(userUuid);
      if (list) list.push(interval);
      else byUser.set(userUuid, [interval]);
    }
  }

  const conflicts: PersonnelConflict[] = [];
  for (const [userUuid, list] of byUser) {
    for (let i = 0; i < list.length; i += 1) {
      for (let j = i + 1; j < list.length; j += 1) {
        if (
          list[i].day === list[j].day
          && intervalsOverlap(list[i].start, list[i].end, list[j].start, list[j].end)
        ) {
          conflicts.push({
            userUuid,
            dayOfWeek: list[i].day,
            firstLabel: list[i].label,
            secondLabel: list[j].label,
          });
        }
      }
    }
  }
  return conflicts;
}
