import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { useLessonTypesQuery } from '@/features/curriculum';
import {
  employeeRATemplateByTimetableTemplateKey,
  type EmployeeRATemplate,
  getEmployeeRATemplateByTimetableTemplateId,
} from '@/features/employee-ra-template';
import { attachPersonnelToTimetableItems } from '@/features/employee-ra-template/lib/personnel-by-slot';
import { useTimetableTemplatesQuery } from '@/features/timetable-template/api/templates';
import {
  buildTemplatesByGradeId,
  mergeItemsForPrimary,
} from '@/features/timetable-template/lib/merge-supplement';
import {
  PRIMARY_GRADE_IDS,
  primaryGradeTitle,
} from '@/features/timetable-template/lib/supplement-grades';
import TimetableFilterChips from './timetable-filter-chips';
import TimetableGrid from './timetable-grid';
import WeekSpinner from './week-spinner';

export default function TimetableAllView() {
  const templatesQuery = useTimetableTemplatesQuery();
  const lessonTypesQuery = useLessonTypesQuery();

  const templatesByGradeId = useMemo(
    () => buildTemplatesByGradeId(templatesQuery.data ?? [], { activeOnly: true }),
    [templatesQuery.data],
  );

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

  const isPersonnelLoading = personnelQueries.some((query) => query.isPending || query.isFetching);

  if (templatesQuery.isLoading || lessonTypesQuery.isLoading || isPersonnelLoading) {
    return (
      <div className="space-y-5">
        <WeekSpinner />
        <TimetableFilterChips />
        <div className="h-[420px] animate-pulse rounded-2xl bg-slate-100" />
      </div>
    );
  }

  if (templatesQuery.isError || lessonTypesQuery.isError) {
    return (
      <div className="space-y-5">
        <WeekSpinner />
        <TimetableFilterChips />
        <div className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-rose-700 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[14px] font-bold">Không tải được danh sách Thời Khóa Biểu.</p>
          <button
            type="button"
            onClick={() => {
              templatesQuery.refetch();
              lessonTypesQuery.refetch();
              personnelQueries.forEach((query) => query.refetch());
            }}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-rose-600 px-3 text-[13px] font-black text-white transition hover:bg-rose-700"
          >
            <RefreshCw size={14} />
            Tải lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <WeekSpinner />
      <TimetableFilterChips />

      {PRIMARY_GRADE_IDS.map((primaryId) => {
        const items = attachPersonnelToTimetableItems(
          mergeItemsForPrimary(primaryId, templatesByGradeId),
          personnelTemplatesByUuid,
        );
        const template = templatesByGradeId.get(primaryId);

        return (
          <section
            key={primaryId}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.12)]"
          >
            <div className="flex flex-col gap-1 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[12px] font-black uppercase tracking-[0.14em] text-slate-400">
                  Timetable template
                </p>
                <h2 className="mt-1 text-[18px] font-black text-slate-950">
                  {primaryGradeTitle(primaryId)}
                </h2>
              </div>
              {template ? (
                <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-[12px] font-black text-emerald-700">
                  Active · {template.apply_from ?? '—'}
                </span>
              ) : (
                <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-[12px] font-black text-slate-500">
                  Chưa có active template
                </span>
              )}
            </div>
            <div className="p-4">
              <TimetableGrid
                items={items}
                lessonTypes={lessonTypesQuery.data ?? []}
                emptyMessage={`${primaryGradeTitle(primaryId)} chưa có Thời Khóa Biểu.`}
              />
            </div>
          </section>
        );
      })}
    </div>
  );
}
