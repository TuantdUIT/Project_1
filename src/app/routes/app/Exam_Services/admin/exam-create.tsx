import { useState } from 'react';
import { useNavigate } from 'react-router';
import { TimePicker } from 'antd';
import dayjs from 'dayjs';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { useCreateExamMutation } from '@/features/Exam_Services/exam/api/exams';
import { splitDt, joinDt, toInstant } from '@/features/Exam_Services/exam/lib/exam-utils';
import type { ExamStatus, ExamType, ReqCreateExam } from '@/features/Exam_Services/exam/types';
import { GRADE_DISPLAY_NAME_BY_ID } from '@/features/Management_Services/timetable-template/lib/supplement-grades';
import { paths } from '@/config/paths';
import {
  DEFAULT_TYPE_SCORE,
  QUESTION_TYPES,
  type TypeScoreConfig,
} from '@/features/Exam_Services/exam/lib/type-score';
import { questionTypeLabel } from '@/features/Exam_Services/question/lib/question-type';

const GRADE_OPTIONS = Object.entries(GRADE_DISPLAY_NAME_BY_ID).map(([id, name]) => ({ id: Number(id), name }));

const EXAM_TYPE_LABEL: Record<string, string> = {
  QUIZ: 'Kiểm tra',
  HOMEWORK: 'Bài tập',
  MOCK_TEST: 'Thi thử',
  OFFICIAL_TEST: 'Kiểm tra chính thức',
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Chưa mở',
  PUBLISHED: 'Đang mở',
  CLOSED: 'Đã đóng',
  ARCHIVED: 'Lưu trữ',
};

const EMPTY_FORM: ReqCreateExam = {
  examName: '',
  gradeId: 0,
  schoolYear: '',
  examType: 'QUIZ',
  durationMinutes: 45,
  totalScore: 0,
  numberOfAttempt: 1,
  status: 'DRAFT',
  startTime: undefined,
  endTime: undefined,
  tfCorrect1Pct: 10,
  tfCorrect2Pct: 25,
  tfCorrect3Pct: 50,
  tfCorrect4Pct: 100,
  examQuestions: [],
  examQuestionGroups: [],
};

const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400';
const numberInputCls = `${inputCls} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`;
const labelCls = 'block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5';
const cardCls = 'bg-white rounded-2xl border border-slate-200 shadow-sm';

