import type { CSSProperties } from 'react';
import { getLessonTypeStyle } from '@/features/timetable-template/lib/color-map';
import type { TimetableCardLayout } from '@/features/timetable-template/types';

export default function TimetableCard({
  card,
  hideBadge = false,
  compact = false,
}: {
  card: TimetableCardLayout;
  hideBadge?: boolean;
  compact?: boolean;
}) {
  const style = getLessonTypeStyle(card.item.lesson_type_name);
  const cssVars = {
    '--lesson-filled': style.filled,
    '--lesson-outlined': style.outlined,
  } as CSSProperties;

  return (
    <article
      className={`group absolute z-[2] overflow-hidden rounded-xl border-2 border-transparent bg-[var(--lesson-filled)] text-white shadow-[0_12px_22px_rgba(15,23,42,0.16)] transition-all duration-150 hover:border-[var(--lesson-outlined)] hover:bg-white hover:text-[var(--lesson-outlined)] hover:shadow-[0_18px_30px_rgba(15,23,42,0.18)] hover:backdrop-blur ${
        compact ? 'px-2 py-1.5' : 'px-2.5 py-2'
      }`}
      style={{
        ...cssVars,
        top: card.topPx,
        left: `${card.leftPercent}%`,
        width: `calc(${card.widthPercent}% - 6px)`,
        height: card.heightPx,
      }}
      title={`${card.startLabel} - ${card.endLabel} · ${card.item.lesson_type_name ?? '—'} · ${card.item._source_grade_name}`}
    >
      {!hideBadge ? (
        <span
          className={`absolute right-2 top-2 rounded-full bg-white/20 font-black text-white transition-colors group-hover:bg-slate-50 group-hover:text-[var(--lesson-outlined)] ${
            compact ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]'
          }`}
        >
          {card.item._source_grade_name}
        </span>
      ) : null}
      <p className={`font-black opacity-85 ${compact ? 'text-[9px]' : 'text-[11px]'}`}>
        {card.startLabel} - {card.endLabel}
      </p>
      <p className={`mt-1 pr-10 font-black leading-tight ${compact ? 'text-[11px]' : 'text-[13px]'}`}>
        {card.item.lesson_type_name || '—'}
      </p>
    </article>
  );
}
