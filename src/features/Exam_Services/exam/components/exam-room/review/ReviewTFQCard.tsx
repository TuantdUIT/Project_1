import { Check, X } from 'lucide-react';
import { MathRender } from '@/features/Exam_Services/math';
import { QUESTION_TYPE_LABEL } from '@/features/Exam_Services/question/lib/question-type';
import type { ResAttemptQuestion } from '@/features/Exam_Services/exam/types';
import { ReviewCardShell } from './ReviewCardShell';
import {
  splitStatementChars, isTfStatementCorrect, TF_STUDENT_LABEL, TF_CORRECT_LABEL,
} from './review-utils';

interface Props {
  q: ResAttemptQuestion;
  index: number;
  showAnswerKey: boolean;
}

const subLabels = ['a', 'b', 'c', 'd', 'e', 'f'];

export function ReviewTFQCard({ q, index, showAnswerKey }: Props) {
  const statements = [...(q.tfStatements ?? [])].sort(
    (a, b) => (a.statementOrder ?? 0) - (b.statementOrder ?? 0),
  );
  const studentChars = splitStatementChars(q.currentRawAnswer);
  const correctChars = showAnswerKey
    ? splitStatementChars(q.correctNormalizedAnswer ?? q.correctAnswerRaw)
    : [];

  return (
    <ReviewCardShell
      index={index}
      typeLabel={QUESTION_TYPE_LABEL.TFQ}
      maxScore={q.score}
      earnedScore={q.earnedScore}
      showEarned={showAnswerKey}
      topic={q.fromQuestionGroup ? q.questionTopic : null}
      content={q.fromQuestionGroup ? null : q.questionContent}
      imagePath={q.imagePath}
    >
      <div className="border border-slate-100 rounded-xl overflow-hidden">
        <table className="w-full border-collapse">
          <thead className="bg-slate-50">
            <tr>
              <th className="py-3 px-4 text-xs font-bold text-slate-400 text-left w-12">Ý</th>
              <th className="py-3 px-4 text-xs font-bold text-slate-400 text-left">Nội dung khẳng định</th>
              <th className="py-3 px-4 text-xs font-bold text-slate-400 text-center w-28">Bạn chọn</th>
              {showAnswerKey && (
                <th className="py-3 px-4 text-xs font-bold text-slate-400 text-center w-32">Đáp án đúng</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {statements.map((st, i) => {
              const stu = studentChars[i];
              const cor = correctChars[i];
              const correct = isTfStatementCorrect(stu, cor);
              return (
                <tr key={st.statementUuid ?? i}>
                  <td className="py-3 px-4 text-sm font-bold text-slate-700">{subLabels[i] ?? i + 1}</td>
                  <td className="py-3 px-4 text-sm text-slate-600">
                    <MathRender value={st.statementContent} />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center gap-1.5 text-sm font-bold ${
                      !showAnswerKey ? 'text-slate-700' : correct ? 'text-emerald-600' : 'text-red-500'
                    }`}>
                      {showAnswerKey && (correct ? <Check size={14} /> : <X size={14} />)}
                      {TF_STUDENT_LABEL[stu] ?? 'Bỏ trống'}
                    </span>
                  </td>
                  {showAnswerKey && (
                    <td className="py-3 px-4 text-center text-sm font-bold text-emerald-600">
                      {TF_CORRECT_LABEL[cor] ?? '—'}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </ReviewCardShell>
  );
}
