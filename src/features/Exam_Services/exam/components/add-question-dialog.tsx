import { useState } from 'react';
import { X, Pencil, Database, FileUp, Loader2, AlertCircle, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useCreateQuestionMutation, getQuestions } from '@/features/Exam_Services/question/api/questions';
import type { Question, ReqCreateQuestion } from '@/features/Exam_Services/question/types';
import { GRADE_DISPLAY_NAME_BY_ID } from '@/features/Management_Services/timetable-template/lib/supplement-grades';
import { questionTypeLabel } from '@/features/Exam_Services/question/lib/question-type';
import { scoreForType, type TypeScoreConfig } from '@/features/Exam_Services/exam/lib/type-score';

export type ExamQuestionItem = {
  questionUuid?: string;
  questionOrder: number;
  content: string;
  score: number;
  sectionType: 'MCQ' | 'TFQ' | 'SAQ';
  sourceType: 'MANUAL' | 'QUESTION_BANK' | 'IMPORTED';
};

type Tab = ExamQuestionItem['sourceType'];

const GRADE_OPTIONS = Object.entries(GRADE_DISPLAY_NAME_BY_ID).map(([id, name]) => ({
  id: Number(id),
  name,
}));

const TAB_CONFIG: { key: Tab; label: string; Icon: React.ElementType }[] = [
  { key: 'MANUAL',        label: 'Thêm tay',          Icon: Pencil   },
  { key: 'QUESTION_BANK', label: 'Ngân hàng câu hỏi', Icon: Database },
  { key: 'IMPORTED',      label: 'Thêm từ file',       Icon: FileUp   },
];

type ManualForm = {
  questionType: 'MCQ' | 'TFQ' | 'SAQ';
  gradeId: number;
  questionContent: string;
  questionTopic: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  stmt1: string;
  stmt2: string;
  stmt3: string;
  stmt4: string;
  answerRaw: string;
  isActive: boolean;
};

const INIT_MANUAL: ManualForm = {
  questionType: 'MCQ',
  gradeId: 0,
  questionContent: '',
  questionTopic: '',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  stmt1: '',
  stmt2: '',
  stmt3: '',
  stmt4: '',
  answerRaw: '',
  isActive: true,
};

const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400';
const labelCls = 'block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5';

type Props = {
  isOpen: boolean;
  nextOrder: number;
  typeScore: TypeScoreConfig;
  onClose: () => void;
  onConfirm: (items: ExamQuestionItem[]) => void;
};

function buildPayload(mf: ManualForm): ReqCreateQuestion {
  const base = {
    gradeId: mf.gradeId,
    questionContent: mf.questionContent,
    questionTopic: mf.questionTopic || undefined,
    questionType: mf.questionType,
    isActive: mf.isActive,
    answerKey: { correctAnswerRaw: mf.answerRaw },
  };
  if (mf.questionType === 'MCQ') {
    return {
      ...base,
      mcOptions: [
        { optionKey: 'A', optionContent: mf.optionA },
        { optionKey: 'B', optionContent: mf.optionB },
        { optionKey: 'C', optionContent: mf.optionC },
        { optionKey: 'D', optionContent: mf.optionD },
      ].filter((o) => o.optionContent.trim().length > 0),
    };
  }
  if (mf.questionType === 'TFQ') {
    return {
      ...base,
      tfStatements: [
        { statementOrder: 1, statementContent: mf.stmt1 },
        { statementOrder: 2, statementContent: mf.stmt2 },
        { statementOrder: 3, statementContent: mf.stmt3 },
        { statementOrder: 4, statementContent: mf.stmt4 },
      ],
    };
  }
  return base;
}

const TYPE_COLOR: Record<string, string> = {
  MCQ: 'bg-blue-50 text-blue-600',
  TFQ: 'bg-violet-50 text-violet-600',
  SAQ: 'bg-orange-50 text-orange-600',
};

