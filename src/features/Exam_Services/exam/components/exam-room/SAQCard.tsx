import { MathRender } from '@/features/Exam_Services/math';
import { QUESTION_TYPE_LABEL } from '@/features/Exam_Services/question/lib/question-type';
import type { FlatQ, AnswerMap, GroupAnswer } from './types';

interface Props {
  q: FlatQ & { questionType: 'SAQ' };
  displayIndex: number;
  answers: AnswerMap;
  onChange: (globalIndex: number, value: string | GroupAnswer) => void;
}

export function SAQCard({ q, displayIndex, answers, onChange }: Props) {
  const scoreLabel = q.kind === 'group'
    ? `${q.scorePerQuestion} điểm/ý`
    : `${q.score} điểm`;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-6 py-3.5 border-b border-slate-100">
        <span className="text-sm font-bold text-indigo-600">Câu {displayIndex}</span>
        <span className="text-slate-300 mx-2">•</span>
        <span className="text-sm text-slate-400 font-medium">{QUESTION_TYPE_LABEL.SAQ}</span>
        <span className="text-slate-300 mx-2">•</span>
        <span className="text-sm text-slate-400 font-medium">{scoreLabel}</span>
      </div>

      <div className="px-6 py-5 space-y-4">
        {/* ── Standalone SAQ: câu đơn, một textarea ── */}
        {q.kind === 'standalone' && (() => {
          const answer = answers[q.globalIndex] as string | undefined;
          return (
            <>
              <p className="text-base font-bold text-slate-900 leading-relaxed">
                <MathRender value={q.questionContent} />
              </p>
              <textarea
                value={answer ?? ''}
                onChange={(e) => onChange(q.globalIndex, e.target.value)}
                placeholder="Nhập câu trả lời của bạn..."
                rows={4}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 resize-y focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none transition-all placeholder:text-slate-300"
              />
            </>
          );
        })()}

        {/* ── Group SAQ: nhiều câu con, mỗi câu một textarea ── */}
        {q.kind === 'group' && (() => {
          const groupAnswer = (answers[q.globalIndex] ?? {}) as GroupAnswer;
          return (
            <>
              {q.questionTopic && (
                <div className="bg-indigo-50 rounded-xl px-4 py-3">
                  <p className="text-sm font-bold text-indigo-700">
                    <MathRender value={q.questionTopic} />
                  </p>
                </div>
              )}
              <div className="space-y-4">
                {q.items.map((item, i) => {
                  const cur = groupAnswer[item.questionUuid] as string | undefined;
                  return (
                    <div key={item.questionUuid} className="space-y-2">
                      <p className="text-sm font-semibold text-slate-700">
                        <span className="text-indigo-600 font-bold mr-2">{i + 1}.</span>
                        <MathRender value={item.questionContent} />
                      </p>
                      <textarea
                        value={cur ?? ''}
                        onChange={(e) =>
                          onChange(q.globalIndex, { ...groupAnswer, [item.questionUuid]: e.target.value })
                        }
                        placeholder="Nhập câu trả lời..."
                        rows={2}
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 resize-y focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none transition-all placeholder:text-slate-300"
                      />
                    </div>
                  );
                })}
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}
