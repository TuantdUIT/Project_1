import { RefreshCw } from 'lucide-react';
import { useLessonTypesQuery } from '@/features/Management_Services/curriculum';
import { useLessonsQuery } from '@/features/Management_Services/study-week/api/lessons';
import { useWeekSelection } from '@/features/Management_Services/timetable-template/hooks/use-week-selection';
import { buildLessonWeekItems } from '@/features/Management_Services/timetable-template/hooks/use-lessons-week-view-query';
import {
  PRIMARY_GRADE_IDS,
  primaryGradeTitle,
} from '@/features/Management_Services/timetable-template/lib/supplement-grades';
import TimetableFilterChips from './timetable-filter-chips';
import TimetableGrid from './timetable-grid';
import WeekSpinner from './week-spinner';

export default function TimetableAllView() {
  const { selectedWeek } = useWeekSelection();
  const lessonsQuery = useLessonsQuery();
  const lessonTypesQuery = useLessonTypesQuery();

  const isLoading = lessonsQuery.isLoading || lessonTypesQuery.isLoading;
  const isError = lessonsQuery.isError || lessonTypesQuery.isError;

  if (isLoading) {
    return (
      <div className="space-y-5">
        <WeekSpinner />
        <TimetableFilterChips />
        <div className="h-[420px] animate-pulse rounded-2xl bg-slate-100" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-5">
        <WeekSpinner />
        <TimetableFilterChips />
        <div className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-rose-700 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[14px] font-bold">Không tải được buổi học của tuần.</p>
          <button
            type="button"
            onClick={() => {
              lessonsQuery.refetch();
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
      <WeekSpinner />
      <TimetableFilterChips />

      {PRIMARY_GRADE_IDS.map((primaryId) => {
        const items = buildLessonWeekItems(
          lessonsQuery.data ?? [],
          selectedWeek?.week_uuid,
          primaryId,
        );

        return (
          <section
            key={primaryId}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.12)]"
          >
            <div className="flex flex-col gap-1 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[12px] font-black uppercase tracking-[0.14em] text-slate-400">
                  Thời Khóa Biểu tuần
                </p>
                <h2 className="mt-1 text-[18px] font-black text-slate-950">
                  {primaryGradeTitle(primaryId)}
                </h2>
              </div>
            </div>
            <div className="p-4">
              <TimetableGrid
                items={items}
                lessonTypes={lessonTypesQuery.data ?? []}
                emptyMessage={
                  selectedWeek
                    ? `${primaryGradeTitle(primaryId)} chưa có buổi học trong tuần này.`
                    : 'Chưa chọn tuần học.'
                }
              />
            </div>
          </section>
        );
      })}
    </div>
  );
}