export function AddQuestionDialog({ isOpen, nextOrder, typeScore, onClose, onConfirm }: Props) {
  const [tab, setTab] = useState<Tab>('QUESTION_BANK');
  const [mf, setMf] = useState<ManualForm>(INIT_MANUAL);

  // Question Bank tab state
  const [bankSearch, setBankSearch] = useState('');
  const [bankPage, setBankPage] = useState(0);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [expandedUuid, setExpandedUuid] = useState<string | null>(null);

  const createMutation = useCreateQuestionMutation();

  // Lazy query — only fires when on QUESTION_BANK tab
  const { data: bankData, isLoading: bankLoading } = useQuery({
    queryKey: ['questions-bank-picker', bankSearch, bankPage],
    queryFn: () => getQuestions({ content: bankSearch, page: bankPage, size: 8, isActive: true }),
    enabled: isOpen && tab === 'QUESTION_BANK',
  });

  const bankQuestions = bankData?.content ?? [];
  const bankTotalPages = bankData?.totalPages ?? 1;

  if (!isOpen) return null;

  function handleClose() {
    setTab('QUESTION_BANK');
    setMf(INIT_MANUAL);
    setBankSearch('');
    setBankPage(0);
    setSelectedQuestions([]);
    setExpandedUuid(null);
    createMutation.reset();
    onClose();
  }

  function toggleQuestion(q: Question) {
    setSelectedQuestions((prev) =>
      prev.some((s) => s.questionUuid === q.questionUuid)
        ? prev.filter((s) => s.questionUuid !== q.questionUuid)
        : [...prev, q],
    );
  }

  function handleCreate() {
    if (tab === 'QUESTION_BANK') {
      if (selectedQuestions.length === 0) return;
      onConfirm(
        selectedQuestions.map((q, i) => ({
          questionUuid:  q.questionUuid,
          questionOrder: nextOrder + i,
          content:       q.questionContent ?? '',
          score:         scoreForType(typeScore, q.questionType),
          sectionType:   (q.questionType ?? 'MCQ') as ExamQuestionItem['sectionType'],
          sourceType:    'QUESTION_BANK',
        })),
      );
      handleClose();
      return;
    }
    createMutation.mutate(buildPayload(mf), {
      onSuccess: (data) => {
        onConfirm([{
          questionUuid:  data.questionUuid,
          questionOrder: nextOrder,
          content:       mf.questionContent,
          score:         scoreForType(typeScore, mf.questionType),
          sectionType:   mf.questionType,
          sourceType:    'MANUAL',
        }]);
        handleClose();
      },
    });
  }

  const canCreate =
    (tab === 'MANUAL' &&
      mf.questionContent.trim().length > 0 &&
      mf.gradeId > 0 &&
      !createMutation.isPending) ||
    (tab === 'QUESTION_BANK' && selectedQuestions.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h3 className="text-base font-black text-slate-900">Tạo câu hỏi mới</h3>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-blue-100 text-slate-400 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-6 pt-5 pb-4 shrink-0">
          {TAB_CONFIG.map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${
                tab === key
                  ? 'border-blue-300 bg-blue-50 text-blue-600'
                  : 'border-slate-200 text-slate-500 hover:bg-blue-50'
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 pb-4">

          {/* ── MANUAL TAB ── */}
          {tab === 'MANUAL' && (
            <div className="space-y-5">

              {/* Loại câu hỏi + Khối lớp */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Loại câu hỏi *</label>
                  <select
                    value={mf.questionType}
                    onChange={(e) =>
                      setMf((f) => ({ ...f, questionType: e.target.value as 'MCQ' | 'TFQ' | 'SAQ' }))
                    }
                    className={`${inputCls} bg-white`}
                  >
                    <option value="MCQ">MCQ — Trắc nghiệm</option>
                    <option value="TFQ">TFQ — Đúng/Sai</option>
                    <option value="SAQ">SAQ — Trả lời ngắn</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Khối lớp *</label>
                  <select
                    value={mf.gradeId || ''}
                    onChange={(e) => setMf((f) => ({ ...f, gradeId: Number(e.target.value) }))}
                    className={`${inputCls} bg-white`}
                  >
                    <option value="">Chọn khối lớp</option>
                    {GRADE_OPTIONS.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Nội dung câu hỏi */}
              <div>
                <label className={labelCls}>Nội dung câu hỏi *</label>
                <textarea
                  value={mf.questionContent}
                  onChange={(e) => setMf((f) => ({ ...f, questionContent: e.target.value }))}
                  placeholder="Nhập nội dung câu hỏi..."
                  rows={3}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 resize-none"
                />
              </div>

              {/* Chủ đề */}
              <div>
                <label className={labelCls}>Chủ đề</label>
                <input
                  value={mf.questionTopic}
                  onChange={(e) => setMf((f) => ({ ...f, questionTopic: e.target.value }))}
                  placeholder="VD: Giải tích, Hình học..."
                  className={inputCls}
                />
              </div>

              {/* MCQ — Các đáp án + Đáp án */}
              {mf.questionType === 'MCQ' && (
                <>
                  <div>
                    <label className={labelCls}>Các đáp án</label>
                    <div className="space-y-2">
                      {(
                        [
                          ['A', 'optionA'],
                          ['B', 'optionB'],
                          ['C', 'optionC'],
                          ['D', 'optionD'],
                        ] as [string, keyof ManualForm][]
                      ).map(([letter, field]) => (
                        <div key={letter} className="flex items-center gap-3">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-800 text-xs font-black text-white">
                            {letter}
                          </span>
                          <input
                            value={mf[field] as string}
                            onChange={(e) => setMf((f) => ({ ...f, [field]: e.target.value }))}
                            placeholder={`Đáp án ${letter}`}
                            className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>
                      Đáp án *{' '}
                      <span className="text-slate-400 font-normal normal-case">(VD: A, B, C, D)</span>
                    </label>
                    <input
                      value={mf.answerRaw}
                      onChange={(e) => setMf((f) => ({ ...f, answerRaw: e.target.value }))}
                      placeholder="Nhập đáp án..."
                      className={inputCls}
                    />
                  </div>
                </>
              )}

              {/* TFQ — Mệnh đề */}
              {mf.questionType === 'TFQ' && (
                <div>
                  <label className={labelCls}>Các mệnh đề</label>
                  <div className="space-y-2">
                    {(
                      [
                        [1, 'stmt1'],
                        [2, 'stmt2'],
                        [3, 'stmt3'],
                        [4, 'stmt4'],
                      ] as [number, keyof ManualForm][]
                    ).map(([n, field]) => (
                      <div key={n} className="flex items-center gap-3">
                        <span className="shrink-0 text-xs font-black text-slate-400 w-20">
                          Mệnh đề {n}
                        </span>
                        <input
                          value={mf[field] as string}
                          onChange={(e) => setMf((f) => ({ ...f, [field]: e.target.value }))}
                          placeholder={`Nội dung mệnh đề ${n}...`}
                          className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="mt-4">
                    <label className={labelCls}>
                      Đáp án *{' '}
                      <span className="text-slate-400 font-normal normal-case">
                        (VD: TRUE,FALSE,TRUE,FALSE)
                      </span>
                    </label>
                    <input
                      value={mf.answerRaw}
                      onChange={(e) => setMf((f) => ({ ...f, answerRaw: e.target.value }))}
                      placeholder="TRUE,FALSE,TRUE,FALSE"
                      className={inputCls}
                    />
                  </div>
                </div>
              )}

              {/* SAQ */}
              {mf.questionType === 'SAQ' && (
                <div>
                  <label className={labelCls}>Đáp án</label>
                  <textarea
                    value={mf.answerRaw}
                    onChange={(e) => setMf((f) => ({ ...f, answerRaw: e.target.value }))}
                    placeholder="Nhập đáp án tự luận..."
                    rows={3}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 resize-none"
                  />
                </div>
              )}

              {/* Kích hoạt */}
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={mf.isActive}
                  onChange={(e) => setMf((f) => ({ ...f, isActive: e.target.checked }))}
                  className="h-4 w-4 rounded accent-blue-600"
                />
                <span className="text-sm font-bold text-slate-700">Kích hoạt ngay sau khi tạo</span>
              </label>

              {createMutation.isError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-bold">
                  <AlertCircle size={14} />
                  Tạo câu hỏi thất bại. Vui lòng kiểm tra lại.
                </div>
              )}
            </div>
          )}

          {/* ── QUESTION BANK TAB ── */}
          {tab === 'QUESTION_BANK' && (
            <div className="space-y-3">

              {/* Search */}
              <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2">
                <Search size={14} className="text-slate-400 shrink-0" />
                <input
                  value={bankSearch}
                  onChange={(e) => { setBankSearch(e.target.value); setBankPage(0); setSelectedQuestions([]); setExpandedUuid(null); }}
                  placeholder="Tìm theo nội dung câu hỏi..."
                  className="flex-1 text-sm outline-none text-slate-700 placeholder:text-slate-400"
                />
              </div>

              {/* List */}
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
              ) : (
                <div className="space-y-1.5">
                  {bankQuestions.map((q) => {
                    const isSelected = selectedQuestions.some((s) => s.questionUuid === q.questionUuid);
                    const isExpanded = expandedUuid === q.questionUuid;
                    return (
                      <div
                        key={q.questionUuid}
                        className={`rounded-xl border transition-colors ${
                          isSelected ? 'border-blue-300 bg-blue-50' : 'border-slate-200'
                        }`}
                      >
                        {/* Row header */}
                        <div className="flex items-center gap-3 px-3 py-2.5">
                          {/* Checkbox */}
                          <button
                            type="button"
                            onClick={() => toggleQuestion(q)}
                            className="shrink-0 mt-0.5"
                          >
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                              isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300 hover:border-blue-400'
                            }`}>
                              {isSelected && (
                                <svg viewBox="0 0 10 8" className="w-2.5 h-2">
                                  <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                            </div>
                          </button>

                          {/* Content */}
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

                          {/* Expand toggle */}
                          <button
                            type="button"
                            onClick={() => setExpandedUuid(isExpanded ? null : (q.questionUuid ?? null))}
                            className="shrink-0 p-1 rounded-lg hover:bg-blue-100 text-slate-400 transition-colors"
                          >
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </div>

                        {/* Dropdown detail */}
                        {isExpanded && (
                          <div className="px-3 pb-3 pt-0 border-t border-slate-100 space-y-1.5">

                            {/* MCQ options */}
                            {q.questionType === 'MCQ' && (q.mcOptions ?? []).map((opt) => (
                              <div key={opt.optionUuid ?? opt.optionKey} className="flex items-center gap-2">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-800 text-[10px] font-black text-white">
                                  {opt.optionKey}
                                </span>
                                <span className="text-xs text-slate-600">{opt.optionContent ?? '—'}</span>
                              </div>
                            ))}

                            {/* TFQ statements */}
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

                            {/* Answer */}
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
              )}

              {/* Pagination */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-400 font-bold">
                  {selectedQuestions.length > 0
                    ? <span className="text-blue-600">Đã chọn {selectedQuestions.length} câu</span>
                    : `Trang ${bankPage + 1} / ${bankTotalPages}`
                  }
                </span>
                {bankTotalPages > 1 && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={bankPage === 0}
                      onClick={() => setBankPage((p) => p - 1)}
                      className="px-3 py-1 text-xs font-bold border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-blue-50 transition-colors"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      disabled={bankPage >= bankTotalPages - 1}
                      onClick={() => setBankPage((p) => p + 1)}
                      className="px-3 py-1 text-xs font-bold border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-blue-50 transition-colors"
                    >
                      →
                    </button>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ── IMPORTED TAB ── */}
          {tab === 'IMPORTED' && (
            <div className="flex flex-col items-center justify-center h-[200px] gap-2 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
              <FileUp size={36} className="opacity-20" />
              <p className="text-sm font-bold">Kéo thả file hoặc nhấn để chọn</p>
              <p className="text-xs">Hỗ trợ .xlsx, .csv</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-blue-100 transition-colors"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={!canCreate}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-colors"
          >
            {createMutation.isPending && <Loader2 size={14} className="animate-spin" />}
            {tab === 'QUESTION_BANK' ? 'Thêm vào bài thi' : 'Tạo câu hỏi'}
          </button>
        </div>

      </div>
    </div>
  );
}
