import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { useLessonTypesQuery } from '@/features/curriculum';
import {
  employeeRATemplateByTimetableTemplateKey,
  type EmployeeRATemplate,
  getEmployeeRATemplateByTimetableTemplateId,
} from '@/features/employee-ra-template';
import { attachPersonnelToTimetableItems } from '@/features/employee-ra-template/lib/personnel-by-slot';
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

  const timetableTemplateUuids = useMemo(
    () =>
      Array.from(templatesByGradeId.values())
        .map((template) => template?.timetable_template_uuid)
        .filter((uuid): uuid is string => Boolean(uuid)),
    [templatesByGradeId],
  );

  const personnelQueries = useQueries({
    queries: timetableTemplateUuids.map((ttUuid) => ({
      queryKey: employeeRATemplateByTimetableTemplateKey(ttUuid),
      queryFn: () => getEmployeeRATemplateByTimetableTemplateId(ttUuid),
      enabled: Boolean(ttUuid),
      retry: false,
    })),
  });

  const personnelTemplatesByUuid = useMemo(() => {
    const map = new Map<string, EmployeeRATemplate | undefined>();
    personnelQueries.forEach((query, index) => {
      const ttUuid = timetableTemplateUuids[index];
      if (ttUuid) {
        map.set(ttUuid, query.data);
      }
    });
    return map;
  }, [personnelQueries, timetableTemplateUuids]);

  const items = useMemo(
    () =>
      attachPersonnelToTimetableItems(
        mergeItemsForPrimary(primaryGradeId, templatesByGradeId),
        personnelTemplatesByUuid,
      ),
    [personnelTemplatesByUuid, primaryGradeId, templatesByGradeId],
  );

  const failedGradeIds = templateQueries.flatMap((query, index) => {
    const gradeId = gradeIds[index];
    return query.isError && gradeId != null ? [gradeId] : [];
  });
  const failedLabels = failedGradeIds.map(
    (id) => GRADE_BADGE_BY_ID[id] ?? `#${id}`,
  );
  const isTemplateLoading = templateQueries.some((query) => query.isPending || query.isFetching);
  const isPersonnelLoading = personnelQueries.some((query) => query.isPending || query.isFetching);
  const allTemplateQueriesFailed =
    templateQueries.length > 0 && templateQueries.every((query) => query.isError);

  function refetchFailed() {
    templateQueries.forEach((query) => {
      if (query.isError) {
        query.refetch();
      }
    });
    personnelQueries.forEach((query) => {
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
    isLoading: lessonTypesQuery.isLoading || isTemplateLoading || isPersonnelLoading,
    isError: lessonTypesQuery.isError || allTemplateQueriesFailed,
    hasPartialError: failedGradeIds.length > 0 && !allTemplateQueriesFailed,
    allTemplateQueriesFailed,
    refetchFailed,
    refetchAll: () => {
      lessonTypesQuery.refetch();
      templateQueries.forEach((query) => query.refetch());
      personnelQueries.forEach((query) => query.refetch());
    },
  };
}
