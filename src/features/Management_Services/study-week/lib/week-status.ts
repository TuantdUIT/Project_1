import type { StudyWeek } from '@/features/Management_Services/study-week/types';

export type WeekStatus = 'PAST' | 'CURRENT' | 'FUTURE';

function toDayTimestamp(value?: string, endOfDay = false) {
  if (!value) return Number.NaN;
  const suffix = endOfDay ? 'T23:59:59' : 'T00:00:00';
  return new Date(`${value}${suffix}`).getTime();
}

export function getWeekStatus(week: StudyWeek, now = Date.now()): WeekStatus {
  const start = toDayTimestamp(week.week_start_date);
  const end = toDayTimestamp(week.week_end_date, true);

  if (Number.isFinite(start) && now < start) return 'FUTURE';
  if (Number.isFinite(end) && now > end) return 'PAST';
  return 'CURRENT';
}

export function statusLabel(status: WeekStatus) {
  if (status === 'CURRENT') return 'Hiện tại';
  if (status === 'FUTURE') return 'Sắp tới';
  return 'Đã qua';
}

export function statusClass(status: WeekStatus) {
  if (status === 'CURRENT') return 'bg-emerald-50 text-emerald-700';
  if (status === 'FUTURE') return 'bg-blue-50 text-blue-700';
  return 'bg-slate-100 text-slate-600';
}
