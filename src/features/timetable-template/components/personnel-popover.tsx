import { UserRound } from 'lucide-react';
import type { EmployeeRATemplateItem } from '@/features/employee-ra-template/types';
import { DAY_OF_WEEK_LABEL } from '@/features/timetable-template/lib/time';
import type { DayOfWeek } from '@/features/timetable-template/types';

const EMPTY_PERSONNEL_MESSAGE = 'Buổi học này chưa có nhân sự';

export default function PersonnelPopover({
  personnel,
  startLabel,
  endLabel,
  lessonTypeName,
  dayOfWeek,
  dayIndex,
}: {
  personnel: EmployeeRATemplateItem[];
  startLabel: string;
  endLabel: string;
  lessonTypeName?: string;
  dayOfWeek?: DayOfWeek;
  dayIndex: number;
}) {
  const flipLeft = dayIndex >= 5;
  const positionClass = flipLeft ? 'right-full mr-2' : 'left-full ml-2';
  const dayLabel = dayOfWeek ? DAY_OF_WEEK_LABEL[dayOfWeek] : '-';

  return (
    <aside
      className={`pointer-events-none absolute top-0 z-30 w-[280px] rounded-xl border border-slate-200 bg-white p-3 text-slate-800 opacity-0 shadow-[0_18px_40px_rgba(15,23,42,0.22)] transition-opacity delay-[120ms] duration-150 group-hover:pointer-events-auto group-hover:opacity-100 ${positionClass}`}
    >
      <div className="border-b border-slate-100 pb-2">
        <p className="text-[11px] font-black uppercase text-slate-400">
          Slot · {dayLabel} · {startLabel} - {endLabel}
        </p>
        <p className="mt-1 text-[13px] font-black text-slate-950">
          Loại buổi · {lessonTypeName || '-'}
        </p>
      </div>

      {personnel.length ? (
        <div className="mt-3 space-y-3">
          {personnel.map((item, index) => (
            <div key={item.employee_ra_template_item_uuid ?? `${item.user_uuid ?? 'person'}-${index}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <UserRound size={15} strokeWidth={2.3} />
                  </span>
                  <p className="truncate text-[13px] font-black text-slate-950">
                    {item.full_name || item.email || '-'}
                  </p>
                </div>
                {item.role_name ? (
                  <span className="shrink-0 rounded-md bg-[#1870FF]/10 px-2 py-0.5 text-[10px] font-black uppercase text-[#1870FF]">
                    {item.role_name}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 pl-9 text-[11px] font-bold text-slate-500">
                Thời gian làm việc · {startLabel} - {endLabel}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[13px] font-bold text-amber-700">
          {EMPTY_PERSONNEL_MESSAGE}
        </p>
      )}
    </aside>
  );
}
