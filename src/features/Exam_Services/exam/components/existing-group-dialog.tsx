import { useState } from 'react';
import { X, Search, Loader2, Database } from 'lucide-react';
import { useQuestionGroupsQuery, type ResQuestionGroup } from '@/features/Exam_Services/question-group/api/question-groups';

const TYPE_COLOR: Record<string, string> = {
  MCQ: 'bg-blue-50 text-blue-600',
  TFQ: 'bg-violet-50 text-violet-600',
  SAQ: 'bg-orange-50 text-orange-600',
};

const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400';
const numInputCls = `${inputCls} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`;
const labelCls = 'block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5';

export type ExistingGroupPayload = {
  questionGroupUuid: string;
  pickQuestionCount: number;
  scorePerQuestion: number;
  displayOrder: number;
};

type Props = {
  isOpen: boolean;
  nextDisplayOrder: number;
  linkedGroupUuids: string[];
  onClose: () => void;
  onConfirm: (payload: ExistingGroupPayload) => void;
};

export function ExistingGroupDialog({ isOpen, nextDisplayOrder, linkedGroupUuids, onClose, onConfirm }: Props) {
  const [search, setSearch]               = useState('');
  const [selected, setSelected]           = useState<ResQuestionGroup | null>(null);
  const [pickQuestionCount, setPickCount] = useState(3);
  const [scorePerQuestion, setScore]      = useState(1.0);
  const [displayOrder, setDisplayOrder]   = useState(nextDisplayOrder);

  const { data, isLoading } = useQuestionGroupsQuery(isOpen, { name: search });

  const groups = (data?.content ?? []).filter(
    (g) => !linkedGroupUuids.includes(g.questionGroupUuid ?? ''),
  );

  if (!isOpen) return null;

  function handleClose() {
    setSearch('');
    setSelected(null);
    setPickCount(3);
    setScore(1.0);
    setDisplayOrder(nextDisplayOrder);
    onClose();
  }

  function handleSubmit() {
    if (!selected?.questionGroupUuid) return;
    onConfirm({
      questionGroupUuid: selected.questionGroupUuid,
      pickQuestionCount,
      scorePerQuestion,
      displayOrder,
    });
    handleClose();
  }

  const canSubmit = selected !== null && pickQuestionCount >= 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h3 className="text-base font-black text-slate-900">Dùng nhóm câu hỏi có sẵn</h3>
          <button type="button" onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">

          {/* LEFT — group list */}
          <div className="flex-1 flex flex-col overflow-hidden border-r border-slate-100 px-5 py-4">
            <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Chọn nhóm</p>

            {/* Search */}
            <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 mb-3 shrink-0">
              <Search size={14} className="text-slate-400 shrink-0" />
              <input value={search}
                onChange={(e) => { setSearch(e.target.value); setSelected(null); }}
                placeholder="Tìm theo tên nhóm..."
                className="flex-1 text-sm outline-none text-slate-700 placeholder:text-slate-400" />
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {isLoading ? (
                <div className="flex items-center justify-center py-10 gap-2 text-slate-400">
                  <Loader2 size={18} className="animate-spin" />
                  <span className="text-sm font-bold">Đang tải...</span>
                </div>
              ) : groups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-400">
                  <Database size={28} className="opacity-20" />
                  <p className="text-sm font-bold">Không tìm thấy nhóm nào</p>
                </div>
              ) : groups.map((g) => {
                const isSelected = selected?.questionGroupUuid === g.questionGroupUuid;
                return (
                  <button key={g.questionGroupUuid} type="button"
                    onClick={() => setSelected(isSelected ? null : g)}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                      isSelected ? 'border-blue-300 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'
                    }`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-slate-800 truncate">{g.groupName ?? '—'}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        {g.questionType && (
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${TYPE_COLOR[g.questionType] ?? ''}`}>
                            {g.questionType}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 font-bold">
                          {g.questionCount ?? 0} câu
                        </span>
                      </div>
                    </div>
                    {g.questionTopic && (
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">{g.questionTopic}</p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT — params */}
          <div className="w-64 shrink-0 flex flex-col px-5 py-4 space-y-4">
            <p className="text-xs font-black text-slate-500 uppercase tracking-wider">Cấu hình</p>

            {selected ? (
              <>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-xs font-black text-blue-700 truncate">{selected.groupName}</p>
                  <p className="text-[10px] text-blue-500 mt-0.5">{selected.questionCount ?? 0} câu trong pool</p>
                </div>

                <div>
                  <label className={labelCls}>Số câu random lấy ra *</label>
                  <input type="number" min={1}
                    value={pickQuestionCount}
                    onChange={(e) => setPickCount(Number(e.target.value))}
                    className={numInputCls} />
                </div>

                <div>
                  <label className={labelCls}>Điểm mỗi câu *</label>
                  <input type="number" min={0.01} step="0.1"
                    value={scorePerQuestion}
                    onChange={(e) => setScore(Number(e.target.value))}
                    className={numInputCls} />
                </div>

                <div>
                  <label className={labelCls}>Thứ tự hiển thị *</label>
                  <input type="number" min={1}
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(Number(e.target.value))}
                    className={numInputCls} />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 gap-2 text-slate-300">
                <Database size={32} className="opacity-30" />
                <p className="text-xs font-bold text-center">Chọn một nhóm để cấu hình</p>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 shrink-0">
          <button type="button" onClick={handleClose}
            className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors">
            Hủy
          </button>
          <button type="button" onClick={handleSubmit} disabled={!canSubmit}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-colors">
            Thêm nhóm
          </button>
        </div>

      </div>
    </div>
  );
}
