import type { Lesson, StudyWeek } from '@/features/Management_Services/study-week/types';
import { formatDate as formatDateUtil, formatDateShort, formatTime } from '@/utils/date';

export function formatDate(value?: string, withYear = true) {
  return withYear ? formatDateUtil(value, '-') : formatDateShort(value, '-');
}

export function formatWeekLabel(week: StudyWeek) {
  return `Tuần ${week.week_number ?? '?'} - ${week.school_year ?? '-'} - ${formatDate(
    week.week_start_date,
    false,
  )} -> ${formatDate(week.week_end_date, false)}`;
}

export function formatLessonDate(lesson: Lesson) {
  return formatDate(lesson.lesson_date, false);
}

export function formatLessonTime(value?: string) {
  return formatTime(value);
}

export function normalizeTwentyFourHourInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4);

  if (digits.length <= 2) return digits;

  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

function parseTimeToMinutes(value?: string | null) {
  if (!value) return null;

  const normalized = value.trim().slice(0, 5);
  const match = /^(\d{2}):(\d{2})$/.exec(normalized);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

  return hours * 60 + minutes;
}

function formatMinutesToTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function getLessonEndTime(startTime?: string | null, realLessonLength?: number | null) {
  const startMinutes = parseTimeToMinutes(startTime);
  if (startMinutes == null) return '';
  if (!realLessonLength || realLessonLength <= 0) return '';

  const endMinutes = startMinutes + realLessonLength;
  if (endMinutes > 23 * 60 + 59) return '';

  return formatMinutesToTime(endMinutes);
}

export function getLessonLengthFromEndTime(startTime?: string | null, endTime?: string | null) {
  if (!endTime?.trim()) return 0;

  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);

  if (startMinutes == null || endMinutes == null) return null;
  if (endMinutes < startMinutes) return null;

  return endMinutes - startMinutes;
}
