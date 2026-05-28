import type { CSSProperties } from 'react';
import { Users } from 'lucide-react';
import { getLessonTypeStyle } from '@/features/Management_Services/timetable-template/lib/color-map';
import type { DayOfWeek, TimetableCardLayout } from '@/features/Management_Services/timetable-template/types';
import PersonnelPopover from './personnel-popover';

export default function TimetableCard({
  card,
  compact = false,
}: {
  card: TimetableCardLayout;
  compact?: boolean;
}) {
  const style = getLessonTypeStyle(card.item.lesson_type_name);
  const cssVars = {
    '--lesson-filled': style.filled,
    '--lesson-outlined': style.outlined,
  } as CSSProperties;
  const personnel = card.item._personnel ?? [];

  return (
    <div
      className="group absolute z-[2] hover:z-30"
      style={{
        ...cssVars,
        top: card.topPx,
        left: `${card.leftPercent}%`,
        width: `calc(${card.widthPercent}% - 6px)`,
        height: card.heightPx,
      }}
    >
      <article
        className={`relative h-full overflow-hidden rounded-xl border-2 border-transparent bg-[var(--lesson-filled)] text-white shadow-[0_12px_22px_rgba(15,23,42,0.16)] transition-all duration-150 group-hover:border-[var(--lesson-outlined)] group-hover:bg-white group-hover:text-[var(--lesson-outlined)] group-hover:shadow-[0_18px_30px_rgba(15,23,42,0.18)] group-hover:backdrop-blur ${
          compact ? 'px-2 py-1.5' : 'px-2.5 py-2'
        }`}
        title={`${card.startLabel} - ${card.endLabel} - ${card.item.lesson_type_name ?? '-'}`}
      >
        <p className={`font-black opacity-85 ${compact ? 'text-[9px]' : 'text-[11px]'}`}>
          {card.startLabel} - {card.endLabel}
        </p>
        <p className={`mt-1 pr-9 font-black leading-tight ${compact ? 'text-[11px]' : 'text-[13px]'}`}>
          {card.item.lesson_type_name || '-'}
        </p>
        <span className="absolute bottom-1 right-1 inline-flex h-5 min-w-5 items-center justify-center gap-1 rounded-md bg-white/18 px-1.5 text-[10px] font-black text-white ring-1 ring-white/25 transition group-hover:bg-[var(--lesson-outlined)]/10 group-hover:text-[var(--lesson-outlined)] group-hover:ring-[var(--lesson-outlined)]/20">
          {personnel.length > 0 ? <Users size={11} strokeWidth={2.7} /> : null}
          {personnel.length > 0 ? personnel.length : '-'}
        </span>
      </article>

      <PersonnelPopover
        personnel={personnel}
        startLabel={card.startLabel}
        endLabel={card.endLabel}
        lessonTypeName={card.item.lesson_type_name}
        dayOfWeek={card.item.day_of_week as DayOfWeek | undefined}
        dayIndex={card.dayIndex}
      />
    </div>
  );
}
