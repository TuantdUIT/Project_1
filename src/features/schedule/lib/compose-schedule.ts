import dayjs from 'dayjs';
import type { StudyWeek } from '@/features/study-week';
import type { TimetableTemplate } from '@/features/schedule/api/timetable-templates';

const dayOffsets = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
} as const;

export type ScheduleEvent = {
  id: string;
  date: string;
  dayOfWeek: string;
  startTime: string;
  title: string;
  lessonTypeName: string;
};

export function composeSchedule(template?: TimetableTemplate, studyWeek?: StudyWeek): ScheduleEvent[] {
  const startDate = studyWeek?.week_start_date;

  if (!template?.items?.length || !startDate) {
    return [];
  }

  return template.items
    .map((item, index) => {
      const dayOfWeek = item.day_of_week ?? 'MONDAY';
      const offset = dayOffsets[dayOfWeek] ?? 1;
      const date = dayjs(startDate).add(offset, 'day').format('YYYY-MM-DD');

      return {
        id: item.timetable_template_item_uuid ?? `${template.timetable_template_uuid}-${index}`,
        date,
        dayOfWeek,
        startTime: item.start_time ?? '00:00:00',
        title: template.timetable_template_name ?? 'Lịch học',
        lessonTypeName: item.lesson_type_name ?? 'Buổi học',
      };
    })
    .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`));
}
