import { useMemo } from 'react';
import katex from 'katex';

interface MathRenderProps {
  /** Chuỗi trộn text + công thức bọc trong `$...$` (inline) hoặc `$$...$$` (block). */
  value?: string;
  className?: string;
  /** Hiển thị khi value rỗng. */
  fallback?: string;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderMath(latex: string, displayMode: boolean): string {
  // throwOnError:false → LaTeX lỗi hiện đỏ thay vì ném exception làm vỡ UI.
  return katex.renderToString(latex, { throwOnError: false, displayMode, output: 'html' });
}

/**
 * Tách chuỗi nguồn thành các đoạn text (escape HTML) và các đoạn công thức
 * (`$...$` / `$$...$$`) render bằng KaTeX, rồi ghép lại thành HTML.
 * `\$` được coi là dấu đô-la thường.
 */
function renderMixed(src: string): string {
  let html = '';
  let i = 0;
  const n = src.length;

  while (i < n) {
    const ch = src[i];

    if (ch === '\\' && src[i + 1] === '$') {
      html += '$';
      i += 2;
      continue;
    }

    if (ch === '$') {
      const display = src[i + 1] === '$';
      const close = display ? '$$' : '$';
      const start = i + close.length;
      const end = src.indexOf(close, start);
      if (end === -1) {
        // Không có dấu đóng → phần còn lại coi như text.
        html += escapeHtml(src.slice(i)).replace(/\n/g, '<br/>');
        return html;
      }
      html += renderMath(src.slice(start, end), display);
      i = end + close.length;
      continue;
    }

    // Đoạn text tới `$` (hoặc `\$`) kế tiếp.
    let text = '';
    while (i < n && src[i] !== '$') {
      if (src[i] === '\\' && src[i + 1] === '$') {
        text += '$';
        i += 2;
        continue;
      }
      text += src[i];
      i += 1;
    }
    html += escapeHtml(text).replace(/\n/g, '<br/>');
  }

  return html;
}

/** Render nội dung công thức (LaTeX trộn text) cho học sinh xem — read-only. */
export function MathRender({ value, className, fallback = '' }: MathRenderProps) {
  const html = useMemo(() => {
    if (!value || value.trim() === '') return null;
    return renderMixed(value);
  }, [value]);

  if (html === null) return <>{fallback}</>;

  // eslint-disable-next-line react/no-danger
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
