import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { TimePicker } from 'antd';
import dayjs from 'dayjs';
import { ArrowLeft, Plus, Info, Loader2, AlertCircle, CheckCircle2, FileBarChart } from 'lucide-react';
import { useToastExam } from '@/hooks/hook_ES/use-toast-exam';
import { useExamQuery, useUpdateExamMutation } from '@/features/Exam_Services/exam/api/exams';
import { splitDt, joinDt, toInstant } from '@/features/Exam_Services/exam/lib/exam-utils';
import { questionTypeLabel } from '@/features/Exam_Services/question/lib/question-type';
import type {
  Exam,
  ExamStatus,
  ExamType,
  ReqUpdateExam,
  ReqExamQuestion,
  ReqExamQuestionGroup,
} from '@/features/Exam_Services/exam/types';
import { AddQuestionDialog, type ExamQuestionItem } from '@/features/Exam_Services/exam/components/add-question-dialog';
import { CreateGroupDialog, type GroupForm } from '@/features/Exam_Services/exam/components/create-group-dialog';
import { ExistingGroupDialog, type ExistingGroupPayload } from '@/features/Exam_Services/exam/components/existing-group-dialog';
import { ExamResultsDialog } from '@/features/Exam_Services/exam/components/exam-results-dialog';
import { GRADE_DISPLAY_NAME_BY_ID } from '@/features/Management_Services/timetable-template/lib/supplement-grades';
import { paths } from '@/config/paths';
import {
  DEFAULT_TYPE_SCORE,
  QUESTION_TYPES,
  calculateExamTotalScore,
  getExamGroups,
  getStandaloneQuestions,
  inferTypeScore,
  scoreForType,
  type QuestionType,
  type TypeScoreConfig,
} from '@/features/Exam_Services/exam/lib/type-score';

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

const SECTION_TYPE_COLOR: Record<string, string> = {
  MCQ: 'bg-blue-50 text-blue-600',
  TFQ: 'bg-emerald-50 text-emerald-600',
  SAQ: 'bg-orange-50 text-orange-600',
};

const SOURCE_TYPE_LABEL: Record<string, string> = {
  MANUAL: 'Nhập tay',
  QUESTION_BANK: 'Ngân hàng câu hỏi',
  IMPORTED: 'Thêm từ file',
};

const SOURCE_TYPE_COLOR: Record<string, string> = {
  MANUAL: 'bg-slate-100 text-slate-600',
  QUESTION_BANK: 'bg-green-50 text-green-600',
  IMPORTED: 'bg-orange-50 text-orange-600',
};

function buildExamQuestionsPayload(exam: Exam, typeScore: TypeScoreConfig): ReqExamQuestion[] {
  return getStandaloneQuestions(exam).map((q) => ({
    questionUuid:  q.questionUuid  ?? '',
    questionOrder: q.questionOrder ?? 0,
    score:         scoreForType(typeScore, q.sectionType, q.score ?? 1),
    sectionType:   (q.sectionType  ?? 'MCQ') as 'MCQ' | 'TFQ' | 'SAQ',
    sourceType:    (q.sourceType   ?? 'MANUAL') as 'MANUAL' | 'QUESTION_BANK' | 'IMPORTED',
  }));
}

function buildExamGroupsPayload(exam: Exam, typeScore: TypeScoreConfig): ReqExamQuestionGroup[] {
  return getExamGroups(exam).map((g) => ({
    questionGroupUuid: g.questionGroupUuid,
    pickQuestionCount: g.pickQuestionCount ?? 0,
    scorePerQuestion:  scoreForType(typeScore, g.questionType, g.scorePerQuestion ?? 1),
    displayOrder:      g.displayOrder      ?? 0,
  }));
}

const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400';
const numberInputCls = `${inputCls} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`;
const labelCls = 'block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5';
const cardCls = 'bg-white rounded-2xl border border-slate-200 shadow-sm';

