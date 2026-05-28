import { formatMinutes, parseHHmm } from '@/features/Management_Services/timetable-template/lib/time';

type SlotKeySource = {
  lesson_type_uuid?: string;
  day_of_week?: string;
  start_time?: string;
};

export function makeSlotKey(source: SlotKeySource) {
  const lessonTypeUuid = source.lesson_type_uuid?.trim();
  const dayOfWeek = source.day_of_week?.trim();
  const startMinutes = parseHHmm(source.start_time);

  if (!lessonTypeUuid || !dayOfWeek || startMinutes == null) {
    return null;
  }

  return `${lessonTypeUuid}|${dayOfWeek}|${formatMinutes(startMinutes)}`;
}
