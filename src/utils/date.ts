const DEFAULT_FALLBACK = '—';

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

function extractDateParts(value: string): { y: string; m: string; d: string } | null {
  const match = ISO_DATE_RE.exec(value.slice(0, 10));
  if (!match) return null;
  return { y: match[1], m: match[2], d: match[3] };
}

function parseFlexible(value: string): Date | null {
  if (ISO_DATE_RE.test(value)) {
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value?: string | null, fallback: string = DEFAULT_FALLBACK): string {
  if (!value) return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;

  const parts = extractDateParts(trimmed);
  if (parts) return `${parts.d}/${parts.m}/${parts.y}`;

  const date = parseFlexible(trimmed);
  if (date) {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  }

  return value;
}

export function formatDateShort(value?: string | null, fallback: string = DEFAULT_FALLBACK): string {
  if (!value) return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;

  const parts = extractDateParts(trimmed);
  if (parts) return `${parts.d}/${parts.m}`;

  const date = parseFlexible(trimmed);
  if (date) {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
    }).format(date);
  }

  return value;
}

export function formatDateTime(value?: string | null, fallback: string = DEFAULT_FALLBACK): string {
  if (!value) return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;

  const date = parseFlexible(trimmed);
  if (!date) return value;

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

export function formatTime(value?: string | null, fallback: string = '-'): string {
  if (!value) return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  return trimmed.slice(0, 5);
}

export function formatWeekday(value?: string | null, fallback: string = '-'): string {
  if (!value) return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;

  const date = parseFlexible(trimmed);
  if (!date) return fallback;

  return new Intl.DateTimeFormat('vi-VN', { weekday: 'long' }).format(date);
}
