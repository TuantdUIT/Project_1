import type { DayOfWeek } from '@/features/timetable-template/types';

export const HOUR_HEIGHT_PX = 80;
export const COMPACT_HOUR_HEIGHT_PX = 50;
export const GRID_FALLBACK_START_HOUR = 6;
export const GRID_FALLBACK_END_HOUR = 22;
export const DEFAULT_LESSON_DURATION_MINUTES = 60;

export const DAY_OF_WEEK_ORDER = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
] as const satisfies readonly DayOfWeek[];

export const DAY_OF_WEEK_LABEL = {
  MONDAY: 'THỨ 2',
  TUESDAY: 'THỨ 3',
  WEDNESDAY: 'THỨ 4',
  THURSDAY: 'THỨ 5',
  FRIDAY: 'THỨ 6',
  SATURDAY: 'THỨ 7',
  SUNDAY: 'CHỦ NHẬT',
} as const satisfies Record<DayOfWeek, string>;

export function dayOfWeekIndex(dayOfWeek: string | undefined) {
  if (!dayOfWeek) return -1;
  return DAY_OF_WEEK_ORDER.indexOf(dayOfWeek as DayOfWeek);
}

export function parseHHmm(value: string | undefined) {
  if (!value) return null;
  const match = /^(\d{2}):(\d{2})(?::\d{2})?$/.exec(value.trim());
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour > 23 || minute > 59) {
    return null;
  }

  return hour * 60 + minute;
}

export function formatMinutes(totalMinutes: number) {
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}
