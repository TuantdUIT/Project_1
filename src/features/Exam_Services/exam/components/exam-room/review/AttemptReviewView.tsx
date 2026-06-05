import { ChevronLeft, ShieldAlert, Clock, Award } from 'lucide-react';
import type { ResExamAttempt } from '@/features/Exam_Services/exam/types';
import {
  canSeeScore, canSeeAnswerKey, formatScore,
  ATTEMPT_STATUS_LABEL, ATTEMPT_STATUS_STYLE, type AttemptStatus,
} from '@/features/Exam_Services/exam/lib/attempt-status';
import { ReviewMCQCard } from './ReviewMCQCard';
import { ReviewTFQCard } from './ReviewTFQCard';
import { ReviewSAQCard } from './ReviewSAQCard';

interface Props {
  attempt: ResExamAttempt;
  totalScore?: number;
  onBack: () => void;
}

function formatDuration(seconds?: number | null) {
  if (seconds === undefined || seconds === null) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${String(s).padStart(2, '0')}s`;
}

export function AttemptReviewView({ attempt, totalScore, onBack }: Props) {
  const status = (attempt.status ?? 'SUBMITTED') as AttemptStatus;
  const showScore = canSeeScore(status);
  const showAnswerKey = canSeeAnswerKey(status);

  const questions = [...(attempt.questions ?? [])].sort(
    (a, b) => (a.questionOrder ?? 0) - (b.questionOrder ?? 0),
  );

  return (
    <div className="bg-slate-50 min-h-screen p-8">
      <div className="max-w-3xl mx-auto space-y-5">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ChevronLeft size={16} />
          Quay lại
        </button>

        {/* ── Header tổng quan ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900 leading-tight">{attempt.examName ?? 'Bài thi'}</h1>
              <p className="text-sm font-medium text-slate-400 mt-1">Lần làm thứ {attempt.attemptNo ?? 1}</p>
            </div>
            <span className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-black ${ATTEMPT_STATUS_STYLE[status]}`}>
              {ATTEMPT_STATUS_LABEL[status]}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-5">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <div className="flex items-center gap-1.5 mb-1">
                <Award size={13} className="text-indigo-400" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Điểm</p>
              </div>
              <p className="text-lg font-black text-slate-800">
                {showScore
                  ? `${formatScore(attempt.score)}${totalScore != null ? ` / ${formatScore(totalScore)}` : ''}`
                  : 'Chưa chấm'}
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <div className="flex items-center gap-1.5 mb-1">
                <Clock size={13} className="text-indigo-400" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Thời gian</p>
              </div>
              <p className="text-lg font-black text-slate-800">{formatDuration(attempt.timeSpentSeconds)}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <div className="flex items-center gap-1.5 mb-1">
                <ShieldAlert size={13} className={attempt.violationCount ? 'text-amber-400' : 'text-slate-400'} />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Vi phạm</p>
              </div>
              <p className={`text-lg font-black ${attempt.violationCount ? 'text-amber-500' : 'text-slate-800'}`}>
                {attempt.violationCount ?? 0}
              </p>
            </div>
          </div>

          {!showAnswerKey && (
            <p className="text-xs font-medium text-slate-400 mt-4">
              {showScore
                ? 'Đáp án đúng sẽ được hiển thị sau khi đề thi đóng và đáp án được công bố.'
                : 'Bài đang chờ chấm. Bạn có thể xem lại các câu đã làm bên dưới.'}
            </p>
          )}
        </div>

        {/* ── Danh sách câu hỏi ── */}
        {questions.map((q, i) => {
          const index = q.questionOrder ?? i + 1;
          if (q.questionType === 'MCQ') {
            return <ReviewMCQCard key={q.questionUuid ?? i} q={q} index={index} showAnswerKey={showAnswerKey} />;
          }
          if (q.questionType === 'TFQ') {
            return <ReviewTFQCard key={q.questionUuid ?? i} q={q} index={index} showAnswerKey={showAnswerKey} />;
          }
          return <ReviewSAQCard key={q.questionUuid ?? i} q={q} index={index} showAnswerKey={showAnswerKey} />;
        })}

        {questions.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-sm font-medium text-slate-400">
            Không có dữ liệu câu hỏi để hiển thị.
          </div>
        )}
      </div>
    </div>
  );
}
