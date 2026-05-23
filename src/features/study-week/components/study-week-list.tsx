import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, MoreVertical, Plus, RefreshCw } from 'lucide-react';
import { useParams, useSearchParams } from 'react-router';
import { useStudyWeeksQuery } from '@/features/study-week/api/study-weeks';
import StudyWeekDetail from '@/features/study-week/components/study-week-detail';
import { DEFAULT_STUDY_WEEK_GRADE_ID } from '@/features/study-week/lib/constants';
import { formatDate, formatWeekLabel } from '@/features/study-week/lib/format-week';
import {
  getWeekStatus,
  statusClass,
  statusLabel,
} from '@/features/study-week/lib/week-status';
import { useSortedStudyWeeks } from '@/features/study-week/hooks/use-sorted-study-weeks';
import type { StudyWeek } from '@/features/study-week/types';
import ConfirmDeleteModal from './confirm-delete-modal';
import StudyWeekFormModal from './study-week-form-modal';

export default function StudyWeekList() {
  const { weekUuid, gradeId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const studyWeeksQuery = useStudyWeeksQuery();
  const sortedWeeks = useSortedStudyWeeks(studyWeeksQuery.data);
  const currentYear = new Date().getFullYear();
  const years = useMemo(
    () =>
      Array.from(new Set(sortedWeeks.map((week) => week.school_year).filter(Boolean) as number[]))
        .sort((a, b) => b - a),
    [sortedWeeks],
  );
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [search, setSearch] = useState('');
  const [expandedWeekUuid, setExpandedWeekUuid] = useState<string | null>(weekUuid ?? null);
  const [menuWeekUuid, setMenuWeekUuid] = useState<string | null>(null);
  const [editingWeek, setEditingWeek] = useState<StudyWeek | null>(null);
  const [deletingWeek, setDeletingWeek] = useState<StudyWeek | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const selectedGradeId = Number(gradeId ?? searchParams.get('grade') ?? DEFAULT_STUDY_WEEK_GRADE_ID);

  useEffect(() => {
    if (weekUuid) {
      setExpandedWeekUuid(weekUuid);
    }
  }, [weekUuid]);

  useEffect(() => {
    if (years.length && !years.includes(selectedYear)) {
      setSelectedYear(years[0]);
    }
  }, [selectedYear, years]);

  useEffect(() => {
    if (expandedWeekUuid || weekUuid || !sortedWeeks.length) return;
    const current = sortedWeeks.find((week) => getWeekStatus(week) === 'CURRENT');
    if (current?.week_uuid) {
      setExpandedWeekUuid(current.week_uuid);
    }
  }, [expandedWeekUuid, sortedWeeks, weekUuid]);

  const visibleWeeks = sortedWeeks.filter((week) => {
    const matchesYear = week.school_year === selectedYear;
    const query = search.trim();
    const matchesSearch = !query || String(week.week_number ?? '').startsWith(query);
    return matchesYear && matchesSearch;
  });

  function toggleWeek(nextWeekUuid?: string) {
    if (!nextWeekUuid) return;
    const next = expandedWeekUuid === nextWeekUuid ? null : nextWeekUuid;
    setExpandedWeekUuid(next);
    const params = new URLSearchParams(searchParams);
    if (next) {
      params.set('week', next);
      params.set('grade', String(selectedGradeId));
    } else {
      params.delete('week');
    }
    setSearchParams(params, { replace: true });
  }

  if (studyWeeksQuery.isError) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-700">
        <p className="text-[14px] font-bold">Không tải được danh sách tuần học.</p>
        <button
          type="button"
          onClick={() => studyWeeksQuery.refetch()}
          className="mt-3 inline-flex h-9 items-center gap-2 rounded-xl bg-rose-600 px-3 text-[13px] font-black text-white"
        >
          <RefreshCw size={14} />
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_16px_36px_rgba(15,23,42,0.12)] lg:flex-row lg:items-center lg:justify-between">
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex h-11 w-fit items-center gap-2 rounded-xl bg-[#1870FF] px-4 text-[14px] font-extrabold text-white shadow-[0_12px_22px_rgba(24,112,255,0.26)] transition hover:bg-[#0f62e6]"
        >
          <Plus size={17} />
          Tạo tuần học
        </button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo số tuần"
            className="h-11 rounded-xl border border-slate-300 px-3 text-[14px] font-semibold outline-none focus:border-[#1870FF] focus:ring-4 focus:ring-[rgba(24,112,255,0.14)]"
          />
          <select
            value={selectedYear}
            onChange={(event) => setSelectedYear(Number(event.target.value))}
            className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-[14px] font-bold outline-none focus:border-[#1870FF] focus:ring-4 focus:ring-[rgba(24,112,255,0.14)]"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_16px_36px_rgba(15,23,42,0.12)]">
        {studyWeeksQuery.isLoading ? (
          <p className="px-5 py-8 text-center text-[14px] font-semibold text-slate-500">
            Đang tải tuần học...
          </p>
        ) : null}

        {visibleWeeks.map((week) => {
          const rowWeekUuid = week.week_uuid ?? '';
          const isExpanded = expandedWeekUuid === rowWeekUuid;
          const status = getWeekStatus(week);

          return (
            <section key={rowWeekUuid || `${week.school_year}-${week.week_number}`} className="border-b border-slate-100 last:border-b-0">
              <button
                type="button"
                onClick={() => toggleWeek(rowWeekUuid)}
                className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-slate-50"
              >
                <ChevronRight
                  size={18}
                  className={`shrink-0 text-slate-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-extrabold text-slate-950">
                    {formatWeekLabel(week)}
                  </p>
                  <p className="mt-1 text-[12px] font-semibold text-slate-500">
                    {formatDate(week.week_start_date)} {'->'} {formatDate(week.week_end_date)}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-[12px] font-black ${statusClass(status)}`}>
                  {statusLabel(status)}
                </span>
                <span className="relative">
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(event) => {
                      event.stopPropagation();
                      setMenuWeekUuid(menuWeekUuid === rowWeekUuid ? null : rowWeekUuid);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.stopPropagation();
                        setMenuWeekUuid(menuWeekUuid === rowWeekUuid ? null : rowWeekUuid);
                      }
                    }}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100"
                  >
                    <MoreVertical size={17} />
                  </span>
                  {menuWeekUuid === rowWeekUuid ? (
                    <span className="absolute right-0 top-10 z-10 w-32 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-[13px] font-bold shadow-xl">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setEditingWeek(week);
                          setMenuWeekUuid(null);
                        }}
                        className="block w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50"
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setDeletingWeek(week);
                          setMenuWeekUuid(null);
                        }}
                        className="block w-full px-3 py-2 text-left text-rose-600 hover:bg-rose-50"
                      >
                        Xóa
                      </button>
                    </span>
                  ) : null}
                </span>
              </button>

              <div className={`grid transition-all duration-200 ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                <div className="overflow-hidden">
                  <div className="border-t border-slate-100 bg-slate-50/70 p-4">
                    {rowWeekUuid ? (
                      <StudyWeekDetail weekUuid={rowWeekUuid} gradeId={selectedGradeId} />
                    ) : null}
                  </div>
                </div>
              </div>
            </section>
          );
        })}

        {!studyWeeksQuery.isLoading && !visibleWeeks.length ? (
          <p className="px-5 py-8 text-center text-[14px] font-semibold text-slate-500">
            Không có tuần học phù hợp.
          </p>
        ) : null}
      </div>

      {showCreateModal ? <StudyWeekFormModal onClose={() => setShowCreateModal(false)} /> : null}
      {editingWeek ? (
        <StudyWeekFormModal studyWeek={editingWeek} onClose={() => setEditingWeek(null)} />
      ) : null}
      {deletingWeek ? (
        <ConfirmDeleteModal studyWeek={deletingWeek} onClose={() => setDeletingWeek(null)} />
      ) : null}
    </div>
  );
}
