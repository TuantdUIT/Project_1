import { MathRender } from '@/features/Exam_Services/math';
import type { FlatQ, AnswerMap, GroupAnswer, AnswerValue } from './types';

interface Props {
  q: FlatQ & { questionType: 'TFQ' };
  displayIndex: number;
  answers: AnswerMap;
  onChange: (globalIndex: number, value: AnswerValue) => void;
}

const subLabels = ['a', 'b', 'c', 'd', 'e', 'f'];

export function TFQCard({ q, displayIndex, answers, onChange }: Props) {
  const scoreLabel = q.kind === 'group'
    ? `${q.scorePerQuestion} điểm/ý`
    : `${q.score} điểm`;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-6 py-3.5 border-b border-slate-100">
        <span className="text-sm font-bold text-indigo-600">Câu {displayIndex}</span>
        <span className="text-slate-300 mx-2">•</span>
        <span className="text-sm text-slate-400 font-medium">Đúng / Sai</span>
        <span className="text-slate-300 mx-2">•</span>
        <span className="text-sm text-slate-400 font-medium">{scoreLabel}</span>
      </div>

      <div className="px-6 py-5 space-y-4">
        {/* ── Standalone TFQ: câu đơn, chọn Đúng hoặc Sai ── */}
        {q.kind === 'standalone' && (() => {
          const answer = answers[q.globalIndex] as boolean | undefined;
          return (
            <>
              <p className="text-base font-bold text-slate-900 leading-relaxed">
                <MathRender value={q.questionContent} />
              </p>
              <div className="flex gap-3">
                {([true, false] as const).map((val) => (
                  <button
                    key={String(val)}
                    onClick={() => onChange(q.globalIndex, val)}
                    className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${
                      answer === val
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-500'
                    }`}
                  >
                    {val ? 'Đúng' : 'Sai'}
                  </button>
                ))}
              </div>
            </>
          );
        })()}

        {/* ── Group TFQ: nhiều khẳng định, bảng Đúng/Sai ── */}
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
              <div className="border border-slate-100 rounded-xl overflow-hidden">
                <table className="w-full border-collapse">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="py-3 px-4 text-xs font-bold text-slate-400 text-left w-12">Ý</th>
                      <th className="py-3 px-4 text-xs font-bold text-slate-400 text-left">Nội dung khẳng định</th>
                      <th className="py-3 px-4 text-xs font-bold text-slate-400 text-center w-28">Đúng</th>
                      <th className="py-3 px-4 text-xs font-bold text-slate-400 text-center w-28">Sai</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {q.items.map((item, i) => {
                      const cur = groupAnswer[item.questionUuid] as boolean | undefined;
                      return (
                        <tr key={item.questionUuid} className="hover:bg-slate-50/40 transition-colors">
                          <td className="py-3 px-4 text-sm font-bold text-slate-700">{subLabels[i] ?? i + 1}</td>
                          <td className="py-3 px-4 text-sm text-slate-600">
                            <MathRender value={item.questionContent} />
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => onChange(q.globalIndex, { ...groupAnswer, [item.questionUuid]: true })}
                              className={`px-5 py-1.5 rounded-lg border text-sm font-bold transition-all ${
                                cur === true
                                  ? 'border-indigo-600 bg-indigo-600 text-white'
                                  : 'border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-500'
                              }`}
                            >
                              Đúng
                            </button>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => onChange(q.globalIndex, { ...groupAnswer, [item.questionUuid]: false })}
                              className={`px-5 py-1.5 rounded-lg border text-sm font-bold transition-all ${
                                cur === false
                                  ? 'border-indigo-600 bg-indigo-600 text-white'
                                  : 'border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-500'
                              }`}
                            >
                              Sai
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}
