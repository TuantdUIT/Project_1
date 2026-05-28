import { makeSlotKey } from '@/features/Management_Services/employee-ra-template/lib/slot-key';
import type {
  EmployeeRATemplate,
  EmployeeRATemplateItem,
} from '@/features/Management_Services/employee-ra-template/types';
import type { Lesson } from '@/features/Management_Services/study-week/types';
import type { DayOfWeek } from '@/features/Management_Services/timetable-template/types';

export const UNASSIGNED_PERSONNEL_MESSAGE = 'Buổi học này chưa sắp xếp nhân sự';

const DAY_OF_WEEK_BY_JS_DAY: DayOfWeek[] = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
];

export function dayOfWeekFromLessonDate(value?: string) {
  if (!value) return undefined;

  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return undefined;

  return DAY_OF_WEEK_BY_JS_DAY[date.getDay()];
}

export function makeLessonPersonnelSlotKey(lesson: Lesson) {
  return makeSlotKey({
    lesson_type_uuid: lesson.lesson_type?.lesson_type_uuid,
    day_of_week: dayOfWeekFromLessonDate(lesson.lesson_date),
    start_time: lesson.lesson_start_time,
  });
}

export function getTemplatePersonnelForLesson(
  lesson: Lesson,
  template: EmployeeRATemplate | undefined,
) {
  const lessonSlotKey = makeLessonPersonnelSlotKey(lesson);
  if (!lessonSlotKey) return [];

  return (template?.items ?? [])
    .filter((item) => makeSlotKey(item) === lessonSlotKey)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

export function buildPersonnelByLessonUuid(
  lessons: Lesson[],
  template: EmployeeRATemplate | undefined,
) {
  const map = new Map<string, EmployeeRATemplateItem[]>();

  for (const lesson of lessons) {
    const lessonUuid = lesson.lesson_uuid;
    if (!lessonUuid) continue;
    map.set(lessonUuid, getTemplatePersonnelForLesson(lesson, template));
  }

  return map;
}
