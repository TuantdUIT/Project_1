import { MathRender } from '@/features/Exam_Services/math';
import type { StandaloneQ, AnswerMap } from './types';

interface Props {
  q: StandaloneQ;
  displayIndex: number;
  answers: AnswerMap;
  onChange: (globalIndex: number, value: string) => void;
}

export function MCQCard({ q, displayIndex, answers, onChange }: Props) {
  const answer = answers[q.globalIndex] as string | undefined;
  const options = q.mcOptions ?? [];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-6 py-3.5 border-b border-slate-100">
        <span className="text-sm font-bold text-indigo-600">Câu {displayIndex}</span>
        <span className="text-slate-300 mx-2">•</span>
        <span className="text-sm text-slate-400 font-medium">Trắc nghiệm</span>
        <span className="text-slate-300 mx-2">•</span>
        <span className="text-sm text-slate-400 font-medium">{q.score} điểm</span>
      </div>
      <div className="px-6 py-5 space-y-4">
        {q.groupOrigin?.questionTopic && (
          <div className="bg-indigo-50 rounded-xl px-4 py-3">
            <p className="text-sm font-semibold text-indigo-800">{q.groupOrigin.questionTopic}</p>
          </div>
        )}
        <p className="text-base font-bold text-slate-900 leading-relaxed">
          <MathRender value={q.questionContent} />
        </p>
        <div className="space-y-2.5">
          {options.map(({ optionKey, optionContent }) => (
            <button
              key={optionKey}
              onClick={() => onChange(q.globalIndex, optionKey)}
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl border transition-all text-left ${
                answer === optionKey
                  ? 'border-indigo-300 bg-indigo-50'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
              }`}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                answer === optionKey
                  ? 'border-indigo-600 bg-indigo-600'
                  : 'border-slate-300'
              }`}>
                {answer === optionKey && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
              <span className={`text-sm font-semibold ${answer === optionKey ? 'text-indigo-700' : 'text-slate-700'}`}>
                {optionKey}. <MathRender value={optionContent} fallback={`Phương án ${optionKey}`} />
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
