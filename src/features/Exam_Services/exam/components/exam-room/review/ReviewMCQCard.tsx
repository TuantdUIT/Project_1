import { Check, X } from 'lucide-react';
import { MathRender } from '@/features/Exam_Services/math';
import { QUESTION_TYPE_LABEL } from '@/features/Exam_Services/question/lib/question-type';
import type { ResAttemptQuestion } from '@/features/Exam_Services/exam/types';
import { ReviewCardShell } from './ReviewCardShell';
import { parseOptionKeys } from './review-utils';

interface Props {
  q: ResAttemptQuestion;
  index: number;
  showAnswerKey: boolean;
}

export function ReviewMCQCard({ q, index, showAnswerKey }: Props) {
  const studentSet = parseOptionKeys(q.currentNormalizedAnswer ?? q.currentRawAnswer);
  const correctSet = showAnswerKey
    ? parseOptionKeys(q.correctNormalizedAnswer ?? q.correctAnswerRaw)
    : null;

  return (
    <ReviewCardShell
      index={index}
      typeLabel={QUESTION_TYPE_LABEL.MCQ}
      maxScore={q.score}
      earnedScore={q.earnedScore}
      showEarned={showAnswerKey}
      topic={q.fromQuestionGroup ? q.questionTopic : null}
      content={q.questionContent}
      imagePath={q.imagePath}
    >
      <div className="space-y-2.5">
        {(q.mcOptions ?? []).map(({ optionKey, optionContent }) => {
          const key = optionKey ?? '';
          const chosen = studentSet.has(key.toUpperCase());
          const isCorrect = correctSet?.has(key.toUpperCase()) ?? false;

          let cls = 'border-slate-200';
          if (showAnswerKey) {
            if (isCorrect) cls = 'border-emerald-300 bg-emerald-50';
            else if (chosen) cls = 'border-red-300 bg-red-50';
          } else if (chosen) {
            cls = 'border-indigo-300 bg-indigo-50';
          }

          return (
            <div key={key} className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl border ${cls}`}>
              <span className={`text-sm font-semibold flex-1 ${chosen ? 'text-slate-900' : 'text-slate-600'}`}>
                {key}. <MathRender value={optionContent} fallback={`Phương án ${key}`} />
              </span>
              {chosen && (
                <span className="text-[11px] font-bold text-slate-500 bg-white/70 border border-slate-200 px-2 py-0.5 rounded-full shrink-0">
                  Bạn chọn
                </span>
              )}
              {showAnswerKey && isCorrect && <Check size={18} className="text-emerald-500 shrink-0" />}
              {showAnswerKey && chosen && !isCorrect && <X size={18} className="text-red-400 shrink-0" />}
            </div>
          );
        })}
      </div>
    </ReviewCardShell>
  );
}
