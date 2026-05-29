import { useState } from 'react';
import { Search, Plus, ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { useExamsQuery } from '@/features/Exam_Services/exam/api/exams';
import type { ExamType } from '@/features/Exam_Services/exam/types';
import { GRADE_DISPLAY_NAME_BY_ID } from '@/features/Management_Services/timetable-template/lib/supplement-grades';

const PAGE_SIZE = 10;

const EXAM_TYPE_LABEL: Record<string, string> = {
  QUIZ:          'Kiểm tra',
  HOMEWORK:      'Bài tập',
  MOCK_TEST:     'Thi thử',
  OFFICIAL_TEST: 'Thi chính thức',
};

const EXAM_TYPE_COLOR: Record<string, string> = {
  QUIZ:          'bg-blue-50 text-blue-600',
  HOMEWORK:      'bg-green-50 text-green-600',
  MOCK_TEST:     'bg-orange-50 text-orange-600',
  OFFICIAL_TEST: 'bg-purple-50 text-purple-600',
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT:     'Nháp',
  PUBLISHED: 'Đang mở',
  CLOSED:    'Đã đóng',
  ARCHIVED:  'Lưu trữ',
};

const STATUS_COLOR: Record<string, string> = {
  DRAFT:     'bg-slate-100 text-slate-500',
  PUBLISHED: 'bg-emerald-50 text-emerald-600',
  CLOSED:    'bg-red-50 text-red-500',
  ARCHIVED:  'bg-yellow-50 text-yellow-600',
};

export default function AdminExamsRoute() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ExamType | ''>('');
  const [page, setPage] = useState(0);

  const { data: pageData, isLoading, isError } = useExamsQuery();

  const allExams = pageData?.content ?? [];

  const filtered = allExams.filter((e) => {
    const matchSearch = search === '' || (e.examName ?? '').toLowerCase().includes(search.toLowerCase());
    const matchType   = typeFilter === '' || e.examType === typeFilter;
    return matchSearch && matchType;
  });

  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const paged       = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(0);
  }

  function handleTypeChange(value: ExamType | '') {
    setTypeFilter(value);
    setPage(0);
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          {/* <h1 className="text-2xl font-black text-slate-900">Quản lý phòng thi</h1> */}
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors shadow-sm shadow-blue-200 shrink-0">
            <Plus size={16} />
            Tạo phòng thi
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Tìm kiếm */}
            <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2">
              <Search size={14} className="text-slate-400 shrink-0" />
              <input
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Tên bài thi..."
                className="flex-1 text-sm outline-none text-slate-700 placeholder:text-slate-400"
              />
            </div>

            {/* Loại bài thi */}
            <select
              value={typeFilter}
              onChange={(e) => handleTypeChange(e.target.value as ExamType | '')}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none text-slate-700 focus:border-blue-400 bg-white"
            >
              <option value="">Tất cả loại</option>
              {Object.entries(EXAM_TYPE_LABEL).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => { handleSearchChange(''); handleTypeChange(''); }}
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
              <span className="font-bold text-sm">Không thể tải danh sách bài thi.</span>
            </div>
          )}

          {!isLoading && !isError && (
            <>
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-4 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest">Tên bài thi</th>
                    <th className="px-4 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest">Khối</th>
                    <th className="px-4 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest">Loại bài thi</th>
                    <th className="px-4 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest">Thời lượng</th>
                    <th className="px-4 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest">Lượt làm lại</th>
                    <th className="px-4 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paged.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-sm font-bold text-slate-400">
                        Không tìm thấy bài thi nào.
                      </td>
                    </tr>
                  ) : paged.map((exam) => (
                    <tr key={exam.examUuid} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-slate-800">{exam.examName ?? '—'}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {exam.gradeId ? (GRADE_DISPLAY_NAME_BY_ID[exam.gradeId] ?? `Khối #${exam.gradeId}`) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {exam.examType ? (
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${EXAM_TYPE_COLOR[exam.examType] ?? ''}`}>
                            {EXAM_TYPE_LABEL[exam.examType]}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {exam.durationMinutes != null ? `${exam.durationMinutes} phút` : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {exam.numberOfAttempt ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        {exam.status ? (
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${STATUS_COLOR[exam.status] ?? ''}`}>
                            {STATUS_LABEL[exam.status]}
                          </span>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-400">
                  Trang {currentPage + 1} / {totalPages}
                  <span className="ml-2 text-slate-300">· {filtered.length} bài thi</span>
                </p>
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage === 0}
                    onClick={() => setPage((p) => p - 1)}
                    className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    disabled={currentPage >= totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
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
