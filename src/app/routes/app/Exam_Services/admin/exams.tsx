import { useState } from 'react';
import { Search, Plus, Pencil, ChevronLeft, ChevronRight, Loader2, AlertCircle, X } from 'lucide-react';
import { TimePicker } from 'antd';
import dayjs from 'dayjs';
import { useExamsQuery, useCreateExamMutation, useUpdateExamMutation } from '@/features/Exam_Services/exam/api/exams';
import { calcEndTime } from '@/features/Exam_Services/exam/lib/exam-utils';
import type { Exam, ExamStatus, ExamType, ReqCreateExam, ReqUpdateExam } from '@/features/Exam_Services/exam/types';
import { GRADE_DISPLAY_NAME_BY_ID, GRADE_DISPLAY_NAME_BY_ID as GRADE_MAP } from '@/features/Management_Services/timetable-template/lib/supplement-grades';

const GRADE_OPTIONS = Object.entries(GRADE_MAP).map(([id, name]) => ({ id: Number(id), name }));

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

const toInstant = (value?: string) =>
  value ? new Date(value).toISOString() : undefined;

function splitDt(value?: string) {
  if (!value) return { date: '', time: '' };
  const [date, time] = value.split('T');
  return { date: date ?? '', time: time ?? '' };
}

function joinDt(date: string, time: string) {
  if (!date) return undefined;
  return `${date}T${time || '00:00'}`;
}

const EMPTY_FORM: ReqCreateExam = {
  examName: '',
  gradeId: 0,
  examType: 'QUIZ',
  durationMinutes: 45,
  totalScore: 10,
  numberOfAttempt: 1,
  status: 'DRAFT',
  startTime: undefined,
  endTime: undefined,
};

