import { useState } from 'react';
import { X, Loader2, AlertCircle, Info, Eye } from 'lucide-react';
import { useCreateQuestionMutation } from '@/features/Exam_Services/question/api/questions';
import type { Question, QuestionType, ReqCreateQuestion } from '@/features/Exam_Services/question/types';
import { GRADE_DISPLAY_NAME_BY_ID } from '@/features/Management_Services/timetable-template/lib/supplement-grades';
import { MathRender, MathSourceField } from '@/features/Exam_Services/math';

const GRADE_OPTIONS = Object.entries(GRADE_DISPLAY_NAME_BY_ID).map(([id, name]) => ({
  id: Number(id),
  name,
}));

const TYPE_LABEL: Record<string, string> = {
  MCQ: 'Trắc nghiệm',
  TFQ: 'Đúng / Sai',
  SAQ: 'Tự luận',
};

const EMPTY_FORM: ReqCreateQuestion = {
  gradeId: 0,
  questionContent: '',
  questionTopic: '',
  questionType: 'MCQ',
  isActive: true,
  mcOptions: [
    { optionKey: 'A', optionContent: '' },
    { optionKey: 'B', optionContent: '' },
    { optionKey: 'C', optionContent: '' },
    { optionKey: 'D', optionContent: '' },
  ],
  tfStatements: [
    { statementOrder: 1, statementContent: '' },
    { statementOrder: 2, statementContent: '' },
    { statementOrder: 3, statementContent: '' },
    { statementOrder: 4, statementContent: '' },
  ],
  answerKey: { correctAnswerRaw: '' },
};

const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400';
const labelCls = 'block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (question: Question) => void;
};

