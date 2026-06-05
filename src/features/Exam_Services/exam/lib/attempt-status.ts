import type { ResExamAttempt } from '../types';

export type AttemptStatus = NonNullable<ResExamAttempt['status']>;

export const ATTEMPT_STATUS_LABEL: Record<AttemptStatus, string> = {
  IN_PROGRESS:     'Đang làm',
  SUBMITTED:       'Đã nộp',
  SCORED:          'Đã chấm',
  ANSWER_RELEASED: 'Đã công bố đáp án',
  CANCELLED:       'Đã hủy',
};

export const ATTEMPT_STATUS_STYLE: Record<AttemptStatus, string> = {
  IN_PROGRESS:     'bg-blue-50 text-blue-600',
  SUBMITTED:       'bg-slate-100 text-slate-500',
  SCORED:          'bg-indigo-50 text-indigo-600',
  ANSWER_RELEASED: 'bg-emerald-50 text-emerald-600',
  CANCELLED:       'bg-red-50 text-red-500',
};

/** Xem được tổng điểm (cấp attempt) — SCORED hoặc ANSWER_RELEASED (docs 4.6). */
export function canSeeScore(status?: string): boolean {
  return status === 'SCORED' || status === 'ANSWER_RELEASED';
}

/** Xem được đáp án đúng + điểm từng câu (earnedScore) — chỉ khi đã công bố (docs 4.6). */
export function canSeeAnswerKey(status?: string): boolean {
  return status === 'ANSWER_RELEASED';
}

/** Định dạng điểm gọn: số nguyên giữ nguyên, còn lại 2 chữ số thập phân. */
export function formatScore(value?: number | null): string {
  if (value === undefined || value === null) return '—';
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}
