import { useMemo } from 'react';
import { useLessonsQuery } from '@/features/study-week/api/lessons';

export function useLessonsByWeekAndGrade(weekUuid?: string, gradeId?: number) {
  const lessonsQuery = useLessonsQuery();

  const lessons = useMemo(
    () =>
      (lessonsQuery.data ?? [])
        .filter(
          (lesson) =>
            lesson.study_week?.week_uuid === weekUuid
            && lesson.grade?.id === gradeId,
        )
        .sort((a, b) =>
          `${a.lesson_date ?? ''} ${a.lesson_start_time ?? ''}`.localeCompare(
            `${b.lesson_date ?? ''} ${b.lesson_start_time ?? ''}`,
          ),
        ),
    [gradeId, lessonsQuery.data, weekUuid],
  );

  return {
    ...lessonsQuery,
    lessons,
  };
}

