import { useMemo } from 'react';
import { buildTimetableLayout } from '@/features/timetable-template/lib/layout';
import {
  COMPACT_HOUR_HEIGHT_PX,
  DAY_OF_WEEK_ORDER,
  HOUR_HEIGHT_PX,
} from '@/features/timetable-template/lib/time';
import type { LessonType, MergedTimetableItem } from '@/features/timetable-template/types';
import TimetableCard from './timetable-card';
import TimetableHeader from './timetable-header';
import TimetableHourAxis from './timetable-hour-axis';

export default function TimetableGrid({
  items,
  lessonTypes,
  compact = false,
  emptyMessage = 'Chưa có buổi học nào.',
}: {
  items: MergedTimetableItem[];
  lessonTypes: LessonType[];
  compact?: boolean;
  emptyMessage?: string;
}) {
  const hourHeightPx = compact ? COMPACT_HOUR_HEIGHT_PX : HOUR_HEIGHT_PX;
  const layout = useMemo(
    () => buildTimetableLayout(items, lessonTypes, hourHeightPx),
    [hourHeightPx, items, lessonTypes],
  );
  const halfHourCount = (layout.endHour - layout.startHour) * 2;
  const gridColumnClass = compact
    ? 'grid-cols-[52px_repeat(7,minmax(96px,1fr))]'
    : 'grid-cols-[60px_repeat(7,minmax(120px,1fr))]';

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className={compact ? 'max-h-[420px] overflow-auto' : 'max-h-[720px] overflow-auto'}>
        <TimetableHeader compact={compact} />
        <div
          className={`relative grid min-w-[900px] ${gridColumnClass}`}
          style={{ height: layout.totalHeightPx }}
        >
          <TimetableHourAxis
            startHour={layout.startHour}
            endHour={layout.endHour}
            hourHeightPx={hourHeightPx}
            compact={compact}
          />

          <div className="col-start-2 col-end-9 grid grid-cols-7">
            {DAY_OF_WEEK_ORDER.map((day) => (
              <div key={day} className="border-r border-slate-100 last:border-r-0" />
            ))}
          </div>

          <div className="pointer-events-none absolute inset-y-0 left-0 right-0 z-0">
            {Array.from({ length: halfHourCount + 1 }, (_, index) => {
              const isHour = index % 2 === 0;
              return (
                <span
                  key={index}
                  className={`absolute left-0 right-0 ${isHour ? 'border-t border-slate-200' : 'border-t border-slate-100'}`}
                  style={{ top: (index * hourHeightPx) / 2 }}
                />
              );
            })}
          </div>

          <div className={compact ? 'absolute bottom-0 left-[52px] right-0 top-0' : 'absolute bottom-0 left-[60px] right-0 top-0'}>
            {layout.cards.map((card) => (
              <TimetableCard
                key={card.id}
                card={card}
                compact={compact}
              />
            ))}
            {!layout.cards.length ? (
              <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
                <p className="rounded-xl border border-dashed border-slate-300 bg-white/90 px-5 py-4 text-[14px] font-bold text-slate-500">
                  {emptyMessage}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
