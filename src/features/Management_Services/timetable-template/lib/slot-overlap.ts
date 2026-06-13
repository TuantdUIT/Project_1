import { formatMinutes, parseHHmm } from './time';
import type { LessonType } from '../types';

/**
 * Logic thuần phát hiện chồng giờ giữa các tiết. Tách khỏi UI để tái dùng:
 *   - timetable-template-detail-modal (A): cảnh báo 2 tiết chồng giờ.
 *   - employee-ra-template/lib/availability (B): import `intervalsOverlap` để
 *     phát hiện nhân sự bị double-booking.
 */

const DEFAULT_DURATION_MINUTES = 60;

/** Hai khoảng [aStart, aEnd) và [bStart, bEnd) có giao nhau không (đơn vị: phút). */
export function intervalsOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/** Bảng tra thời lượng (phút) theo lesson_type_uuid. Thiếu → fallback 60'. */
export function buildDurationByLessonType(lessonTypes: LessonType[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const lessonType of lessonTypes) {
    if (lessonType.lesson_type_uuid) {
      map.set(lessonType.lesson_type_uuid, lessonType.lesson_time ?? DEFAULT_DURATION_MINUTES);
    }
  }
  return map;
}

export type TimetableOverlap = {
  dayOfWeek: string;
  firstLabel: string;
  secondLabel: string;
};

type OverlapInput = {
  lesson_type_uuid?: string;
  lesson_type_name?: string;
  day_of_week?: string;
  start_time?: string;
};

/**
 * Tìm các cặp tiết CÙNG `day_of_week` có khoảng [start, start+duration) giao nhau.
 * Duration lấy theo lesson_type; thiếu → 60'.
 */
export function findTimetableOverlaps(
  items: OverlapInput[],
  durationByLessonType: Map<string, number>,
): TimetableOverlap[] {
  type Interval = { day: string; start: number; end: number; label: string };
  const byDay = new Map<string, Interval[]>();

  for (const item of items) {
    const start = parseHHmm(item.start_time);
    if (start == null || !item.day_of_week) continue;

    const duration = durationByLessonType.get(item.lesson_type_uuid ?? '') ?? DEFAULT_DURATION_MINUTES;
    const interval: Interval = {
      day: item.day_of_week,
      start,
      end: start + duration,
      label: `${item.lesson_type_name ?? '—'} (${formatMinutes(start)})`,
    };

    const list = byDay.get(item.day_of_week);
    if (list) list.push(interval);
    else byDay.set(item.day_of_week, [interval]);
  }

  const overlaps: TimetableOverlap[] = [];
  for (const list of byDay.values()) {
    for (let i = 0; i < list.length; i += 1) {
      for (let j = i + 1; j < list.length; j += 1) {
        if (intervalsOverlap(list[i].start, list[i].end, list[j].start, list[j].end)) {
          overlaps.push({
            dayOfWeek: list[i].day,
            firstLabel: list[i].label,
            secondLabel: list[j].label,
          });
        }
      }
    }
  }
  return overlaps;
}
