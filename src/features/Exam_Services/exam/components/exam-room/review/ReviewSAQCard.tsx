import { Check, X } from 'lucide-react';
import { QUESTION_TYPE_LABEL } from '@/features/Exam_Services/question/lib/question-type';
import type { ResAttemptQuestion } from '@/features/Exam_Services/exam/types';
import { ReviewCardShell } from './ReviewCardShell';
import { isSaqCorrect } from './review-utils';

interface Props {
  q: ResAttemptQuestion;
  index: number;
  showAnswerKey: boolean;
}

export function ReviewSAQCard({ q, index, showAnswerKey }: Props) {
  const studentRaw = q.currentRawAnswer;
  const correct = showAnswerKey
    ? isSaqCorrect(q.currentNormalizedAnswer, q.correctNormalizedAnswer, q.currentRawAnswer, q.correctAnswerRaw)
    : false;

  const studentBoxCls = !showAnswerKey
    ? 'border-slate-200 bg-slate-50'
    : correct
      ? 'border-emerald-300 bg-emerald-50'
      : 'border-red-300 bg-red-50';

  return (
    <ReviewCardShell
      index={index}
      typeLabel={QUESTION_TYPE_LABEL.SAQ}
      maxScore={q.score}
      earnedScore={q.earnedScore}
      showEarned={showAnswerKey}
      topic={q.fromQuestionGroup ? q.questionTopic : null}
      content={q.questionContent}
      imagePath={q.imagePath}
    >
      <div className="space-y-3">
        <div className={`rounded-xl border px-4 py-3 ${studentBoxCls}`}>
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Bạn trả lời</p>
            {showAnswerKey && (correct
              ? <Check size={16} className="text-emerald-500" />
              : <X size={16} className="text-red-400" />)}
          </div>
          <p className="text-sm font-bold text-slate-800 mt-1 break-words">
            {studentRaw && studentRaw.length > 0 ? studentRaw : <span className="text-slate-400 font-medium">(Bỏ trống)</span>}
          </p>
        </div>

        {showAnswerKey && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3">
            <p className="text-[11px] font-black text-emerald-500 uppercase tracking-wider">Đáp án đúng</p>
            <p className="text-sm font-bold text-emerald-800 mt-1 break-words">{q.correctAnswerRaw ?? '—'}</p>
          </div>
        )}
      </div>
    </ReviewCardShell>
  );
}
