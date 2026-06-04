import { useState } from 'react';
import {
  Search, Plus, ChevronLeft, ChevronRight,
  BookOpen, ListChecks, ToggleLeft, AlignLeft, Loader2, AlertCircle, X,
} from 'lucide-react';
import { useQuestionsQuery, useQuestionCountQuery, useUpdateQuestionMutation } from '@/features/Exam_Services/question/api/questions';
import type { Question, QuestionFilter, QuestionType, ReqMcOption, ReqUpdateQuestion } from '@/features/Exam_Services/question/types';
import { CreateQuestionDialog } from '@/features/Exam_Services/question/components/create-question-dialog';
import { MathRender, MathSourceField } from '@/features/Exam_Services/math';
import { GRADE_DISPLAY_NAME_BY_ID } from '@/features/Management_Services/timetable-template/lib/supplement-grades';

const GRADE_OPTIONS = Object.entries(GRADE_DISPLAY_NAME_BY_ID).map(([id, name]) => ({
  id: Number(id),
  name,
}));

const TYPE_LABEL: Record<string, string> = { MCQ: 'MCQ', TFQ: 'TFQ', SAQ: 'SAQ' };
const TYPE_COLOR: Record<string, string> = {
  MCQ: 'bg-blue-50 text-blue-600',
  TFQ: 'bg-violet-50 text-violet-600',
  SAQ: 'bg-orange-50 text-orange-600',
};

const PAGE_SIZE = 10;