export default function AdminExamCreateRoute() {
  const navigate = useNavigate();
  const [form, setForm] = useState<ReqCreateExam>(EMPTY_FORM);
  const [startTimePart, setStartTimePart] = useState('');
  const [endTimePart, setEndTimePart] = useState('');
  const [typeScore, setTypeScore] = useState<TypeScoreConfig>(DEFAULT_TYPE_SCORE);
  const createMutation = useCreateExamMutation();

  // Giờ mở & giờ đóng là 2 mốc độc lập (sớm nhất để vào thi / trễ nhất để nộp).
  const startInstant = toInstant(joinDt(splitDt(form.startTime).date, startTimePart));
  const endInstant   = toInstant(joinDt(splitDt(form.endTime).date,   endTimePart));
  const timeRangeInvalid =
    !!startInstant && !!endInstant && new Date(startInstant) >= new Date(endInstant);

  function handleSubmit() {
    if (timeRangeInvalid) return;
    const payload: ReqCreateExam = {
      ...form,
      totalScore: 0,
      startTime: startInstant,
      endTime:   endInstant,
      examQuestions: [],
      examQuestionGroups: [],
    };
    createMutation.mutate(payload, {
      onSuccess: (data) => navigate(paths.adminPortalExamEdit(data.examUuid ?? ''), { state: { typeScore } }),
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          type="button"
          onClick={() => navigate(paths.adminPortalExams)}
          className="flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-800 mb-2 transition-colors"
        >
          <ArrowLeft size={15} />
          Quay lại danh sách
        </button>
        <h1 className="text-2xl font-black text-slate-900">Tạo phòng thi mới</h1>
        <p className="text-sm text-slate-500 mt-1">
          Điền thông tin chung. Câu hỏi sẽ được thêm sau khi tạo.
        </p>
      </div>

      {createMutation.isError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-bold">
          <AlertCircle size={16} />
          Tạo thất bại. Vui lòng kiểm tra lại dữ liệu.
        </div>
      )}

      <div className="max-w-2xl space-y-6">

        {/* 1. Thông tin chung */}
        <div className={`${cardCls} p-6`}>
          <h2 className="text-base font-black text-slate-900 mb-5">1. Thông tin chung</h2>
          <div className="space-y-4">

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Tên bài thi *</label>
                <input
                  value={form.examName}
                  onChange={(e) => setForm((f) => ({ ...f, examName: e.target.value }))}
                  placeholder="VD: Kiểm tra giữa kỳ Toán K11"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Năm học *</label>
                <input
                  value={form.schoolYear}
                  onChange={(e) => setForm((f) => ({ ...f, schoolYear: e.target.value }))}
                  placeholder="VD: 2026"
                  className={inputCls}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Khối lớp *</label>
                <select
                  value={form.gradeId || ''}
                  onChange={(e) => setForm((f) => ({ ...f, gradeId: Number(e.target.value) }))}
                  className={`${inputCls} bg-white`}
                >
                  <option value="">Chọn khối</option>
                  {GRADE_OPTIONS.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Loại bài thi *</label>
                <select
                  value={form.examType}
                  onChange={(e) => setForm((f) => ({ ...f, examType: e.target.value as ExamType }))}
                  className={`${inputCls} bg-white`}
                >
                  {Object.entries(EXAM_TYPE_LABEL).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Trạng thái *</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ExamStatus }))}
                  className={`${inputCls} bg-white`}
                >
                  {Object.entries(STATUS_LABEL).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Tổng điểm *</label>
                <input
                  type="number" min={0} step="0.01"
                  value={0}
                  disabled
                  className={`${numberInputCls} bg-slate-100 text-slate-500 cursor-not-allowed`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Thời lượng (phút) *</label>
                <input
                  type="number" min={0}
                  value={form.durationMinutes}
                  onChange={(e) => setForm((f) => ({ ...f, durationMinutes: Number(e.target.value) }))}
                  className={numberInputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Lượt làm lại *</label>
                <input
                  type="number" min={0}
                  value={form.numberOfAttempt}
                  onChange={(e) => setForm((f) => ({ ...f, numberOfAttempt: Number(e.target.value) }))}
                  className={numberInputCls}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Thời gian mở</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={splitDt(form.startTime).date}
                    onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value || undefined }))}
                    className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400"
                  />
                  <TimePicker
                    format="HH:mm"
                    value={startTimePart ? dayjs(startTimePart, 'HH:mm') : null}
                    onChange={(t) => setStartTimePart(t ? t.format('HH:mm') : '')}
                    className="w-24"
                    size="middle"
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Thời gian đóng</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={splitDt(form.endTime).date}
                    onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value || undefined }))}
                    className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400"
                  />
                  <TimePicker
                    format="HH:mm"
                    value={endTimePart ? dayjs(endTimePart, 'HH:mm') : null}
                    onChange={(t) => setEndTimePart(t ? t.format('HH:mm') : '')}
                    className="w-24"
                    size="middle"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* 2. Cấu hình chấm điểm */}
        <div className={`${cardCls} p-6`}>
          <h2 className="text-base font-black text-slate-900 mb-1">2. Cấu hình chấm điểm</h2>
          <p className="text-xs text-slate-400 mb-4">Điểm mặc định sẽ được áp dụng khi thêm câu hỏi sau khi tạo bài thi.</p>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {QUESTION_TYPES.map((type) => (
              <div key={type} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                <label className={labelCls}>{questionTypeLabel(type)}</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number" min={0.01} step="0.1"
                    value={typeScore[type] ?? ''}
                    onChange={(e) => setTypeScore((current) => ({
                      ...current,
                      [type]: e.target.value === '' ? null : Number(e.target.value),
                    }))}
                    className="min-w-0 flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400"
                  />
                  <span className="text-xs font-bold text-slate-400 shrink-0">điểm/câu</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Tỉ lệ điểm Đúng/Sai theo số ý đúng</p>
          <div className="grid grid-cols-4 gap-3">
            {(
              [
                ['tfCorrect1Pct', '1 ý đúng'],
                ['tfCorrect2Pct', '2 ý đúng'],
                ['tfCorrect3Pct', '3 ý đúng'],
                ['tfCorrect4Pct', '4 ý đúng'],
              ] as [keyof ReqCreateExam, string][]
            ).map(([key, label]) => (
              <div key={key}>
                <label className={labelCls}>{label}</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number" min={0} max={100}
                    value={(form[key] as number) ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: Number(e.target.value) }))}
                    className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400"
                  />
                  <span className="text-sm font-bold text-slate-400 shrink-0">%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 pb-4 max-w-2xl">
        {timeRangeInvalid && (
          <p className="mr-auto flex items-center gap-1.5 text-sm font-bold text-red-500">
            <AlertCircle size={14} />
            Thời gian mở phải trước thời gian đóng.
          </p>
        )}
        <button
          type="button"
          onClick={() => navigate(paths.adminPortalExams)}
          className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
        >
          Hủy
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={createMutation.isPending || timeRangeInvalid}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold px-6 py-2.5 rounded-xl transition-colors shadow-sm shadow-blue-200"
        >
          {createMutation.isPending && <Loader2 size={15} className="animate-spin" />}
          Tạo & thêm câu hỏi
        </button>
      </div>
    </div>
  );
}
