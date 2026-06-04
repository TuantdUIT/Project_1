import { useRef, useState } from 'react';
import { Sigma, FunctionSquare } from 'lucide-react';
import { MathRender } from './MathRender';
import { SYMBOL_GROUPS, FORMULA_GROUPS, type PaletteItem } from './math-palette';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  ariaLabel?: string;
  /** Ô gọn 1 dòng (đáp án) hay nhiều dòng (nội dung câu hỏi). */
  singleLine?: boolean;
}

type Tab = 'symbol' | 'formula';

/** Vị trí con trỏ trong snippet: ngay sau `{` của `{}` đầu tiên (nếu có). */
function caretInSnippet(latex: string): number {
  const i = latex.indexOf('{}');
  return i >= 0 ? i + 1 : latex.length;
}

/** Đếm số `$` chưa escape trước vị trí pos → lẻ nghĩa là đang ở trong math. */
function isInsideMath(src: string, pos: number): boolean {
  let count = 0;
  for (let i = 0; i < pos; i += 1) {
    if (src[i] === '$' && src[i - 1] !== '\\') count += 1;
  }
  return count % 2 === 1;
}

/**
 * Ô nhập nguồn (text trộn `$...$`) kèm bảng chèn ký hiệu/công thức.
 * Click vào ô → hiện bảng bên dưới; click ký hiệu/công thức → chèn vào con trỏ.
 */
export function MathSourceField({
  value,
  onChange,
  placeholder,
  rows = 3,
  ariaLabel,
  singleLine = false,
}: Props) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const selRef = useRef<{ start: number; end: number }>({
    start: value.length,
    end: value.length,
  });
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('symbol');
  const [symbolGroup, setSymbolGroup] = useState(0);
  const [formulaGroup, setFormulaGroup] = useState(0);

  function saveSelection() {
    const ta = taRef.current;
    if (ta) selRef.current = { start: ta.selectionStart, end: ta.selectionEnd };
  }

  function insert(item: PaletteItem) {
    const ta = taRef.current;
    const { start, end } = selRef.current;
    const inside = isInsideMath(value, start);
    const snippet = inside ? item.insert : `$${item.insert}$`;
    const next = value.slice(0, start) + snippet + value.slice(end);
    onChange(next);

    const caret = start + (inside ? 0 : 1) + caretInSnippet(item.insert);
    requestAnimationFrame(() => {
      if (!ta) return;
      ta.focus();
      ta.setSelectionRange(caret, caret);
      selRef.current = { start: caret, end: caret };
    });
  }

  const groups = tab === 'symbol' ? SYMBOL_GROUPS : FORMULA_GROUPS;
  const activeGroup = tab === 'symbol' ? symbolGroup : formulaGroup;
  const setActiveGroup = tab === 'symbol' ? setSymbolGroup : setFormulaGroup;

  return (
    <div className="space-y-1.5">
      <div
        className={`relative rounded-xl border bg-white transition-colors ${
          open ? 'border-blue-400 ring-2 ring-blue-100' : 'border-slate-200'
        }`}
      >
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            saveSelection();
            // Đóng bảng nếu blur ra ngoài (click palette đã preventDefault nên không blur).
            setOpen(false);
          }}
          onSelect={saveSelection}
          onKeyUp={saveSelection}
          onClick={saveSelection}
          placeholder={placeholder}
          aria-label={ariaLabel}
          rows={singleLine ? 1 : rows}
          spellCheck={false}
          className={`w-full bg-transparent px-3 py-2 text-sm text-slate-700 outline-none font-mono ${
            singleLine ? 'resize-none' : 'resize-y'
          }`}
        />
      </div>

      {open && (
        // onMouseDown preventDefault: giữ focus + selection của textarea khi bấm bảng.
        <div
          onMouseDown={(e) => e.preventDefault()}
          className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
        >
          {/* Tabs */}
          <div className="flex border-b border-slate-100">
            <button
              type="button"
              onClick={() => setTab('symbol')}
              className={`flex flex-1 items-center justify-center gap-1.5 py-2 text-xs font-bold transition-colors ${
                tab === 'symbol'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Sigma size={13} />
              Ký hiệu
            </button>
            <button
              type="button"
              onClick={() => setTab('formula')}
              className={`flex flex-1 items-center justify-center gap-1.5 py-2 text-xs font-bold transition-colors ${
                tab === 'formula'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <FunctionSquare size={13} />
              Công thức
            </button>
          </div>

          {/* Group chips */}
          <div className="flex flex-wrap gap-1.5 px-3 pt-3">
            {groups.map((g, i) => (
              <button
                key={g.label}
                type="button"
                onClick={() => setActiveGroup(i)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors ${
                  activeGroup === i
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>

          {/* Items grid */}
          <div className="flex flex-wrap gap-1.5 p-3">
            {groups[activeGroup].items.map((item) => (
              <button
                key={item.title}
                type="button"
                title={item.title}
                onClick={() => insert(item)}
                className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-slate-700 hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <MathRender value={`$${item.display}$`} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
