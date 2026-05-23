import { useEffect, useMemo, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { useStudentByUuidQuery } from '@/features/admin';
import { useStudyWeeksQuery } from '@/features/study-week';
import {
  composeSchedule,
  useTimetableTemplatesQuery,
} from '@/features/schedule';
import { formatDate } from '@/utils/date';

const currentSchoolYear = new Date().getFullYear();

export default function ScheduleRoute() {
  const { user } = useAuth();
  const studentQuery = useStudentByUuidQuery(user?.id);
  const templatesQuery = useTimetableTemplatesQuery();
  const weeksQuery = useStudyWeeksQuery();
  const grades = studentQuery.data?.grades ?? [];
  const [selectedGradeId, setSelectedGradeId] = useState<number | null>(null);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);

  useEffect(() => {
    if (!selectedGradeId && grades[0]?.id) {
      setSelectedGradeId(grades[0].id);
    }
  }, [grades, selectedGradeId]);

  const weeks = useMemo(
    () =>
      (weeksQuery.data ?? [])
        .filter((week) => !week.school_year || week.school_year === currentSchoolYear)
        .sort((a, b) => (a.week_number ?? 0) - (b.week_number ?? 0)),
    [weeksQuery.data],
  );
  const selectedWeek = weeks[selectedWeekIndex];
  const selectedTemplate = (templatesQuery.data ?? []).find(
    (template) =>
      template.active
      && template.grade?.id === selectedGradeId
      && (!template.school_year || template.school_year === currentSchoolYear),
  );
  const events = composeSchedule(selectedTemplate, selectedWeek);
  const isLoading = studentQuery.isLoading || templatesQuery.isLoading || weeksQuery.isLoading;

  function goToPreviousWeek() {
    setSelectedWeekIndex((current) => Math.max(current - 1, 0));
  }

  function goToNextWeek() {
    setSelectedWeekIndex((current) => Math.min(current + 1, Math.max(weeks.length - 1, 0)));
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 px-4 py-4">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-deep">
              Thời khóa biểu
            </p>
            <h1 className="text-2xl font-black text-slate-900">
              Lịch học theo template và study week
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedGradeId ?? ''}
              onChange={(event) => setSelectedGradeId(Number(event.target.value))}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700"
            >
              <option value="">Chọn khối</option>
              {grades.map((grade) => (
                <option key={grade.id} value={grade.id}>
                  {grade.name}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
              <button onClick={goToPreviousWeek} className="text-slate-500 hover:text-indigo-deep">
                <ChevronLeft size={18} />
              </button>
              <span className="min-w-40 text-center text-sm font-bold text-slate-700">
                Tuần {selectedWeek?.week_number ?? '-'}
              </span>
              <button onClick={goToNextWeek} className="text-slate-500 hover:text-indigo-deep">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {isLoading ? (
          <p className="text-slate-500">Đang tải lịch học...</p>
        ) : !grades.length ? (
          <EmptyState title="Chưa tìm thấy khối học của học sinh" />
        ) : !selectedTemplate ? (
          <EmptyState title="Chưa có timetable template active cho khối đã chọn" />
        ) : !selectedWeek ? (
          <EmptyState title="Chưa có study week cho năm học hiện tại" />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {events.map((event) => (
              <article key={event.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-deep">
                    {event.dayOfWeek}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-bold text-slate-500">
                    <Calendar size={14} />
                    {formatDate(event.date)}
                  </span>
                </div>
                <h2 className="text-lg font-black text-slate-900">{event.lessonTypeName}</h2>
                <p className="mt-2 flex items-center gap-2 text-sm font-bold text-slate-500">
                  <Clock size={16} />
                  {event.startTime}
                </p>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function EmptyState({ title }: { title: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
      <p className="font-bold text-slate-700">{title}</p>
      <p className="mt-2 text-sm text-slate-500">
        P1 đang compose từ `/timetable-templates` và `/study-weeks`; không dùng `/periods`.
      </p>
    </div>
  );
}
