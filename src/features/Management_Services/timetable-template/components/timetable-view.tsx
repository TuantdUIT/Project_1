import { CalendarRange } from 'lucide-react';
import { useTimetableViewQuery } from '@/features/Management_Services/timetable-template/hooks/use-timetable-view-query';
import {
  primaryGradeTitle,
  type PrimaryGradeId,
} from '@/features/Management_Services/timetable-template/lib/supplement-grades';
import PartialErrorBanner from './partial-error-banner';
import TimetableFilterChips from './timetable-filter-chips';
import TimetableGrid from './timetable-grid';
import WeekSpinner from './week-spinner';

export default function TimetableView({ primaryGradeId }: { primaryGradeId: PrimaryGradeId }) {
  const viewQuery = useTimetableViewQuery(primaryGradeId);
  const title = primaryGradeTitle(primaryGradeId);

  if (viewQuery.isLoading) {
    return (
      <div className="space-y-5">
        <WeekSpinner />
        <TimetableFilterChips />
        <TimetableTitle title={title} subtitle="Đang tải dữ liệu" />
        <div className="h-[560px] animate-pulse rounded-2xl bg-slate-100" />
      </div>
    );
  }

  if (viewQuery.isError) {
    return (
      <div className="space-y-5">
        <WeekSpinner />
        <TimetableFilterChips />
        <TimetableTitle title={title} subtitle="Thời Khóa Biểu tuần" />
        <PartialErrorBanner
          failedNames={viewQuery.failedLabels}
          tone="danger"
          onRetry={viewQuery.refetchAll}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <WeekSpinner />
      <TimetableFilterChips />
      <TimetableTitle title={title} subtitle="Thời Khóa Biểu tuần" />

      {viewQuery.hasPartialError ? (
        <PartialErrorBanner
          failedNames={viewQuery.failedLabels}
          onRetry={viewQuery.refetchFailed}
        />
      ) : null}

      <TimetableGrid
        items={viewQuery.items}
        lessonTypes={viewQuery.lessonTypes}
        emptyMessage={`${title} chưa có Thời Khóa Biểu.`}
      />
    </div>
  );
}

function TimetableTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_16px_36px_rgba(15,23,42,0.16)] sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[rgba(24,112,255,0.1)] text-[#1870FF]">
            <CalendarRange size={21} strokeWidth={2.6} />
          </span>
          <div>
            <p className="text-[12px] font-black uppercase tracking-[0.16em] text-slate-400">
              Thời Khóa Biểu
            </p>
            <h2 className="mt-1 text-[22px] font-black leading-tight text-slate-950">{title}</h2>
          </div>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-[12px] font-black text-slate-600">
          {subtitle}
        </span>
      </div>
    </section>
  );
}
