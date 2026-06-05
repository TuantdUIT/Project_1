import { useEffect, useState } from 'react';
import { X, Search, ChevronDown, ChevronUp, Loader2, Database } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getQuestions } from '@/features/Exam_Services/question/api/questions';
import type { Question } from '@/features/Exam_Services/question/types';
import { questionTypeLabel } from '@/features/Exam_Services/question/lib/question-type';
import { scoreForType, type TypeScoreConfig } from '@/features/Exam_Services/exam/lib/type-score';

export type GroupForm = {
  groupName: string;
  questionType: 'MCQ' | 'TFQ' | 'SAQ';
  questionTopic: string;
  pickQuestionCount: number;
  scorePerQuestion: number;
  displayOrder: number;
  itemUuids: string[];
};

const INIT: GroupForm = {
  groupName: 'Nhóm 1',
  questionType: 'MCQ',
  questionTopic: '',
  pickQuestionCount: 3,
  scorePerQuestion: 1.0,
  displayOrder: 1,
  itemUuids: [],
};

const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400';
const numInputCls = `${inputCls} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`;
const labelCls = 'block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5';

const TYPE_COLOR: Record<string, string> = {
  MCQ: 'bg-blue-50 text-blue-600',
  TFQ: 'bg-violet-50 text-violet-600',
  SAQ: 'bg-orange-50 text-orange-600',
};

type Props = {
  isOpen: boolean;
  nextDisplayOrder: number;
  excludeUuids: string[];
  typeScore: TypeScoreConfig;
  onClose: () => void;
  onConfirm: (form: GroupForm) => void;
};

