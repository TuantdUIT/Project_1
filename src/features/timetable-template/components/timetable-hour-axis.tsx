import { formatMinutes } from '@/features/timetable-template/lib/time';

export default function TimetableHourAxis({
  startHour,
  endHour,
  hourHeightPx,
  compact = false,
}: {
  startHour: number;
  endHour: number;
  hourHeightPx: number;
  compact?: boolean;
}) {
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, index) => startHour + index);

  return (
    <div className={`absolute inset-y-0 left-0 z-[1] border-r border-slate-200 bg-slate-50 ${compact ? 'w-[52px]' : 'w-[60px]'}`}>
      {hours.map((hour, index) => {
        const isFirst = index === 0;
        return (
          <span
            key={hour}
            className={`absolute right-2 font-bold text-slate-400 ${
              isFirst ? '' : '-translate-y-1/2'
            } ${compact ? 'text-[10px]' : 'text-[11px]'}`}
            style={{ top: (hour - startHour) * hourHeightPx + (isFirst ? 2 : 0) }}
          >
            {formatMinutes(hour * 60)}
          </span>
        );
      })}
    </div>
  );
}
