import { useEffect, useMemo, useState } from 'react';
import { CalendarRange } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { useStudentByUuidQuery } from '@/features/Management_Services/admin';
import { useTimetableViewQuery } from '@/features/Management_Services/timetable-template/hooks/use-timetable-view-query';
import {
  SUPPLEMENT_GRADE_IDS_BY_PRIMARY_ID,
  gradeDisplayName,
  isPrimaryGradeId,
  primaryGradeTitle,
  type PrimaryGradeId,
} from '@/features/Management_Services/timetable-template/lib/supplement-grades';
import PartialErrorBanner from '@/features/Management_Services/timetable-template/components/partial-error-banner';
import TimetableGrid from '@/features/Management_Services/timetable-template/components/timetable-grid';
import WeekSpinner from '@/features/Management_Services/timetable-template/components/week-spinner';

/** Đưa mọi grade (kể cả khối ảo VDC/DGNL) về khối chính tương ứng để render Thời Khóa Biểu. */
function resolvePrimaryGradeId(gradeId: number): PrimaryGradeId | undefined {
  if (isPrimaryGradeId(gradeId)) return gradeId;
  const entry = (Object.entries(SUPPLEMENT_GRADE_IDS_BY_PRIMARY_ID) as Array<[
    string,
    readonly number[],
  ]>).find(([, supplements]) => supplements.includes(gradeId));
  if (!entry) return undefined;
  const primaryId = Number(entry[0]);
  return isPrimaryGradeId(primaryId) ? primaryId : undefined;
}

export default function ScheduleRoute() {
  const { user } = useAuth();
  const studentQuery = useStudentByUuidQuery(user?.id);
  const grades = studentQuery.data?.grades ?? [];

  const primaryGradeIds = useMemo<PrimaryGradeId[]>(() => {
    const resolved = grades
      .map((grade) => (grade.id != null ? resolvePrimaryGradeId(grade.id) : undefined))
      .filter((id): id is PrimaryGradeId => id != null);
    return Array.from(new Set(resolved));
  }, [grades]);

  const [selectedGradeId, setSelectedGradeId] = useState<PrimaryGradeId | null>(null);

  useEffect(() => {
    if (selectedGradeId == null && primaryGradeIds[0] != null) {
      setSelectedGradeId(primaryGradeIds[0]);
    }
  }, [primaryGradeIds, selectedGradeId]);

  return (
    <div className="min-h-screen bg-[#f4f7fb]">
      <header className="border-b border-slate-200 bg-white px-4 py-5">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[rgba(24,112,255,0.1)] text-[#1870FF]">
            <CalendarRange size={21} strokeWidth={2.6} />
          </span>
          <div>
            <p className="text-[12px] font-black uppercase tracking-[0.16em] text-slate-400">
              Thời Khóa Biểu
            </p>
            <h1 className="mt-1 text-[22px] font-black leading-tight text-slate-950">
              Lịch học của tôi
            </h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-5 px-4 py-6">
        {studentQuery.isLoading ? (
          <p className="text-slate-500">Đang tải lịch học...</p>
        ) : !primaryGradeIds.length ? (
          <EmptyState title="Chưa tìm thấy khối học của học sinh" />
        ) : (
          <>
            {primaryGradeIds.length > 1 ? (
              <GradeSelector
                gradeIds={primaryGradeIds}
                selectedGradeId={selectedGradeId}
                onSelect={setSelectedGradeId}
              />
            ) : null}

            {selectedGradeId != null ? (
              <StudentTimetable primaryGradeId={selectedGradeId} />
            ) : null}
          </>
        )}
      </main>
    </div>
  );
}

function GradeSelector({
  gradeIds,
  selectedGradeId,
  onSelect,
}: {
  gradeIds: PrimaryGradeId[];
  selectedGradeId: PrimaryGradeId | null;
  onSelect: (gradeId: PrimaryGradeId) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {gradeIds.map((gradeId) => {
        const isActive = gradeId === selectedGradeId;
        return (
          <button
            key={gradeId}
            type="button"
            onClick={() => onSelect(gradeId)}
            className={`inline-flex h-11 items-center rounded-xl px-5 text-[14px] font-extrabold transition ${
              isActive
                ? 'bg-[#1870FF] text-white shadow-[0_12px_22px_rgba(24,112,255,0.26)]'
                : 'border border-slate-300 bg-white text-slate-700 hover:border-[#1870FF] hover:bg-[rgba(24,112,255,0.04)]'
            }`}
          >
            {gradeDisplayName(gradeId)}
          </button>
        );
      })}
    </div>
  );
}

function StudentTimetable({ primaryGradeId }: { primaryGradeId: PrimaryGradeId }) {
  const viewQuery = useTimetableViewQuery(primaryGradeId);
  const title = primaryGradeTitle(primaryGradeId);

  if (viewQuery.isLoading) {
    return (
      <div className="space-y-5">
        <WeekSpinner />
        <div className="h-[560px] animate-pulse rounded-2xl bg-slate-100" />
      </div>
    );
  }

  if (viewQuery.isError) {
    return (
      <div className="space-y-5">
        <WeekSpinner />
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

function EmptyState({ title }: { title: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
      <p className="font-bold text-slate-700">{title}</p>
      <p className="mt-2 text-sm text-slate-500">
        Lịch học được dựng từ timetable template và study week của khối bạn đang theo học.
      </p>
    </div>
  );
}