export function CreateGroupDialog({ isOpen, nextDisplayOrder, excludeUuids, typeScore, onClose, onConfirm }: Props) {
  const [form, setForm] = useState<GroupForm>({ ...INIT, displayOrder: nextDisplayOrder });

  useEffect(() => {
    if (!isOpen) return;
    setForm((current) => ({
      ...current,
      displayOrder: nextDisplayOrder,
      scorePerQuestion: scoreForType(typeScore, current.questionType),
    }));
  }, [isOpen, nextDisplayOrder, typeScore]);

  // Question bank state
  const [bankSearch, setBankSearch] = useState('');
  const [bankPage, setBankPage]     = useState(0);
  const [selectedItems, setSelectedItems] = useState<Question[]>([]);
  const [expandedUuid, setExpandedUuid]   = useState<string | null>(null);

  const { data: bankData, isLoading: bankLoading } = useQuery({
    queryKey: ['questions-group-picker', bankSearch, bankPage],
    queryFn:  () => getQuestions({ content: bankSearch, page: bankPage, size: 10, isActive: true }),
    enabled:  isOpen,
  });

  const allQuestions   = bankData?.content ?? [];
  const bankTotalPages = bankData?.totalPages ?? 1;
  const bankQuestions  = allQuestions.filter((q) => !excludeUuids.includes(q.questionUuid ?? ''));

  if (!isOpen) return null;

  function handleClose() {
    setForm({
      ...INIT,
      displayOrder: nextDisplayOrder,
      scorePerQuestion: scoreForType(typeScore, INIT.questionType),
    });
    setBankSearch('');
    setBankPage(0);
    setSelectedItems([]);
    setExpandedUuid(null);
    onClose();
  }

  function toggleItem(q: Question) {
    setSelectedItems((prev) =>
      prev.some((s) => s.questionUuid === q.questionUuid)
        ? prev.filter((s) => s.questionUuid !== q.questionUuid)
        : [...prev, q],
    );
  }

  function handleSubmit() {
    if (!form.groupName.trim() || form.pickQuestionCount < 1) return;
    onConfirm({ ...form, itemUuids: selectedItems.map((q) => q.questionUuid ?? '') });
    handleClose();
  }

  const canSubmit = form.groupName.trim().length > 0 && form.pickQuestionCount >= 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[88vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h3 className="text-base font-black text-slate-900">Tạo nhóm câu hỏi ngẫu nhiên</h3>
          <button type="button" onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body — 2 columns */}
        <div className="flex flex-1 overflow-hidden">

          {/* ── LEFT: form fields ── */}
          <div className="w-80 shrink-0 border-r border-slate-100 flex flex-col overflow-y-auto px-6 py-5 space-y-4">

            <div>
              <label className={labelCls}>Tên nhóm *</label>
              <input value={form.groupName}
                onChange={(e) => setForm((f) => ({ ...f, groupName: e.target.value }))}
                placeholder="VD: Nhóm 1" className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Loại câu hỏi *</label>
              <select value={form.questionType}
                onChange={(e) => {
                  const questionType = e.target.value as GroupForm['questionType'];
                  setForm((f) => ({
                    ...f,
                    questionType,
                    scorePerQuestion: scoreForType(typeScore, questionType),
                  }));
                }}
                className={`${inputCls} bg-white`}>
                <option value="MCQ">MCQ — Trắc nghiệm</option>
                <option value="TFQ">TFQ — Đúng/Sai</option>
                <option value="SAQ">SAQ — Trả lời ngắn</option>
              </select>
            </div>

            <div>
              <label className={labelCls}>Chủ đề (tùy chọn)</label>
              <input value={form.questionTopic}
                onChange={(e) => setForm((f) => ({ ...f, questionTopic: e.target.value }))}
                placeholder="VD: Đại số, Hình học..." className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Số câu random lấy ra *</label>
              <input type="number" min={1} value={form.pickQuestionCount}
                onChange={(e) => setForm((f) => ({ ...f, pickQuestionCount: Number(e.target.value) }))}
                className={numInputCls} />
            </div>

            <div>
              <label className={labelCls}>Điểm mỗi câu *</label>
              <input type="number" min={0.01} step="0.1" value={form.scorePerQuestion}
                onChange={(e) => setForm((f) => ({ ...f, scorePerQuestion: Number(e.target.value) }))}
                className={numInputCls} />
            </div>

            <div>
              <label className={labelCls}>Thứ tự hiển thị *</label>
              <input type="number" min={1} value={form.displayOrder}
                onChange={(e) => setForm((f) => ({ ...f, displayOrder: Number(e.target.value) }))}
                className={numInputCls} />
            </div>

          </div>

          {/* ── RIGHT: question bank ── */}
          <div className="flex-1 flex flex-col overflow-hidden px-5 py-5">

            <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">
              Ngân hàng câu hỏi
            </p>

            {/* Search */}
            <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 mb-3 shrink-0">
              <Search size={14} className="text-slate-400 shrink-0" />
              <input value={bankSearch}
                onChange={(e) => { setBankSearch(e.target.value); setBankPage(0); }}
                placeholder="Tìm theo nội dung câu hỏi..."
                className="flex-1 text-sm outline-none text-slate-700 placeholder:text-slate-400" />
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {bankLoading ? (
                <div className="flex items-center justify-center py-10 gap-2 text-slate-400">
                  <Loader2 size={18} className="animate-spin" />
                  <span className="text-sm font-bold">Đang tải...</span>
                </div>
              ) : bankQuestions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-400">
                  <Database size={28} className="opacity-20" />
                  <p className="text-sm font-bold">Không tìm thấy câu hỏi nào</p>
                </div>
              ) : bankQuestions.map((q) => {
                const isSelected = selectedItems.some((s) => s.questionUuid === q.questionUuid);
                const isExpanded = expandedUuid === q.questionUuid;
                return (
                  <div key={q.questionUuid}
                    className={`rounded-xl border transition-colors ${isSelected ? 'border-blue-300 bg-blue-50' : 'border-slate-200'}`}>

                    {/* Row header */}
                    <div className="flex items-center gap-3 px-3 py-2.5">
                      <button type="button" onClick={() => toggleItem(q)} className="shrink-0 mt-0.5">
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                          isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300 hover:border-blue-400'}`}>
                          {isSelected && (
                            <svg viewBox="0 0 10 8" className="w-2.5 h-2">
                              <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                      </button>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-800 line-clamp-1">{q.questionContent ?? '—'}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {q.questionType && (
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${TYPE_COLOR[q.questionType] ?? ''}`}>
                              {questionTypeLabel(q.questionType)}
                            </span>
                          )}
                          {q.questionTopic && (
                            <span className="text-[10px] text-slate-400 truncate">{q.questionTopic}</span>
                          )}
                        </div>
                      </div>

                      <button type="button"
                        onClick={() => setExpandedUuid(isExpanded ? null : (q.questionUuid ?? null))}
                        className="shrink-0 p-1 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>

                    {/* Dropdown detail */}
                    {isExpanded && (
                      <div className="px-3 pb-3 pt-0 border-t border-slate-100 space-y-1.5">

                        {q.questionType === 'MCQ' && (q.mcOptions ?? []).map((opt) => (
                          <div key={opt.optionUuid ?? opt.optionKey} className="flex items-center gap-2">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-800 text-[10px] font-black text-white">
                              {opt.optionKey}
                            </span>
                            <span className="text-xs text-slate-600">{opt.optionContent ?? '—'}</span>
                          </div>
                        ))}

                        {q.questionType === 'TFQ' && (q.tfStatements ?? [])
                          .sort((a, b) => (a.statementOrder ?? 0) - (b.statementOrder ?? 0))
                          .map((stmt) => (
                            <div key={stmt.statementUuid ?? stmt.statementOrder} className="flex items-center gap-2">
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-800 text-[10px] font-black text-white">
                                {stmt.statementOrder}
                              </span>
                              <span className="text-xs text-slate-600">{stmt.statementContent ?? '—'}</span>
                            </div>
                          ))}

                        {q.correctAnswerRaw && (
                          <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Đáp án:</span>
                            <span className="text-xs font-bold text-slate-700">{q.correctAnswerRaw}</span>
                          </div>
                        )}

                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pagination + counter */}
            <div className="flex items-center justify-between pt-3 shrink-0 border-t border-slate-100 mt-2">
              <span className="text-xs font-bold">
                {selectedItems.length > 0
                  ? <span className="text-blue-600">Đã chọn {selectedItems.length} câu</span>
                  : <span className="text-slate-400">Trang {bankPage + 1} / {bankTotalPages}</span>
                }
              </span>
              {bankTotalPages > 1 && (
                <div className="flex gap-2">
                  <button type="button" disabled={bankPage === 0}
                    onClick={() => setBankPage((p) => p - 1)}
                    className="px-3 py-1 text-xs font-bold border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors">
                    ←
                  </button>
                  <button type="button" disabled={bankPage >= bankTotalPages - 1}
                    onClick={() => setBankPage((p) => p + 1)}
                    className="px-3 py-1 text-xs font-bold border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors">
                    →
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 shrink-0">
          <button type="button" onClick={handleClose}
            className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors">
            Hủy
          </button>
          <button type="button" onClick={handleSubmit} disabled={!canSubmit}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-colors">
            Tạo nhóm
          </button>
        </div>

      </div>
    </div>
  );
}
