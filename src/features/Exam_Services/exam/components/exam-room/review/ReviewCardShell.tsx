import React from 'react';
import { MathRender } from '@/features/Exam_Services/math';
import { toAbsoluteUrl } from '@/features/Exam_Services/exam/lib/asset-url';
import { formatScore } from '@/features/Exam_Services/exam/lib/attempt-status';

interface Props {
  index: number;
  typeLabel: string;
  maxScore?: number;
  earnedScore?: number;
  /** Hiện `earned/max` thay vì chỉ `max` (chỉ khi đã công bố điểm từng câu). */
  showEarned: boolean;
  topic?: string | null;
  content?: string | null;
  imagePath?: string | null;
  children: React.ReactNode;
}

/** Khung hiển thị chung cho 1 câu ở màn xem lại: header điểm + chủ đề + nội dung + ảnh + vùng đáp án. */
export function ReviewCardShell({
  index, typeLabel, maxScore, earnedScore, showEarned, topic, content, imagePath, children,
}: Props) {
  const img = toAbsoluteUrl(imagePath);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-6 py-3.5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <span className="text-sm font-bold text-indigo-600">Câu {index}</span>
          <span className="text-slate-300 mx-2">•</span>
          <span className="text-sm text-slate-400 font-medium">{typeLabel}</span>
        </div>
        <span className="text-sm font-bold text-slate-500">
          {showEarned
            ? `${formatScore(earnedScore)} / ${formatScore(maxScore)} điểm`
            : `${formatScore(maxScore)} điểm`}
        </span>
      </div>

      <div className="px-6 py-5 space-y-4">
        {topic && (
          <div className="bg-indigo-50 rounded-xl px-4 py-3">
            <p className="text-sm font-semibold text-indigo-800">
              <MathRender value={topic} />
            </p>
          </div>
        )}
        {content && (
          <p className="text-base font-bold text-slate-900 leading-relaxed">
            <MathRender value={content} />
          </p>
        )}
        {img && (
          <img
            src={img}
            alt={`Ảnh câu ${index}`}
            className="max-h-72 rounded-xl border border-slate-100 object-contain"
          />
        )}
        {children}
      </div>
    </div>
  );
}