export default function AdminQuestionsRoute() {
  const [filter, setFilter] = useState<QuestionFilter>({
    content: '', topic: '', type: '', isActive: '', gradeId: '', page: 0, size: PAGE_SIZE,
  });
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editForm, setEditForm] = useState<ReqUpdateQuestion>({
    gradeId: 0, questionContent: '', questionTopic: '', questionType: 'MCQ', isActive: true,
    mcOptions: [], tfStatements: [], answerKey: { correctAnswerRaw: '' },
  });

  const updateMutation = useUpdateQuestionMutation();

  const { data: pageData, isLoading, isError } = useQuestionsQuery(filter);
  const { data: countAll }  = useQuestionCountQuery();
  const { data: countMCQ }  = useQuestionCountQuery('MCQ');
  const { data: countTFQ }  = useQuestionCountQuery('TFQ');
  const { data: countSAQ }  = useQuestionCountQuery('SAQ');

  const questions   = pageData?.content ?? [];
  const totalPages  = pageData?.totalPages ?? 1;
  const currentPage = pageData?.number ?? 0;

  function applySearch() {
    setFilter((f) => ({ ...f, content: search, page: 0 }));
  }

  function resetFilters() {
    setSearch('');
    setFilter({ content: '', topic: '', type: '', isActive: '', gradeId: '', page: 0, size: PAGE_SIZE });
  }

  function openEditModal(q: Question) {
    setEditingQuestion(q);
    setEditForm({
      gradeId: q.gradeId ?? 0,
      questionContent: q.questionContent ?? '',
      questionTopic: q.questionTopic ?? '',
      questionType: q.questionType ?? 'MCQ',
      isActive: q.isActive ?? true,
      mcOptions: (q.mcOptions ?? []).map((o) => ({ optionKey: o.optionKey ?? '', optionContent: o.optionContent ?? '' })),
      tfStatements: (q.tfStatements ?? [
        { statementOrder: 1, statementContent: '' },
        { statementOrder: 2, statementContent: '' },
        { statementOrder: 3, statementContent: '' },
        { statementOrder: 4, statementContent: '' },
      ]).map((s) => ({ statementOrder: s.statementOrder ?? 0, statementContent: s.statementContent ?? '' })),
      answerKey: { correctAnswerRaw: q.correctAnswerRaw ?? '' },
    });
  }
  function closeEditModal() { setEditingQuestion(null); }


  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingQuestion?.questionUuid) return;
    const payload: ReqUpdateQuestion = {
      ...editForm,
      mcOptions:    editForm.questionType === 'MCQ' ? editForm.mcOptions    : undefined,
      tfStatements: editForm.questionType === 'TFQ' ? editForm.tfStatements : undefined,
    };
    console.log('>>>>PUT payload:', JSON.stringify(payload, null, 2));
    updateMutation.mutate(
      { questionUuid: editingQuestion.questionUuid, body: payload },
      { onSuccess: closeEditModal },
    );
  }

  function updateEditMcOption(index: number, value: string) {
    setEditForm((f) => {
      const opts = [...(f.mcOptions ?? [])];
      opts[index] = { ...opts[index], optionContent: value };
      return { ...f, mcOptions: opts };
    });
  }

  function updateEditTfStatement(index: number, value: string) {
    setEditForm((f) => {
      const stmts = [...(f.tfStatements ?? [])];
      stmts[index] = { ...stmts[index], statementContent: value };
      return { ...f, tfStatements: stmts };
    });
  }

  function shortUuid(uuid?: string) {
    if (!uuid) return '—';
    return 'QST' + uuid.replace(/-/g, '').slice(0, 7).toUpperCase();
  }

  const stats = [
    { label: 'Tổng số câu hỏi', value: countAll?.totalElements ?? '—', icon: <BookOpen size={22} />, accent: 'bg-blue-50 text-blue-600' },
    { label: 'MCQ',              value: countMCQ?.totalElements ?? '—', icon: <ListChecks size={22} />, accent: 'bg-violet-50 text-violet-600' },
    { label: 'TFQ',              value: countTFQ?.totalElements ?? '—', icon: <ToggleLeft size={22} />, accent: 'bg-emerald-50 text-emerald-600' },
    { label: 'SAQ',              value: countSAQ?.totalElements ?? '—', icon: <AlignLeft size={22} />, accent: 'bg-orange-50 text-orange-600' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-black text-slate-900 shrink-0">Quản lý ngân hàng câu hỏi</h1>
          <div className="flex items-center gap-3 ml-auto">
            
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors shadow-sm shadow-blue-200 shrink-0"
            >
              <Plus size={16} />
              Tạo câu hỏi
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${s.accent}`}>
                {s.icon}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{s.label}</p>
                <p className="text-2xl font-black text-slate-900 leading-tight">
                  {s.value === '—' ? <span className="text-slate-300">—</span> : s.value.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Tìm kiếm */}
            <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2">
              <Search size={14} className="text-slate-400 shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applySearch()}
                placeholder="Nhập từ khóa..."
                className="flex-1 text-sm outline-none text-slate-700 placeholder:text-slate-400"
              />
            </div>

            {/* Chủ đề */}
            <input
              value={filter.topic ?? ''}
              onChange={(e) => setFilter((f) => ({ ...f, topic: e.target.value, page: 0 }))}
              placeholder="Chủ đề"
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none text-slate-700 placeholder:text-slate-400 focus:border-blue-400"
            />

            {/* Khối lớp */}
            <select
              value={filter.gradeId === '' ? '' : String(filter.gradeId)}
              onChange={(e) => {
                const v = e.target.value;
                setFilter((f) => ({ ...f, gradeId: v === '' ? '' : Number(v), page: 0 }));
              }}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none text-slate-700 focus:border-blue-400 bg-white"
            >
              <option value="">Tất cả khối</option>
              {GRADE_OPTIONS.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>

            {/* Loại câu hỏi */}
            <select
              value={filter.type ?? ''}
              onChange={(e) => setFilter((f) => ({ ...f, type: e.target.value as QuestionType | '', page: 0 }))}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none text-slate-700 focus:border-blue-400 bg-white"
            >
              <option value="">Tất cả loại</option>
              <option value="MCQ">MCQ</option>
              <option value="TFQ">TFQ</option>
              <option value="SAQ">SAQ</option>
            </select>

            {/* Trạng thái */}
            <select
              value={filter.isActive === '' ? '' : String(filter.isActive)}
              onChange={(e) => {
                const v = e.target.value;
                setFilter((f) => ({ ...f, isActive: v === '' ? '' : v === 'true', page: 0 }));
              }}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none text-slate-700 focus:border-blue-400 bg-white"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="true">Đang hoạt động</option>
              <option value="false">Ẩn</option>
            </select>
          </div>

          <div className="flex justify-end">
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {isLoading && (
            <div className="flex items-center justify-center py-20 text-slate-400 gap-3">
              <Loader2 className="animate-spin" size={22} />
              <span className="font-bold text-sm">Đang tải dữ liệu...</span>
            </div>
          )}

          {isError && (
            <div className="flex items-center justify-center py-20 text-red-400 gap-3">
              <AlertCircle size={22} />
              <span className="font-bold text-sm">Không thể tải danh sách câu hỏi.</span>
            </div>
          )}

          {!isLoading && !isError && (
            <>
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="w-10 p-4">
                      <input type="checkbox" className="rounded" />
                    </th>
                    <th className="px-4 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Mã câu hỏi</th>
                    <th className="px-4 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest">Nội dung câu hỏi</th>
                    <th className="px-4 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest">Loại</th>
                    <th className="px-4 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest">Chủ đề</th>
                    <th className="px-4 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {questions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-sm font-bold text-slate-400">
                        Không tìm thấy câu hỏi nào.
                      </td>
                    </tr>
                  ) : questions.map((q) => (
                    <tr
                      key={q.questionUuid}
                      onClick={() => openEditModal(q)}
                      className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                    >
                      <td className="p-4">
                        <input type="checkbox" className="rounded" />
                      </td>
                      <td className="px-4 py-3 text-xs font-black text-slate-500 whitespace-nowrap">
                        {shortUuid(q.questionUuid)}
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <p className="text-sm font-semibold text-slate-800 line-clamp-2">
                          <MathRender value={q.questionContent} fallback="—" />
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        {q.questionType ? (
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${TYPE_COLOR[q.questionType] ?? ''}`}>
                            {TYPE_LABEL[q.questionType]}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 max-w-[140px] truncate">
                        {q.questionTopic ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        {q.isActive === undefined ? '—' : q.isActive ? (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-50 text-emerald-600">Đang hoạt động</span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-slate-100 text-slate-400">Ẩn</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-400">
                  Trang {currentPage + 1} / {totalPages}
                  {pageData?.totalElements != null && (
                    <span className="ml-2 text-slate-300">· {pageData.totalElements.toLocaleString()} câu hỏi</span>
                  )}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage === 0}
                    onClick={() => setFilter((f) => ({ ...f, page: f.page - 1 }))}
                    className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    disabled={currentPage >= totalPages - 1}
                    onClick={() => setFilter((f) => ({ ...f, page: f.page + 1 }))}
                    className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

      </div>

      <CreateQuestionDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Modal chỉnh sửa câu hỏi */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-black text-slate-900">Chỉnh sửa câu hỏi</h2>
              <button onClick={closeEditModal} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-5">
              {/* Loại + Khối lớp */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Loại câu hỏi *</label>
                  <select
                    value={editForm.questionType}
                    onChange={(e) => setEditForm((f) => ({ ...f, questionType: e.target.value as QuestionType }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 bg-white"
                  >
                    <option value="MCQ">MCQ — Trắc nghiệm</option>
                    <option value="TFQ">TFQ — Đúng/Sai</option>
                    <option value="SAQ">SAQ — Trả lời ngắn</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Khối lớp *</label>
                  <select
                    value={editForm.gradeId || ''}
                    onChange={(e) => setEditForm((f) => ({ ...f, gradeId: Number(e.target.value) }))}
                    required
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 bg-white"
                  >
                    <option value="">Chọn khối lớp</option>
                    {GRADE_OPTIONS.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Nội dung */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Nội dung câu hỏi *</label>
                <MathSourceField
                  value={editForm.questionContent ?? ''}
                  onChange={(v) => setEditForm((f) => ({ ...f, questionContent: v }))}
                  placeholder="VD: Cho hàm số $f(x)=\dfrac{x^2-1}{x-1}$..."
                  ariaLabel="Nội dung câu hỏi"
                  rows={3}
                />
              </div>

              {/* Chủ đề */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Chủ đề</label>
                <input
                  value={editForm.questionTopic ?? ''}
                  onChange={(e) => setEditForm((f) => ({ ...f, questionTopic: e.target.value }))}
                  placeholder="VD: Giải tích, Hình học..."
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400"
                />
              </div>

              {/* MCQ options */}
              {editForm.questionType === 'MCQ' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Các đáp án</label>
                  <div className="space-y-2">
                    {(editForm.mcOptions ?? []).map((opt, i) => (
                      <div key={opt.optionKey} className="flex items-start gap-2">
                        <span className="mt-1.5 w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 text-xs font-black text-slate-600 shrink-0">
                          {opt.optionKey}
                        </span>
                        <div className="flex-1">
                          <MathSourceField
                            value={opt.optionContent}
                            onChange={(v) => updateEditMcOption(i, v)}
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

              {/* TFQ statements */}
              {editForm.questionType === 'TFQ' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Các mệnh đề</label>
                  <div className="space-y-2">
                    {(editForm.tfStatements ?? []).map((stmt, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="mt-1.5 w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 text-xs font-black text-slate-600 shrink-0">
                          {i + 1}
                        </span>
                        <div className="flex-1">
                          <MathSourceField
                            value={stmt.statementContent}
                            onChange={(v) => updateEditTfStatement(i, v)}
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

              {/* Đáp án */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider">
                  Đáp án *
                  {editForm.questionType === 'MCQ' && <span className="ml-1 font-normal normal-case text-slate-400">(VD: A, B, C, D)</span>}
                  {editForm.questionType === 'TFQ' && <span className="ml-1 font-normal normal-case text-slate-400">(VD: DSDS)</span>}
                </label>
                <input
                  value={editForm.answerKey.correctAnswerRaw}
                  onChange={(e) => setEditForm((f) => ({ ...f, answerKey: { correctAnswerRaw: e.target.value } }))}
                  placeholder="Nhập đáp án..."
                  required
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400"
                />
              </div>

              {/* Trạng thái */}
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editForm.isActive ?? true}
                  onChange={(e) => setEditForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm font-bold text-slate-700">Đang hoạt động</span>
              </label>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-colors"
                >
                  {updateMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                  Lưu thay đổi
                </button>
              </div>

              {updateMutation.isError && (
                <p className="text-xs font-bold text-red-500 flex items-center gap-1.5">
                  <AlertCircle size={13} /> Cập nhật thất bại. Vui lòng kiểm tra lại dữ liệu.
                </p>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
