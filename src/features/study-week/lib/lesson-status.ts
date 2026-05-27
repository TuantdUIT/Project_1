import { LessonStatus, type Lesson } from '@/features/study-week/types';

export function getEffectiveLessonStatus(lesson: Lesson): LessonStatus {
  if (lesson.manual_lesson_status) {
    return lesson.manual_lesson_status as LessonStatus;
  }

  return (lesson.lesson_status as LessonStatus | undefined) ?? LessonStatus.NOT_STARTED;
}

export function getLessonStatusLabel(status: LessonStatus) {
  if (status === LessonStatus.IN_PROGRESS) return 'In Progress';
  if (status === LessonStatus.COMPLETED) return 'Completed';
  return 'Not Started';
}

export function getLessonStatusClass(status: LessonStatus) {
  if (status === LessonStatus.IN_PROGRESS) return 'bg-amber-50 text-amber-700';
  if (status === LessonStatus.COMPLETED) return 'bg-emerald-50 text-emerald-700';
  return 'bg-slate-100 text-slate-600';
}
