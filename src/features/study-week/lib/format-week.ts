import type { Lesson, StudyWeek } from '@/features/study-week/types';
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
