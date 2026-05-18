import { DAY_OF_WEEK_LABEL, DAY_OF_WEEK_ORDER } from '@/features/timetable-template/lib/time';

export default function TimetableHeader({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`sticky top-0 z-10 grid border-b border-slate-200 bg-white/95 backdrop-blur ${
        compact ? 'grid-cols-[52px_repeat(7,minmax(96px,1fr))]' : 'grid-cols-[60px_repeat(7,minmax(120px,1fr))]'
      }`}
    >
      <div className="border-r border-slate-200" />
      {DAY_OF_WEEK_ORDER.map((day) => (
        <div
          key={day}
          className={`border-r border-slate-100 text-center font-black text-slate-600 last:border-r-0 ${
            compact ? 'px-2 py-2 text-[10px]' : 'px-3 py-3 text-[12px]'
          }`}
        >
          {DAY_OF_WEEK_LABEL[day]}
        </div>
      ))}
    </div>
  );
}
