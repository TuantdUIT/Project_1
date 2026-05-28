import { CalendarDays } from 'lucide-react';
import { useWeekSelection } from '@/features/Management_Services/timetable-template/hooks/use-week-selection';
import { formatDateShort } from '@/utils/date';

function getWeekLabel(week: {
  week_number?: number;
  week_start_date?: string;
  week_end_date?: string;
}) {
  const numberLabel = week.week_number != null ? `Tuần ${week.week_number}` : 'Tuần học';
  return `${numberLabel} (${formatDateShort(week.week_start_date)} -> ${formatDateShort(week.week_end_date)})`;
}

export default function WeekSpinner() {
  const { selectedWeek, setSelectedWeekUuid, weeks, isLoading } = useWeekSelection();

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 text-[13px] font-black text-slate-700">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1870FF]/10 text-[#1870FF]">
          <CalendarDays size={18} strokeWidth={2.5} />
        </span>
        <span>Tuần học</span>
      </div>

      <select
        value={selectedWeek?.week_uuid ?? ''}
        disabled={isLoading || !weeks.length}
        onChange={(event) => setSelectedWeekUuid(event.target.value)}
        className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-[13px] font-bold text-slate-800 outline-none transition focus:border-[#1870FF] focus:ring-2 focus:ring-[#1870FF]/15 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
      >
        {!weeks.length ? <option value="">Chưa có tuần học</option> : null}
        {weeks.map((week) => (
          <option key={week.week_uuid} value={week.week_uuid ?? ''}>
            {getWeekLabel(week)}
          </option>
        ))}
      </select>
    </div>
  );
}
