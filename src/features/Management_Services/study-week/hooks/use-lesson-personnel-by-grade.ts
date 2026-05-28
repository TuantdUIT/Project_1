import { useMemo } from 'react';
import { useEmployeeRATemplateByTimetableTemplate } from '@/features/Management_Services/employee-ra-template';
import { buildPersonnelByLessonUuid } from '@/features/Management_Services/study-week/lib/lesson-personnel';
import type { Lesson } from '@/features/Management_Services/study-week/types';
import { useTemplateByGradeIdQuery } from '@/features/Management_Services/timetable-template/api/templates';

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
