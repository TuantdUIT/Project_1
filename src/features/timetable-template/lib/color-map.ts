export type LessonTypeStyle = {
  filled: string;
  outlined: string;
};

const fallbackStyle: LessonTypeStyle = {
  filled: '#64748B',
  outlined: '#94A3B8',
};

export function getLessonTypeStyle(name: string | undefined): LessonTypeStyle {
  const normalized = (name ?? '').trim();

  if (/đại số 12|dai so 12|^ds12$/i.test(normalized)) {
    return { filled: '#7C3AED', outlined: '#A78BFA' };
  }

  if (/đại số|dai so|^ds$/i.test(normalized)) {
    return { filled: '#1E3FD6', outlined: '#3B82F6' };
  }

  if (/hình học|hinh hoc|^hh$/i.test(normalized)) {
    return { filled: '#0891B2', outlined: '#22D3EE' };
  }

  if (/dgnl|^dg$/i.test(normalized)) {
    return { filled: '#EA580C', outlined: '#FB923C' };
  }

  if (/vdc/i.test(normalized)) {
    return { filled: '#DC2626', outlined: '#F87171' };
  }

  return fallbackStyle;
}
