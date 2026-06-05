import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import {
  FileText,
  AlertCircle,
  BookOpen,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { useExamsQuery, useExamQuery, useStartAttemptMutation, useSubmitAttemptMutation, saveAnswer } from '@/features/Exam_Services/exam/api/exams';
import { useProctoring } from '@/features/Exam_Services/proctoring';
import type { ProctoringEventType } from '@/features/Exam_Services/proctoring';
import type { Exam, ResAttemptQuestion } from '@/features/Exam_Services/exam/types';
import { GRADE_DISPLAY_NAME_BY_ID } from '@/features/Management_Services/timetable-template/lib/supplement-grades';
import { useAuth } from '@/lib/auth/auth-context';
import { paths } from '@/config/paths';
import type {
  FlatQ, QType, StandaloneQ, GroupQ, GroupOrigin, MCQOption,
  AnswerMap, AnswerValue,
} from '@/features/Exam_Services/exam/components/exam-room/types';
import { ExamRoomView } from '@/features/Exam_Services/exam/components/exam-room/ExamRoomView';
import { buildSaveBody } from '@/features/Exam_Services/exam/components/exam-room/answer-codec';
import { useAttemptAutosave } from '@/features/Exam_Services/exam/hooks/use-attempt-autosave';

// ---------- constants ----------

const EXAM_TYPE_LABEL: Record<string, string> = {
  QUIZ: 'Kiểm tra',
  HOMEWORK: 'Bài tập',
  MOCK_TEST: 'Thi thử',
  OFFICIAL_TEST: 'Thi chính thức',
};

const EXAM_TYPE_STYLE: Record<string, { color: string; textColor: string }> = {
  QUIZ:          { color: 'bg-blue-50',   textColor: 'text-blue-600' },
  HOMEWORK:      { color: 'bg-green-50',  textColor: 'text-green-600' },
  MOCK_TEST:     { color: 'bg-orange-50', textColor: 'text-orange-600' },
  OFFICIAL_TEST: { color: 'bg-purple-50', textColor: 'text-purple-600' },
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT:     'Chưa mở',
  PUBLISHED: 'Sẵn sàng',
  CLOSED:    'Đã đóng',
  ARCHIVED:  'Lưu trữ',
};

const STATUS_STYLE: Record<string, string> = {
  DRAFT:     'bg-slate-100 text-slate-500',
  PUBLISHED: 'bg-emerald-100 text-emerald-700',
  CLOSED:    'bg-red-100 text-red-600',
  ARCHIVED:  'bg-orange-100 text-orange-600',
};

// ---------- helpers ----------

function formatDateTime(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  return isToday ? `Hôm nay, ${time}` : `${d.toLocaleDateString('vi-VN')}, ${time}`;
}

// ---------- flatten helpers ----------

function flattenSections(sections: NonNullable<Exam['questionSections']>): FlatQ[] {
  const result: FlatQ[] = [];
  let idx = 1;

  for (const section of sections) {
    const qType = (section.questionType ?? 'MCQ') as QType;

    for (const sq of section.standaloneQuestions ?? []) {
      result.push({
        kind: 'standalone',
        globalIndex: idx++,
        questionType: qType,
        questionUuid: sq.questionUuid ?? sq.questionDetail?.questionUuid ?? '',
        questionContent: sq.questionDetail?.questionContent ?? '',
        score: sq.score ?? 0,
      } as StandaloneQ);
    }

    for (const group of section.groups ?? []) {
      if (qType === 'MCQ') {
        const items = group.items ?? [];
        items.forEach((item, i) => {
          result.push({
            kind: 'standalone',
            globalIndex: idx++,
            questionType: 'MCQ',
            questionUuid: item.questionUuid ?? '',
            questionContent: item.questionDetail?.questionContent ?? '',
            score: group.scorePerQuestion ?? 0,
            groupOrigin: {
              groupName: group.groupName ?? '',
              questionTopic: group.questionTopic ?? '',
              itemIndex: i,
              groupSize: items.length,
            } as GroupOrigin,
          } as StandaloneQ);
        });
      } else {
        result.push({
          kind: 'group',
          globalIndex: idx++,
          questionType: qType as 'TFQ' | 'SAQ',
          groupName: group.groupName ?? '',
          questionTopic: group.questionTopic ?? '',
          scorePerQuestion: group.scorePerQuestion ?? 0,
          items: (group.items ?? []).map((item) => ({
            questionUuid: item.questionUuid ?? '',
            questionContent: item.questionDetail?.questionContent ?? '',
          })),
        } as GroupQ);
      }
    }
  }

  return result;
}

function flattenAttemptQuestions(questions: ResAttemptQuestion[]): FlatQ[] {
  const sorted = [...questions].sort((a, b) => (a.questionOrder ?? 0) - (b.questionOrder ?? 0));
  const result: FlatQ[] = [];
  let idx = 1;

  for (const q of sorted) {
    const qType = (q.questionType ?? 'MCQ') as QType;
    const qUuid = q.questionUuid ?? '';

    if (qType === 'MCQ') {
      result.push({
        kind: 'standalone',
        globalIndex: idx++,
        questionType: 'MCQ',
        questionUuid: qUuid,
        questionContent: q.questionContent ?? '',
        score: q.score ?? 0,
        ...(q.fromQuestionGroup ? {
          groupOrigin: {
            groupName: q.groupName ?? '',
            questionTopic: q.questionTopic ?? '',
            itemIndex: 0,
            groupSize: 1,
          } as GroupOrigin,
        } : {}),
        mcOptions: (q.mcOptions ?? []).map((opt) => ({
          optionKey: opt.optionKey ?? '',
          optionContent: opt.optionContent ?? '',
        } as MCQOption)),
      } as StandaloneQ);
    } else if (qType === 'TFQ' && (q.tfStatements ?? []).length > 0) {
      result.push({
        kind: 'group',
        globalIndex: idx++,
        questionType: 'TFQ',
        questionUuid: qUuid,
        groupName: q.groupName ?? '',
        questionTopic: q.questionTopic ?? q.questionContent ?? '',
        scorePerQuestion: q.score ?? 0,
        items: (q.tfStatements ?? [])
          .sort((a, b) => (a.statementOrder ?? 0) - (b.statementOrder ?? 0))
          .map((st) => ({
            questionUuid: st.statementUuid ?? '',
            questionContent: st.statementContent ?? '',
          })),
      } as GroupQ);
    } else {
      result.push({
        kind: 'standalone',
        globalIndex: idx++,
        questionType: qType,
        questionUuid: qUuid,
        questionContent: q.questionContent ?? '',
        score: q.score ?? 0,
      } as StandaloneQ);
    }
  }

  return result;
}

// ---------- main component ----------

export default function ExamProcessRoute() {
  const navigate = useNavigate();
  const [view, setView]                         = useState<'wait' | 'detail' | 'room'>('wait');
  const [selectedExam, setSelectedExam]         = useState<Exam | null>(null);
  const [attemptUuid, setAttemptUuid]           = useState<string | null>(null);
  const [attemptQuestions, setAttemptQuestions] = useState<ResAttemptQuestion[]>([]);
  const [timeLeft, setTimeLeft]                 = useState(0);
  const [answers, setAnswers]                   = useState<AnswerMap>({});
  const [lastViolation, setLastViolation]       = useState<{ type: ProctoringEventType; key: number } | null>(null);
  const [isSubmitting, setIsSubmitting]         = useState(false);

  const { user } = useAuth();

  const startAttemptMutation  = useStartAttemptMutation();
  const submitAttemptMutation = useSubmitAttemptMutation();
  const autosave              = useAttemptAutosave(attemptUuid);

  const handleViolationDetected = useCallback((type: ProctoringEventType) => {
    setLastViolation({ type, key: Date.now() });
  }, []);

  const { flushNow } = useProctoring({
    attemptUuid,
    enabled: view === 'room',
    onViolationDetected: handleViolationDetected,
  });

  const { data: pageData, isLoading, isError } = useExamsQuery();
  const exams = pageData?.content ?? [];

  const detailUuid = (view === 'detail' || view === 'room') ? (selectedExam?.examUuid ?? '') : '';
  const { data: examDetail, isLoading: detailLoading } = useExamQuery(detailUuid);

  const flatQuestions = useMemo(
    () => view === 'room' && attemptQuestions.length > 0
      ? flattenAttemptQuestions(attemptQuestions)
      : flattenSections(examDetail?.questionSections ?? []),
    [view, attemptQuestions, examDetail],
  );

  // Fullscreen khi vào phòng thi
  useEffect(() => {
    if (view === 'room') {
      document.documentElement.requestFullscreen?.().catch(() => {});
      return () => {
        if (document.fullscreenElement) {
          document.exitFullscreen?.();
        }
      };
    }
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    }
  }, [view]);

  // Double-click để quay lại fullscreen khi bị thoát
  useEffect(() => {
    if (view !== 'room') return;
    const handleDblClick = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().catch(() => {});
      }
    };
    document.addEventListener('dblclick', handleDblClick);
    return () => document.removeEventListener('dblclick', handleDblClick);
  }, [view]);

  // Timer
  useEffect(() => {
    if (view !== 'room' || timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [view, timeLeft]);

  function startExam(exam: Exam) {
    if (exam.status !== 'PUBLISHED') return;
    startAttemptMutation.mutate(exam.examUuid!, {
      onSuccess: (data) => {
        setAttemptUuid(data.attemptUuid ?? null);
        setAttemptQuestions(data.questions ?? []);
        setSelectedExam(exam);
        setTimeLeft((exam.durationMinutes ?? 45) * 60);
        setAnswers({});
        setView('room');
      },
    });
  }

  function handleAnswer(globalIndex: number, value: AnswerValue) {
    setAnswers((prev) => ({ ...prev, [globalIndex]: value }));
    // Autosave xuống DB (student_answer) thay vì chỉ giữ trên RAM
    const q = flatQuestions.find((fq) => fq.globalIndex === globalIndex);
    if (q) {
      const body = buildSaveBody(q, value);
      if (body) autosave.schedule(body);
    }
  }

  async function handleSubmit() {
    if (!attemptUuid || isSubmitting) return;
    setIsSubmitting(true);
    try {
      // Đảm bảo mọi autosave đang chờ/đang chạy hoàn tất trước khi nộp
      await autosave.flushAll();

      // Lưu lại toàn bộ đáp án lần cuối (lưới an toàn) — dùng chung mã hóa với autosave
      const saveRequests = flatQuestions.flatMap((q) => {
        const body = buildSaveBody(q, answers[q.globalIndex]);
        return body ? [saveAnswer(attemptUuid!, body)] : [];
      });

      await Promise.all(saveRequests);
      await flushNow();

      submitAttemptMutation.mutate(attemptUuid, {
        onSuccess: (data) => {
          navigate(paths.examResult(data.attemptUuid ?? attemptUuid), { replace: true });
        },
        onSettled: () => setIsSubmitting(false),
      });
    } catch {
      setIsSubmitting(false);
    }
  }

  // ====================================================
  // ROOM VIEW
  // ====================================================
  if (view === 'room') {
    return (
      <ExamRoomView
        exam={selectedExam!}
        flatQuestions={flatQuestions}
        answers={answers}
        timeLeft={timeLeft}
        onAnswer={handleAnswer}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        lastViolation={lastViolation}
      />
    );
  }

  // ====================================================
  // WAIT VIEW
  // ====================================================
  if (view === 'wait') {
    return (
      <div className="bg-slate-50 min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-12 border border-slate-200 shadow-sm mb-12"
          >
            <h1 className="text-5xl font-black text-slate-900 mb-4 tracking-tight">
              Hi {user?.fullName},
            </h1>
            <p className="text-slate-500 text-xl font-medium">
              Continue learning with passion tonight!
            </p>
          </motion.div>

          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black text-slate-900">Bài thi của bạn</h2>
            <button className="text-indigo-600 font-bold hover:underline">Xem tất cả</button>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-20 text-slate-400 gap-3">
              <Loader2 className="animate-spin" size={24} />
              <span className="font-bold">Đang tải danh sách bài thi...</span>
            </div>
          )}
          {isError && (
            <div className="flex items-center justify-center py-20 text-red-400 gap-3">
              <AlertCircle size={24} />
              <span className="font-bold">Không thể tải danh sách bài thi. Vui lòng thử lại.</span>
            </div>
          )}
          {!isLoading && !isError && exams.length === 0 && (
            <div className="flex items-center justify-center py-20 text-slate-400 gap-3">
              <BookOpen size={24} />
              <span className="font-bold">Chưa có bài thi nào.</span>
            </div>
          )}
          {!isLoading && !isError && exams.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {exams.map((exam) => {
                const type  = exam.examType ?? 'QUIZ';
                const style = EXAM_TYPE_STYLE[type] ?? EXAM_TYPE_STYLE['QUIZ'];
                const isPublished = exam.status === 'PUBLISHED';
                return (
                  <motion.div
                    key={exam.examUuid}
                    whileHover={{ y: -5 }}
                    onClick={() => { setSelectedExam(exam); setView('detail'); }}
                    className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col h-full cursor-pointer"
                  >
                    <div className={`w-12 h-12 ${style.color} rounded-xl flex items-center justify-center mb-6`}>
                      <BookOpen className={style.textColor} />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 mb-1 leading-tight">{exam.examName}</h3>
                    <p className="text-xs font-bold text-slate-400 mb-auto">
                      {EXAM_TYPE_LABEL[type]} · {exam.durationMinutes ?? 45} phút
                    </p>
                    <div className="mt-8">
                      <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${
                        isPublished ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {isPublished ? 'Sẵn sàng' : 'Chưa mở'}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ====================================================
  // DETAIL VIEW
  // ====================================================
  const ex     = examDetail ?? selectedExam;
  const totalQ = (ex?.questionSummary?.mcqCount ?? 0)
               + (ex?.questionSummary?.tfqCount ?? 0)
               + (ex?.questionSummary?.saqCount ?? 0);
  const status = ex?.status ?? 'DRAFT';

  const INFO_CARDS = [
    { label: 'Môn học',     value: GRADE_DISPLAY_NAME_BY_ID[ex?.gradeId ?? 0] ?? '—' },
    { label: 'Thời lượng',  value: ex?.durationMinutes ? `${ex.durationMinutes} phút` : '—' },
    { label: 'Số câu hỏi',  value: totalQ > 0 ? `${totalQ} câu` : '—' },
    { label: 'Hình thức',   value: EXAM_TYPE_LABEL[ex?.examType ?? ''] ?? '—' },
    { label: 'Lượt thi',    value: ex?.numberOfAttempt != null ? String(ex.numberOfAttempt) : '—' },
    { label: 'Điểm tối đa', value: ex?.totalScore != null ? String(ex.totalScore) : '—' },
  ];

  return (
    <div className="bg-slate-50 min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <button
          onClick={() => setView('wait')}
          className="flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ChevronLeft size={16} />
          Quay lại danh sách phòng thi
        </button>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-start justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                <FileText className="text-blue-600" size={28} />
              </div>
              <div>
                {detailLoading ? (
                  <div className="flex items-center gap-2 text-slate-400">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-sm font-bold">Đang tải...</span>
                  </div>
                ) : (
                  <h1 className="text-2xl font-black text-slate-900 leading-tight">{ex?.examName ?? '—'}</h1>
                )}
              </div>
            </div>
            <span className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black ${STATUS_STYLE[status]}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {STATUS_LABEL[status]}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {INFO_CARDS.map(({ label, value }) => (
                  <div key={label} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">{label}</p>
                    <p className="text-sm font-black text-slate-800">{value}</p>
                  </div>
                ))}
              </div>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Thời gian mở thi</p>
                <p className="text-sm font-black text-slate-800">
                  {ex?.startTime ? formatDateTime(ex.startTime) : '—'}
                  {ex?.endTime ? ` – ${new Date(ex.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}` : ''}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-xs font-black text-slate-700 uppercase tracking-wider mb-3">Lưu ý trước khi vào thi</p>
              <ul className="space-y-2.5">
                {[
                  'Đảm bảo thiết bị và kết nối Internet ổn định.',
                  'Không tải lại trang hoặc thoát khỏi phòng thi trong quá trình làm bài.',
                  'Mỗi lần bấm Bắt đầu thi sẽ tính là một lượt thi.',
                  'Bài làm của bạn sẽ được tự động lưu trong suốt quá trình thi.',
                ].map((note) => (
                  <li key={note} className="flex items-start gap-2 text-xs text-slate-600 font-bold">
                    <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          {startAttemptMutation.isError && (
            <p className="text-sm font-bold text-red-500 flex items-center gap-1.5">
              <AlertCircle size={14} />
              Không thể bắt đầu thi. Vui lòng thử lại.
            </p>
          )}
          <button
            onClick={() => startExam(ex as Exam)}
            disabled={status !== 'PUBLISHED' || startAttemptMutation.isPending}
            className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-lg px-16 py-4 rounded-2xl transition-colors shadow-lg shadow-blue-200 w-full max-w-xs justify-center"
          >
            {startAttemptMutation.isPending
              ? <Loader2 size={22} className="animate-spin" />
              : <ChevronRight size={22} />}
            {startAttemptMutation.isPending ? 'Đang bắt đầu...' : 'Bắt đầu thi'}
          </button>
          <button
            onClick={() => setView('wait')}
            className="flex items-center gap-1.5 text-sm font-bold text-slate-400 hover:text-slate-700 transition-colors"
          >
            <ChevronLeft size={14} />
            Quay lại danh sách phòng thi
          </button>
        </div>
      </div>
    </div>
  );
}