export default function AdminExamEditRoute() {
  const { examUuid } = useParams<{ examUuid: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const carriedTypeScore = (location.state as { typeScore?: TypeScoreConfig } | null)?.typeScore;

  const { data: exam, isLoading, isError } = useExamQuery(examUuid ?? '');
  const [form, setForm] = useState<ReqUpdateExam | null>(null);
  const [startTimePart, setStartTimePart] = useState('');
  const [endTimePart, setEndTimePart] = useState('');
  const [typeScore, setTypeScore] = useState<TypeScoreConfig>(carriedTypeScore ?? DEFAULT_TYPE_SCORE);
  const [isAddQOpen, setIsAddQOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen]   = useState(false);
  const [isUseExistingOpen, setIsUseExistingOpen]   = useState(false);
  const [isResultsOpen, setIsResultsOpen]           = useState(false);
  const initializedTypeScoreForExam = useRef<string | null>(null);

  const updateMutation = useUpdateExamMutation();
  const { toasts, show: showToast } = useToastExam();

  useEffect(() => {
    if (!exam) return;
    setForm({
      examName:        exam.examName        ?? '',
      gradeId:         exam.gradeId         ?? 0,
      schoolYear:      exam.schoolYear      ?? '',
      examType:        exam.examType        ?? 'QUIZ',
      durationMinutes: exam.durationMinutes ?? 45,
      totalScore:      exam.totalScore      ?? 10,
      numberOfAttempt: exam.numberOfAttempt ?? 1,
      status:          exam.status          ?? 'DRAFT',
      startTime:       exam.startTime       ?? undefined,
      endTime:         exam.endTime         ?? undefined,
      tfCorrect1Pct:   exam.tfCorrect1Pct   ?? 10,
      tfCorrect2Pct:   exam.tfCorrect2Pct   ?? 25,
      tfCorrect3Pct:   exam.tfCorrect3Pct   ?? 50,
      tfCorrect4Pct:   exam.tfCorrect4Pct   ?? 100,
    });
    setStartTimePart(splitDt(exam.startTime).time);
    setEndTimePart(splitDt(exam.endTime).time);
    if (initializedTypeScoreForExam.current !== examUuid) {
      const inferred = inferTypeScore(exam);
      setTypeScore(
        carriedTypeScore
          ? Object.fromEntries(
              QUESTION_TYPES.map((type) => [type, inferred[type] ?? carriedTypeScore[type]]),
            ) as TypeScoreConfig
          : inferred,
      );
      initializedTypeScoreForExam.current = examUuid ?? null;
    }
  }, [carriedTypeScore, exam, examUuid]);

  function buildBasePayload(): ReqUpdateExam {
    return {
      ...form!,
      startTime: toInstant(joinDt(splitDt(form!.startTime).date, startTimePart)),
      endTime:   toInstant(joinDt(splitDt(form!.endTime).date,   endTimePart)),
    };
  }

  function buildPayloadWithContent(
    examQuestions: ReqExamQuestion[],
    examQuestionGroups: ReqExamQuestionGroup[],
  ): ReqUpdateExam {
    return {
      ...buildBasePayload(),
      totalScore: calculateExamTotalScore(examQuestions, examQuestionGroups),
      examQuestions,
      examQuestionGroups,
    };
  }

  function handleQuestionConfirm(items: ExamQuestionItem[]) {
    if (!form || !examUuid || !exam || items.length === 0) return;
    const existing = buildExamQuestionsPayload(exam, typeScore);
    const existingGroups = buildExamGroupsPayload(exam, typeScore);
    const questions = [
      ...existing,
      ...items.map((item) => ({
          questionUuid:  item.questionUuid  ?? '',
          questionOrder: item.questionOrder,
          score:         item.score,
          sectionType:   item.sectionType,
          sourceType:    item.sourceType,
      })),
    ];
    const payload = buildPayloadWithContent(questions, existingGroups);
    updateMutation.mutate({ examUuid, body: payload }, {
      onSuccess: () => showToast(`Đã thêm ${items.length} câu hỏi`),
    });
  }

  function handleGroupConfirm(groupForm: GroupForm) {
    if (!form || !examUuid || !exam) return;
    const existingQuestions = buildExamQuestionsPayload(exam, typeScore);
    const existingGroups    = buildExamGroupsPayload(exam, typeScore);
    const groups = [
      ...existingGroups,
      {
          newQuestionGroup: {
            groupName:     groupForm.groupName,
            questionType:  groupForm.questionType,
            questionTopic: groupForm.questionTopic || undefined,
            questionCount: groupForm.itemUuids.length,
            items:         groupForm.itemUuids.map((uuid) => ({ questionUuid: uuid })),
          },
          pickQuestionCount: groupForm.pickQuestionCount,
          scorePerQuestion:  scoreForType(typeScore, groupForm.questionType, groupForm.scorePerQuestion),
          displayOrder:      groupForm.displayOrder,
      },
    ];
    const payload = buildPayloadWithContent(existingQuestions, groups);
    updateMutation.mutate({ examUuid, body: payload });
  }

  function handleExistingGroupConfirm(payload: ExistingGroupPayload) {
    if (!form || !examUuid || !exam) return;
    const existingQuestions = buildExamQuestionsPayload(exam, typeScore);
    const existingGroups    = buildExamGroupsPayload(exam, typeScore);
    const newGroup: ReqExamQuestionGroup = {
      questionGroupUuid: payload.questionGroupUuid,
      pickQuestionCount: payload.pickQuestionCount,
      scorePerQuestion:  scoreForType(typeScore, payload.questionType, payload.scorePerQuestion),
      displayOrder:      payload.displayOrder,
    };
    updateMutation.mutate({
      examUuid,
      body: buildPayloadWithContent(existingQuestions, [...existingGroups, newGroup]),
    });
  }

  function handleQuestionDelete(questionUuid?: string, questionOrder?: number) {
    if (!form || !examUuid || !exam) return;
    const questions = buildExamQuestionsPayload(exam, typeScore).filter(
      (question) =>
        question.questionUuid !== questionUuid || question.questionOrder !== questionOrder,
    );
    const groups = buildExamGroupsPayload(exam, typeScore);
    updateMutation.mutate({ examUuid, body: buildPayloadWithContent(questions, groups) });
  }

  function handleGroupDelete(questionGroupUuid?: string) {
    if (!form || !examUuid || !exam || !questionGroupUuid) return;
    const questions = buildExamQuestionsPayload(exam, typeScore);
    const groups = buildExamGroupsPayload(exam, typeScore).filter(
      (group) => group.questionGroupUuid !== questionGroupUuid,
    );
    updateMutation.mutate({ examUuid, body: buildPayloadWithContent(questions, groups) });
  }

  function handleSubmit() {
    if (!form || !examUuid || !exam || timeRangeInvalid) return;
    const existingQuestions = buildExamQuestionsPayload(exam, typeScore);
    const existingGroups    = buildExamGroupsPayload(exam, typeScore);
    const payload = buildPayloadWithContent(existingQuestions, existingGroups);
    updateMutation.mutate({ examUuid, body: payload }, {
      onSuccess: () => navigate(paths.adminPortalExams),
    });
  }

  if (isLoading || (!form && !isError)) {
    return (
      <div className="flex items-center justify-center py-32 text-slate-400 gap-3">
        <Loader2 className="animate-spin" size={24} />
        <span className="font-bold text-sm">Đang tải dữ liệu...</span>
      </div>
    );
  }

  if (isError || !form || !exam) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <AlertCircle size={28} className="text-red-400" />
        <p className="font-bold text-sm text-red-400">Không thể tải thông tin bài thi.</p>
        <button
          onClick={() => navigate(paths.adminPortalExams)}
          className="text-sm font-bold text-slate-500 hover:text-slate-800 underline transition-colors"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const standaloneQuestions = getStandaloneQuestions(exam);
  const examGroups          = getExamGroups(exam);
  const currentQuestions    = buildExamQuestionsPayload(exam, typeScore);
  const currentGroups       = buildExamGroupsPayload(exam, typeScore);
  const totalScore          = calculateExamTotalScore(currentQuestions, currentGroups);

  function applyTypeScore(type: QuestionType, value: number | null) {
    setTypeScore((current) => ({ ...current, [type]: value }));
  }

  // Giờ mở & giờ đóng là 2 mốc độc lập (sớm nhất để vào thi / trễ nhất để nộp).
  const startInstant = toInstant(joinDt(splitDt(form.startTime).date, startTimePart));
  const endInstant   = toInstant(joinDt(splitDt(form.endTime).date,   endTimePart));
  const timeRangeInvalid =
    !!startInstant && !!endInstant && new Date(startInstant) >= new Date(endInstant);

  return (
    <>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate(paths.adminPortalExams)}
            className="flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-800 mb-2 transition-colors"
          >
            <ArrowLeft size={15} />
            Quay lại danh sách
          </button>

        </div>

        <button
          type="button"
          onClick={() => setIsResultsOpen(true)}
          className="flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors shrink-0"
        >
          <FileBarChart size={15} />
          Kết quả kiểm tra
        </button>
      </div>

      {updateMutation.isError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-bold">
          <AlertCircle size={16} />
          Cập nhật thất bại. Vui lòng kiểm tra lại dữ liệu.
        </div>
      )}

      {/* Body: 2-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* ── LEFT ── */}
        <div className="space-y-6">

          {/* 1. Thông tin chung */}
          <div className={`${cardCls} p-6`}>
            <h2 className="text-base font-black text-slate-900 mb-5">1. Thông tin chung</h2>
            <div className="space-y-4">

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Tên bài thi *</label>
                  <input
                    value={form.examName}
                    onChange={(e) => setForm((f) => f && { ...f, examName: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Năm học *</label>
                  <input
                    value={form.schoolYear}
                    onChange={(e) => setForm((f) => f && { ...f, schoolYear: e.target.value })}
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
                    onChange={(e) => setForm((f) => f && { ...f, gradeId: Number(e.target.value) })}
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
                    onChange={(e) => setForm((f) => f && { ...f, examType: e.target.value as ExamType })}
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
                    onChange={(e) => setForm((f) => f && { ...f, status: e.target.value as ExamStatus })}
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
                    value={totalScore}
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
                    onChange={(e) => setForm((f) => f && { ...f, durationMinutes: Number(e.target.value) })}
                    className={numberInputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Lượt làm lại *</label>
                  <input
                    type="number" min={0}
                    value={form.numberOfAttempt}
                    onChange={(e) => setForm((f) => f && { ...f, numberOfAttempt: Number(e.target.value) })}
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
                      onChange={(e) => setForm((f) => f && { ...f, startTime: e.target.value || undefined })}
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
                      onChange={(e) => setForm((f) => f && { ...f, endTime: e.target.value || undefined })}
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
            <p className="text-xs text-slate-400 mb-4">Nhập điểm mới sẽ ghi đè tất cả câu hỏi cùng loại.</p>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {QUESTION_TYPES.map((type) => (
                <div key={type} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                  <label className={labelCls}>{questionTypeLabel(type)}</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number" min={0.01} step="0.1"
                      value={typeScore[type] ?? ''}
                      placeholder={typeScore[type] == null ? 'Hỗn hợp' : undefined}
                      onChange={(e) => applyTypeScore(type, e.target.value === '' ? null : Number(e.target.value))}
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
                ] as [keyof ReqUpdateExam, string][]
              ).map(([key, label]) => (
                <div key={key}>
                  <label className={labelCls}>{label}</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number" min={0} max={100}
                      value={(form[key] as number) ?? ''}
                      onChange={(e) => setForm((f) => f && { ...f, [key]: Number(e.target.value) })}
                      className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400"
                    />
                    <span className="text-sm font-bold text-slate-400 shrink-0">%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ── RIGHT ── */}
        <div className="space-y-6">

          {/* 3. Nhóm câu hỏi đơn */}
          <div className={`${cardCls} overflow-hidden`}>
            <div className="flex items-start justify-between gap-3 px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-black text-slate-900">3. Nhóm câu hỏi đơn</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Quản lý và thêm các câu hỏi đưa vào bài thi.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddQOpen(true)}
                disabled={updateMutation.isPending}
                className="flex items-center gap-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-bold px-4 py-2 rounded-xl transition-colors shrink-0"
              >
                <Plus size={14} />
                Thêm câu hỏi
              </button>
            </div>

            {standaloneQuestions.length === 0 ? (
              <div className="py-16 text-center text-sm font-bold text-slate-400">
                Chưa có câu hỏi
              </div>
            ) : (
              <>
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-4 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest w-12">STT</th>
                      <th className="px-4 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest">Loại</th>
                      <th className="px-4 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest">Nguồn</th>
                      <th className="px-4 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest">Nội dung rút gọn</th>
                      <th className="px-4 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest">Điểm</th>
                      <th className="px-4 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {standaloneQuestions.map((q) => (
                      <tr key={q.examQuestionUuid ?? q.questionOrder} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3 text-sm text-slate-600">{q.questionOrder}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-md text-xs font-black ${SECTION_TYPE_COLOR[q.sectionType ?? ''] ?? ''}`}>
                            {questionTypeLabel(q.sectionType)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${SOURCE_TYPE_COLOR[q.sourceType ?? ''] ?? ''}`}>
                            {SOURCE_TYPE_LABEL[q.sourceType ?? ''] ?? q.sourceType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500 max-w-[200px] truncate">
                          {q.questionDetail?.questionContent ?? ''}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {scoreForType(typeScore, q.sectionType, q.score ?? 1)}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => handleQuestionDelete(q.questionUuid, q.questionOrder)}
                            disabled={updateMutation.isPending}
                            className="text-xs font-bold text-red-500 hover:text-red-600 disabled:opacity-40"
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-5 py-3 border-t border-slate-100 text-xs font-bold text-slate-400">
                  Hiển thị 1 – {standaloneQuestions.length} của {standaloneQuestions.length}
                </div>
              </>
            )}
          </div>

          {/* 4. Nhóm câu hỏi ngẫu nhiên */}
          <div className={`${cardCls} p-6`}>
            <div className="flex items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-black text-slate-900">4. Nhóm câu hỏi ngẫu nhiên</h2>
                <Info size={15} className="text-slate-400" />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsUseExistingOpen(true)}
                  disabled={updateMutation.isPending}
                  className="flex items-center gap-1.5 border border-emerald-300 text-emerald-600 hover:bg-emerald-50 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-bold px-4 py-2 rounded-xl transition-colors"
                >
                  Dùng nhóm có sẵn
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreateGroupOpen(true)}
                  disabled={updateMutation.isPending}
                  className="flex items-center gap-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-bold px-4 py-2 rounded-xl transition-colors"
                >
                  <Plus size={14} />
                  Tạo nhóm mới
                </button>
              </div>
            </div>

            {examGroups.length === 0 ? (
              <div className="py-12 text-center text-sm font-bold text-slate-400 border border-dashed border-slate-200 rounded-xl">
                Chưa có nhóm câu hỏi
              </div>
            ) : (
              <div className="space-y-4">
                {examGroups.map((g) => (
                  <div key={g.eqgUuid ?? g.questionGroupUuid} className="border border-slate-200 rounded-xl overflow-hidden">
                    {/* Group header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
                      <span className="text-sm font-black text-slate-800">{g.groupName ?? '—'}</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="flex items-center gap-1.5 border border-blue-200 text-blue-600 hover:bg-blue-50 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <Plus size={12} />
                          Thêm câu hỏi
                        </button>
                        <button
                          type="button"
                          onClick={() => handleGroupDelete(g.questionGroupUuid)}
                          disabled={updateMutation.isPending}
                          className="flex items-center gap-1.5 border border-red-100 text-red-500 hover:bg-red-50 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>

                    {/* Group fields */}
                    <div className="p-4 space-y-3">
                      <div className="grid grid-cols-4 gap-3">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Tên nhóm</p>
                          <p className="text-sm font-bold text-slate-700 truncate">{g.groupName ?? '—'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Loại câu hỏi</p>
                          <p className="text-sm font-bold text-slate-700">{questionTypeLabel(g.questionType)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Chủ đề</p>
                          <p className="text-sm font-bold text-slate-700 truncate">{g.questionTopic ?? '—'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Số câu random lấy ra</p>
                          <p className="text-sm font-bold text-slate-700">{g.pickQuestionCount ?? '—'}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Điểm mỗi câu</p>
                          <p className="text-sm font-bold text-slate-700">
                            {scoreForType(typeScore, g.questionType, g.scorePerQuestion ?? 1)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Thứ tự hiển thị</p>
                          <p className="text-sm font-bold text-slate-700">{g.displayOrder ?? '—'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Danh sách câu hỏi trong pool</p>
                          <button
                            type="button"
                            className="border border-blue-300 text-blue-600 hover:bg-blue-50 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Danh sách câu hỏi
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 pb-4">
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
          disabled={updateMutation.isPending || timeRangeInvalid}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold px-6 py-2.5 rounded-xl transition-colors shadow-sm shadow-blue-200"
        >
          {updateMutation.isPending && <Loader2 size={15} className="animate-spin" />}
          Lưu thay đổi
        </button>
      </div>
    </div>

      <AddQuestionDialog
        isOpen={isAddQOpen}
        nextOrder={standaloneQuestions.length + 1}
        typeScore={typeScore}
        onClose={() => setIsAddQOpen(false)}
        onConfirm={handleQuestionConfirm}
      />

      <CreateGroupDialog
        isOpen={isCreateGroupOpen}
        nextDisplayOrder={examGroups.length + 1}
        excludeUuids={standaloneQuestions.map((q) => q.questionUuid ?? '').filter(Boolean)}
        typeScore={typeScore}
        onClose={() => setIsCreateGroupOpen(false)}
        onConfirm={handleGroupConfirm}
      />

      <ExistingGroupDialog
        isOpen={isUseExistingOpen}
        nextDisplayOrder={examGroups.length + 1}
        linkedGroupUuids={examGroups.map((g) => g.questionGroupUuid ?? '').filter(Boolean)}
        typeScore={typeScore}
        onClose={() => setIsUseExistingOpen(false)}
        onConfirm={handleExistingGroupConfirm}
      />

      <ExamResultsDialog
        isOpen={isResultsOpen}
        examUuid={examUuid ?? null}
        examName={exam.examName}
        onClose={() => setIsResultsOpen(false)}
      />

      {/* Toast container */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-bold text-white animate-fade-in-up
              bg-emerald-500"
          >
            <CheckCircle2 size={16} />
            {t.message}
          </div>
        ))}
      </div>
    </>
  );
}
