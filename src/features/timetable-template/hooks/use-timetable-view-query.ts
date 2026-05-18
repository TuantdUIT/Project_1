import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { useLessonTypesQuery } from '@/features/curriculum';
import { getTemplateByGradeId } from '@/features/timetable-template/api/templates';
import {
  mergeItemsForPrimary,
  type TemplatesByGradeId,
} from '@/features/timetable-template/lib/merge-supplement';
import {
  GRADE_BADGE_BY_ID,
  SUPPLEMENT_GRADE_IDS_BY_PRIMARY_ID,
  type PrimaryGradeId,
} from '@/features/timetable-template/lib/supplement-grades';
import type { TimetableTemplate } from '@/features/timetable-template/types';

export function useTimetableViewQuery(primaryGradeId: PrimaryGradeId) {
  const lessonTypesQuery = useLessonTypesQuery();

  const gradeIds = useMemo<readonly number[]>(
    () => [primaryGradeId, ...SUPPLEMENT_GRADE_IDS_BY_PRIMARY_ID[primaryGradeId]],
    [primaryGradeId],
  );

  const templateQueries = useQueries({
    queries: gradeIds.map((gradeId) => ({
      queryKey: ['timetable-template', 'by-grade-id', gradeId],
      queryFn: () => getTemplateByGradeId(gradeId),
    })),
  });

  const templatesByGradeId = useMemo<TemplatesByGradeId>(() => {
    const map = new Map<number, TimetableTemplate | undefined>();
    templateQueries.forEach((query, index) => {
      const gradeId = gradeIds[index];
      if (gradeId == null) return;
      if (query.data && query.data.active !== false) {
        map.set(gradeId, query.data);
      }
    });
    return map;
  }, [gradeIds, templateQueries]);

  const items = useMemo(
    () => mergeItemsForPrimary(primaryGradeId, templatesByGradeId),
    [primaryGradeId, templatesByGradeId],
  );

  const failedGradeIds = templateQueries.flatMap((query, index) => {
    const gradeId = gradeIds[index];
    return query.isError && gradeId != null ? [gradeId] : [];
  });
  const failedLabels = failedGradeIds.map(
    (id) => GRADE_BADGE_BY_ID[id] ?? `#${id}`,
  );

  const isTemplateLoading = templateQueries.some((query) => query.isPending || query.isFetching);
  const allTemplateQueriesFailed =
    templateQueries.length > 0 && templateQueries.every((query) => query.isError);

  function refetchFailed() {
    templateQueries.forEach((query) => {
      if (query.isError) {
        query.refetch();
      }
    });
  }

  return {
    gradeIds,
    failedLabels,
    items,
    lessonTypes: lessonTypesQuery.data ?? [],
    isLoading: lessonTypesQuery.isLoading || isTemplateLoading,
    isError: lessonTypesQuery.isError || allTemplateQueriesFailed,
    hasPartialError: failedGradeIds.length > 0 && !allTemplateQueriesFailed,
    allTemplateQueriesFailed,
    refetchFailed,
    refetchAll: () => {
      lessonTypesQuery.refetch();
      templateQueries.forEach((query) => query.refetch());
    },
  };
}
