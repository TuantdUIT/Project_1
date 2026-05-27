import { useMemo } from 'react';
import { useEmployeeRATemplateByTimetableTemplate } from '@/features/employee-ra-template';
import { buildPersonnelByLessonUuid } from '@/features/study-week/lib/lesson-personnel';
import type { Lesson } from '@/features/study-week/types';
import { useTemplateByGradeIdQuery } from '@/features/timetable-template/api/templates';

export function useLessonPersonnelByGrade(lessons: Lesson[], gradeId?: number) {
  const templateQuery = useTemplateByGradeIdQuery(gradeId);
  const timetableTemplateUuid = templateQuery.data?.timetable_template_uuid;
  const personnelTemplateQuery = useEmployeeRATemplateByTimetableTemplate(timetableTemplateUuid);

  const personnelByLessonUuid = useMemo(
    () => buildPersonnelByLessonUuid(lessons, personnelTemplateQuery.data),
    [lessons, personnelTemplateQuery.data],
  );

  return {
    personnelByLessonUuid,
    isLoading: templateQuery.isLoading || personnelTemplateQuery.isLoading,
    isError: templateQuery.isError || personnelTemplateQuery.isError,
    refetch: () => {
      templateQuery.refetch();
      personnelTemplateQuery.refetch();
    },
  };
}