export function CreateQuestionDialog({ isOpen, onClose, onSuccess }: Props) {
  const [form, setForm] = useState<ReqCreateQuestion>(EMPTY_FORM);
  const createMutation = useCreateQuestionMutation();

  if (!isOpen) return null;

  function handleClose() {
    setForm(EMPTY_FORM);
    createMutation.reset();
    onClose();
  }

  function updateMcOption(index: number, value: string) {
    setForm((f) => {
      const opts = [...(f.mcOptions ?? [])];
      opts[index] = { ...opts[index], optionContent: value };
      return { ...f, mcOptions: opts };
    });
  }

  function updateTfStatement(index: number, value: string) {
    setForm((f) => {
      const stmts = [...(f.tfStatements ?? [])];
      stmts[index] = { ...stmts[index], statementContent: value };
      return { ...f, tfStatements: stmts };
    });
  }

  function handleCreate() {
    const payload: ReqCreateQuestion = {
      ...form,
      mcOptions:    form.questionType === 'MCQ' ? form.mcOptions    : undefined,
      tfStatements: form.questionType === 'TFQ' ? form.tfStatements : undefined,
    };
    createMutation.mutate(payload, {
      onSuccess: (data) => {
        onSuccess?.(data);
        handleClose();
      },
    });
  }

  const canCreate =
    form.questionContent.trim().length > 0 &&
    form.gradeId > 0 &&
    !createMutation.isPending;

  const answerRaw = form.answerKey.correctAnswerRaw.toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h3 className="text-base font-black text-slate-900">Tạo câu hỏi mới</h3>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body: 2 cột */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden">

          {/* ── CỘT TRÁI: Chỉnh sửa ── */}
          <div className="overflow-y-auto px-6 py-5 border-r border-slate-100">
            <div className="flex items-center gap-2 mb-5">
              <h4 className="text-sm font-black text-blue-600">1. Chỉnh sửa (LaTeX / MathLive)</h4>
              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                <Info size={12} />
                Bấm ƒ ở mỗi ô để chèn công thức.
              </span>
            </div>

            <div className="space-y-5">
              {/* Loại + Khối */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Loại câu hỏi *</label>
                  <select
                    value={form.questionType}
                    onChange={(e) => setForm((f) => ({ ...f, questionType: e.target.value as QuestionType }))}
                    className={`${inputCls} bg-white`}
                  >
                    <option value="MCQ">MCQ — Trắc nghiệm</option>
                    <option value="TFQ">TFQ — Đúng/Sai</option>
                    <option value="SAQ">SAQ — Tự luận</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Khối lớp *</label>
                  <select
                    value={form.gradeId || ''}
                    onChange={(e) => setForm((f) => ({ ...f, gradeId: Number(e.target.value) }))}
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
                <MathSourceField
                  value={form.questionContent}
                  onChange={(v) => setForm((f) => ({ ...f, questionContent: v }))}
                  placeholder="VD: Cho hàm số $f(x)=\dfrac{x^2-1}{x-1}$ với $x \ne 1$..."
                  ariaLabel="Nội dung câu hỏi"
                  rows={3}
                />
              </div>

              {/* Chủ đề */}
              <div>
                <label className={labelCls}>Chủ đề</label>
                <input
                  value={form.questionTopic ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, questionTopic: e.target.value }))}
                  placeholder="VD: Giải tích, Hình học..."
                  className={inputCls}
                />
              </div>

              {/* MCQ — đáp án */}
              {form.questionType === 'MCQ' && (
                <div>
                  <label className={labelCls}>Các đáp án</label>
                  <div className="space-y-2">
                    {(form.mcOptions ?? []).map((opt, i) => (
                      <div key={opt.optionKey} className="flex items-start gap-3">
                        <span className="mt-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-800 text-xs font-black text-white">
                          {opt.optionKey}
                        </span>
                        <div className="flex-1">
                          <MathSourceField
                            value={opt.optionContent}
                            onChange={(v) => updateMcOption(i, v)}
                            placeholder={`Đáp án ${opt.optionKey}`}
                            ariaLabel={`Đáp án ${opt.optionKey}`}
                            singleLine
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TFQ — mệnh đề */}
              {form.questionType === 'TFQ' && (
                <div>
                  <label className={labelCls}>Các mệnh đề</label>
                  <div className="space-y-2">
                    {(form.tfStatements ?? []).map((stmt, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="mt-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-800 text-xs font-black text-white">
                          {i + 1}
                        </span>
                        <div className="flex-1">
                          <MathSourceField
                            value={stmt.statementContent}
                            onChange={(v) => updateTfStatement(i, v)}
                            placeholder={`Mệnh đề ${i + 1}`}
                            ariaLabel={`Mệnh đề ${i + 1}`}
                            singleLine
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Đáp án đúng (không phải công thức) */}
              <div>
                <label className={labelCls}>
                  Đáp án *{' '}
                  {form.questionType === 'MCQ' && (
                    <span className="text-slate-400 font-normal normal-case">(VD: A, B, C, D)</span>
                  )}
                  {form.questionType === 'TFQ' && (
                    <span className="text-slate-400 font-normal normal-case">(VD: D, S, D, S)</span>
                  )}
                </label>
                <input
                  value={form.answerKey.correctAnswerRaw}
                  onChange={(e) => setForm((f) => ({ ...f, answerKey: { correctAnswerRaw: e.target.value } }))}
                  placeholder="Nhập đáp án..."
                  className={inputCls}
                />
              </div>

              {/* Kích hoạt */}
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.isActive ?? true}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="h-4 w-4 rounded accent-blue-600"
                />
                <span className="text-sm font-bold text-slate-700">Kích hoạt ngay sau khi tạo</span>
              </label>

              {createMutation.isError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-bold">
                  <AlertCircle size={14} />
                  Tạo thất bại. Vui lòng kiểm tra lại dữ liệu.
                </div>
              )}
            </div>
          </div>

          {/* ── CỘT PHẢI: Xem trước ── */}
          <div className="overflow-y-auto px-6 py-5 bg-slate-50/60">
            <div className="flex items-center gap-2 mb-5">
              <Eye size={15} className="text-blue-600" />
              <h4 className="text-sm font-black text-blue-600">2. Xem trước (KaTeX)</h4>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5">
              <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
                Câu hỏi ({TYPE_LABEL[form.questionType ?? 'MCQ']})
              </span>

              <div className="text-base font-semibold text-slate-900 leading-relaxed">
                <MathRender value={form.questionContent} fallback="Nội dung câu hỏi sẽ hiển thị ở đây…" />
              </div>

              <hr className="border-slate-100" />

              {/* MCQ preview */}
              {form.questionType === 'MCQ' && (
                <div className="space-y-3">
                  <p className="text-xs font-black uppercase tracking-wider text-blue-600">Các đáp án</p>
                  {(form.mcOptions ?? []).map((opt) => {
                    const isCorrect = answerRaw.split(/[,\s]+/).includes(opt.optionKey);
                    return (
                      <div
                        key={opt.optionKey}
                        className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                          isCorrect ? 'border-blue-300 bg-blue-50' : 'border-slate-100'
                        }`}
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-800 text-xs font-black text-white">
                          {opt.optionKey}
                        </span>
                        <span className="text-sm text-slate-700">
                          <MathRender value={opt.optionContent} fallback={`Phương án ${opt.optionKey}`} />
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TFQ preview */}
              {form.questionType === 'TFQ' && (
                <div className="space-y-3">
                  <p className="text-xs font-black uppercase tracking-wider text-blue-600">Các mệnh đề</p>
                  {(form.tfStatements ?? []).map((stmt, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-100 px-4 py-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-800 text-xs font-black text-white">
                        {i + 1}
                      </span>
                      <span className="text-sm text-slate-700">
                        <MathRender value={stmt.statementContent} fallback={`Mệnh đề ${i + 1}`} />
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* SAQ preview */}
              {form.questionType === 'SAQ' && (
                <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm font-medium text-slate-400">
                  Học sinh tự nhập câu trả lời (tự luận).
                </div>
              )}
            </div>

            <p className="mt-4 flex items-start gap-1.5 text-[11px] text-slate-400">
              <Info size={12} className="mt-0.5 shrink-0" />
              Bản xem trước trực tiếp bằng KaTeX. Kết quả hiển thị có thể khác đôi chút với đề thi thật tùy cài đặt.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
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
            Tạo câu hỏi
          </button>
        </div>

      </div>
    </div>
  );
}