export default function AdminExamsRoute() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ExamType | ''>('');
  const [page, setPage] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<ReqCreateExam>(EMPTY_FORM);
  const [createStartTime, setCreateStartTime] = useState('');
  const [createEndTime,   setCreateEndTime]   = useState('');
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [editForm, setEditForm] = useState<ReqUpdateExam>(EMPTY_FORM);
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime,   setEditEndTime]   = useState('');

  const { data: pageData, isLoading, isError } = useExamsQuery();
  const createMutation = useCreateExamMutation();
  const updateMutation = useUpdateExamMutation();

  function openModal() {
    setForm(EMPTY_FORM);
    setCreateStartTime('');
    setCreateEndTime('');
    setIsModalOpen(true);
  }
  function closeModal() { setIsModalOpen(false); }

  function openEditModal(exam: Exam) {
    setEditingExam(exam);
    setEditForm({
      examName:        exam.examName        ?? '',
      gradeId:         exam.gradeId         ?? 0,
      examType:        exam.examType        ?? 'QUIZ',
      durationMinutes: exam.durationMinutes ?? 45,
      totalScore:      exam.totalScore      ?? 10,
      numberOfAttempt: exam.numberOfAttempt ?? 1,
      status:          exam.status          ?? 'DRAFT',
      startTime:       exam.startTime       ?? undefined,
      endTime:         exam.endTime         ?? undefined,
    });
    setEditStartTime(splitDt(exam.startTime).time);
    setEditEndTime(splitDt(exam.endTime).time);
  }
  function closeEditModal() { setEditingExam(null); }

  function autoFillCreateEnd(startDate: string, startTime: string, duration: number) {
    const result = calcEndTime(startDate, startTime, duration);
    if (!result) return;
    setForm((f) => ({ ...f, endTime: result.date }));
    setCreateEndTime(result.time);
  }

  function autoFillEditEnd(startDate: string, startTime: string, duration: number) {
    const result = calcEndTime(startDate, startTime, duration);
    if (!result) return;
    setEditForm((f) => ({ ...f, endTime: result.date }));
    setEditEndTime(result.time);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const payload: ReqCreateExam = {
      ...form,
      startTime: toInstant(joinDt(splitDt(form.startTime).date, createStartTime)),
      endTime:   toInstant(joinDt(splitDt(form.endTime).date,   createEndTime)),
    };
    createMutation.mutate(payload, { onSuccess: closeModal });
  }

  function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingExam?.examUuid) return;
    const payload: ReqUpdateExam = {
      ...editForm,
      startTime: toInstant(joinDt(splitDt(editForm.startTime).date, editStartTime)),
      endTime:   toInstant(joinDt(splitDt(editForm.endTime).date,   editEndTime)),
    };
    updateMutation.mutate({ examUuid: editingExam.examUuid, body: payload }, { onSuccess: closeEditModal });
  }

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
          <h1 className="text-2xl font-black text-slate-900">Quản lý phòng thi</h1>
          <button
            onClick={openModal}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors shadow-sm shadow-blue-200 shrink-0"
          >
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
                    <th className="px-4 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paged.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-sm font-bold text-slate-400">
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
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openEditModal(exam)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200"
                        >
                          <Pencil size={12} />
                          Sửa
                        </button>
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

      {/* Modal tạo phòng thi */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-black text-slate-900">Tạo phòng thi mới</h2>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Tên bài thi */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Tên bài thi *</label>
                <input
                  value={form.examName}
                  onChange={(e) => setForm((f) => ({ ...f, examName: e.target.value }))}
                  placeholder="VD: Kiểm tra giữa kỳ Toán K11"
                  required
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400"
                />
              </div>

              {/* Khối lớp + Loại bài thi */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Khối lớp *</label>
                  <select
                    value={form.gradeId || ''}
                    onChange={(e) => setForm((f) => ({ ...f, gradeId: Number(e.target.value) }))}
                    required
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 bg-white"
                  >
                    <option value="">Chọn khối</option>
                    {GRADE_OPTIONS.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Loại bài thi *</label>
                  <select
                    value={form.examType}
                    onChange={(e) => setForm((f) => ({ ...f, examType: e.target.value as ExamType }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 bg-white"
                  >
                    {Object.entries(EXAM_TYPE_LABEL).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Thời lượng + Tổng điểm */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Thời lượng (phút) *</label>
                  <input
                    type="number"
                    min={0}
                    value={form.durationMinutes}
                    onChange={(e) => {
                      const duration = Number(e.target.value);
                      setForm((f) => ({ ...f, durationMinutes: duration }));
                      autoFillCreateEnd(splitDt(form.startTime).date, createStartTime, duration);
                    }}
                    required
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Tổng điểm *</label>
                  <input
                    type="number"
                    min={0.01}
                    step="0.01"
                    value={form.totalScore}
                    onChange={(e) => setForm((f) => ({ ...f, totalScore: Number(e.target.value) }))}
                    required
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400"
                  />
                </div>
              </div>

              {/* Lượt làm lại + Trạng thái */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Lượt làm lại *</label>
                  <input
                    type="number"
                    min={0}
                    value={form.numberOfAttempt}
                    onChange={(e) => setForm((f) => ({ ...f, numberOfAttempt: Number(e.target.value) }))}
                    required
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Trạng thái *</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ExamStatus }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 bg-white"
                  >
                    {Object.entries(STATUS_LABEL).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Thời gian mở / đóng (optional) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Thời gian mở</label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={splitDt(form.startTime).date}
                      onChange={(e) => {
                        const date = e.target.value;
                        setForm((f) => ({ ...f, startTime: date || undefined }));
                        autoFillCreateEnd(date, createStartTime, form.durationMinutes);
                      }}
                      className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400"
                    />
                    <TimePicker
                      format="HH:mm"
                      value={createStartTime ? dayjs(createStartTime, 'HH:mm') : null}
                      onChange={(t) => {
                        const time = t ? t.format('HH:mm') : '';
                        setCreateStartTime(time);
                        autoFillCreateEnd(splitDt(form.startTime).date, time, form.durationMinutes);
                      }}
                      className="w-24"
                      size="middle"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Thời gian đóng</label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={splitDt(form.endTime).date}
                      onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value || undefined }))}
                      className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400"
                    />
                    <TimePicker
                      format="HH:mm"
                      value={createEndTime ? dayjs(createEndTime, 'HH:mm') : null}
                      onChange={(t) => setCreateEndTime(t ? t.format('HH:mm') : '')}
                      className="w-24"
                      size="middle"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-colors"
                >
                  {createMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                  Tạo phòng thi
                </button>
              </div>

              {createMutation.isError && (
                <p className="text-xs font-bold text-red-500 flex items-center gap-1.5">
                  <AlertCircle size={13} /> Tạo thất bại. Vui lòng kiểm tra lại dữ liệu.
                </p>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Modal chỉnh sửa phòng thi */}
      {editingExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-black text-slate-900">Chỉnh sửa phòng thi</h2>
              <button onClick={closeEditModal} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {/* Tên bài thi */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Tên bài thi *</label>
                <input
                  value={editForm.examName}
                  onChange={(e) => setEditForm((f) => ({ ...f, examName: e.target.value }))}
                  required
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400"
                />
              </div>

              {/* Khối lớp + Loại bài thi */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Khối lớp *</label>
                  <select
                    value={editForm.gradeId || ''}
                    onChange={(e) => setEditForm((f) => ({ ...f, gradeId: Number(e.target.value) }))}
                    required
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 bg-white"
                  >
                    <option value="">Chọn khối</option>
                    {GRADE_OPTIONS.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Loại bài thi *</label>
                  <select
                    value={editForm.examType}
                    onChange={(e) => setEditForm((f) => ({ ...f, examType: e.target.value as ExamType }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 bg-white"
                  >
                    {Object.entries(EXAM_TYPE_LABEL).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Thời lượng + Tổng điểm */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Thời lượng (phút) *</label>
                  <input
                    type="number" min={0}
                    value={editForm.durationMinutes}
                    onChange={(e) => {
                      const duration = Number(e.target.value);
                      setEditForm((f) => ({ ...f, durationMinutes: duration }));
                      autoFillEditEnd(splitDt(editForm.startTime).date, editStartTime, duration);
                    }}
                    required
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Tổng điểm *</label>
                  <input
                    type="number" min={0.01} step="0.01"
                    value={editForm.totalScore}
                    onChange={(e) => setEditForm((f) => ({ ...f, totalScore: Number(e.target.value) }))}
                    required
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400"
                  />
                </div>
              </div>

              {/* Lượt làm lại + Trạng thái */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Lượt làm lại *</label>
                  <input
                    type="number" min={0}
                    value={editForm.numberOfAttempt}
                    onChange={(e) => setEditForm((f) => ({ ...f, numberOfAttempt: Number(e.target.value) }))}
                    required
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Trạng thái *</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value as ExamStatus }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 bg-white"
                  >
                    {Object.entries(STATUS_LABEL).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Thời gian mở / đóng */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Thời gian mở</label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={splitDt(editForm.startTime).date}
                      onChange={(e) => {
                        const date = e.target.value;
                        setEditForm((f) => ({ ...f, startTime: date || undefined }));
                        autoFillEditEnd(date, editStartTime, editForm.durationMinutes);
                      }}
                      className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400"
                    />
                    <TimePicker
                      format="HH:mm"
                      value={editStartTime ? dayjs(editStartTime, 'HH:mm') : null}
                      onChange={(t) => {
                        const time = t ? t.format('HH:mm') : '';
                        setEditStartTime(time);
                        autoFillEditEnd(splitDt(editForm.startTime).date, time, editForm.durationMinutes);
                      }}
                      className="w-24"
                      size="middle"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Thời gian đóng</label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={splitDt(editForm.endTime).date}
                      onChange={(e) => setEditForm((f) => ({ ...f, endTime: e.target.value || undefined }))}
                      className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400"
                    />
                    <TimePicker
                      format="HH:mm"
                      value={editEndTime ? dayjs(editEndTime, 'HH:mm') : null}
                      onChange={(t) => setEditEndTime(t ? t.format('HH:mm') : '')}
                      className="w-24"
                      size="middle"
                    />
                  </div>
                </div>
              </div>

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
