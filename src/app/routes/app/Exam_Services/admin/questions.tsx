import { useState } from 'react';
import {
  Search, Plus, Pencil, Trash2, ChevronLeft, ChevronRight,
  BookOpen, ListChecks, ToggleLeft, AlignLeft, Loader2, AlertCircle,
} from 'lucide-react';
import { useQuestionsQuery, useQuestionCountQuery } from '@/features/Exam_Services/question/api/questions';
import type { QuestionFilter, QuestionType } from '@/features/Exam_Services/question/types';

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
            
            <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors shadow-sm shadow-blue-200 shrink-0">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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

          <div>
            <button
              onClick={resetFilters}
              className="text-sm font-bold text-blue-600 hover:underline"
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
                    <th className="px-4 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {questions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-sm font-bold text-slate-400">
                        Không tìm thấy câu hỏi nào.
                      </td>
                    </tr>
                  ) : questions.map((q) => (
                    <tr key={q.questionUuid} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-4">
                        <input type="checkbox" className="rounded" />
                      </td>
                      <td className="px-4 py-3 text-xs font-black text-slate-500 whitespace-nowrap">
                        {shortUuid(q.questionUuid)}
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <p className="text-sm font-semibold text-slate-800 line-clamp-2">{q.questionContent ?? '—'}</p>
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
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200">
                            <Pencil size={12} />
                            Sửa
                          </button>
                          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-500 hover:bg-red-50 transition-colors border border-red-100">
                            <Trash2 size={12} />
                            Xóa
                          </button>
                        </div>
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
    </div>
  );
}
