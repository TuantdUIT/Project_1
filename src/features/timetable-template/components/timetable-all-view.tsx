import { useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { useLessonTypesQuery } from '@/features/curriculum';
import { useTimetableTemplatesQuery } from '@/features/timetable-template/api/templates';
import {
  buildTemplatesByGradeId,
  mergeItemsForPrimary,
} from '@/features/timetable-template/lib/merge-supplement';
import {
  PRIMARY_GRADE_IDS,
  SUPPLEMENT_GRADE_IDS_BY_PRIMARY_ID,
  primaryGradeTitle,
} from '@/features/timetable-template/lib/supplement-grades';
import TimetableFilterChips from './timetable-filter-chips';
import TimetableGrid from './timetable-grid';

export default function TimetableAllView() {
  const templatesQuery = useTimetableTemplatesQuery();
  const lessonTypesQuery = useLessonTypesQuery();

  const templatesByGradeId = useMemo(
    () => buildTemplatesByGradeId(templatesQuery.data ?? [], { activeOnly: true }),
    [templatesQuery.data],
  );

  if (templatesQuery.isLoading || lessonTypesQuery.isLoading) {
    return (
      <div className="space-y-5">
        <TimetableFilterChips />
        <div className="h-[420px] animate-pulse rounded-2xl bg-slate-100" />
      </div>
    );
  }

  if (templatesQuery.isError || lessonTypesQuery.isError) {
    return (
      <div className="space-y-5">
        <TimetableFilterChips />
        <div className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-rose-700 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[14px] font-bold">Không tải được danh sách mẫu thời gian.</p>
          <button
            type="button"
            onClick={() => {
              templatesQuery.refetch();
              lessonTypesQuery.refetch();
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
      <TimetableFilterChips />

      {PRIMARY_GRADE_IDS.map((primaryId) => {
        const items = mergeItemsForPrimary(primaryId, templatesByGradeId);
        const hasSupplement = SUPPLEMENT_GRADE_IDS_BY_PRIMARY_ID[primaryId].length > 0;
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
                hideBadges={!hasSupplement}
                items={items}
                lessonTypes={lessonTypesQuery.data ?? []}
                emptyMessage={`${primaryGradeTitle(primaryId)} chưa có mẫu thời gian.`}
              />
            </div>
          </section>
        );
      })}
    </div>
  );
}

