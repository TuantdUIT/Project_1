import { X, Loader2, AlertCircle, FileBarChart, ShieldAlert } from 'lucide-react';
import { useExamResultsQuery } from '@/features/Exam_Services/exam/api/exams';

type Props = {
  isOpen: boolean;
  examUuid: string | null;
  examName?: string;
  onClose: () => void;
};

const thCls = 'px-4 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap';
const tdCls = 'px-4 py-3 text-sm text-slate-600';

const SUBMIT_SOURCE_LABEL: Record<string, string> = {
  WEB: 'Trực tuyến',
  OMR_IMPORT: 'Quét phiếu',
};

function fmtScore(value?: number) {
  if (value === undefined || value === null) return '—';
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

export function ExamResultsDialog({ isOpen, examUuid, examName, onClose }: Props) {
  const { data, isLoading, isError } = useExamResultsQuery(examUuid, isOpen);

  if (!isOpen) return null;

  const results = data ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <FileBarChart size={18} className="text-blue-600" />
            <div>
              <h3 className="text-base font-black text-slate-900">Kết quả kiểm tra</h3>
              {examName && <p className="text-xs text-slate-400 mt-0.5">{examName}</p>}
            </div>
          </div>
          <button type="button" onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 gap-2 text-slate-400">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-sm font-bold">Đang tải kết quả...</span>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2 text-red-400">
              <AlertCircle size={28} />
              <p className="text-sm font-bold">Không thể tải kết quả kiểm tra.</p>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2 text-slate-400">
              <FileBarChart size={28} className="opacity-20" />
              <p className="text-sm font-bold">Chưa có học sinh nào nộp bài.</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 sticky top-0">
                  <th className={thCls}>Mã học sinh</th>
                  <th className={thCls}>Họ tên</th>
                  <th className={thCls}>Nguồn nộp</th>
                  <th className={`${thCls} text-center`}>MCQ</th>
                  <th className={`${thCls} text-center`}>TFQ</th>
                  <th className={`${thCls} text-center`}>SAQ</th>
                  <th className={`${thCls} text-center`}>Tổng điểm</th>
                  <th className={`${thCls} text-center`}>Vi phạm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.map((r, i) => (
                  <tr key={r.userUuid ? `${r.userUuid}-${i}` : i} className="hover:bg-slate-50/60 transition-colors">
                    <td className={`${tdCls} font-mono`}>{r.studentId ?? '—'}</td>
                    <td className={`${tdCls} font-bold text-slate-800`}>{r.fullname ?? '—'}</td>
                    <td className={tdCls}>{SUBMIT_SOURCE_LABEL[r.submitSource ?? ''] ?? r.submitSource ?? '—'}</td>
                    <td className={`${tdCls} text-center`}>{fmtScore(r.sectionScores?.MCQ)}</td>
                    <td className={`${tdCls} text-center`}>{fmtScore(r.sectionScores?.TFQ)}</td>
                    <td className={`${tdCls} text-center`}>{fmtScore(r.sectionScores?.SAQ)}</td>
                    <td className={`${tdCls} text-center font-black text-blue-600`}>{fmtScore(r.totalScore)}</td>
                    <td className="px-4 py-3 text-center">
                      {r.violationCount && r.violationCount > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-black bg-red-50 text-red-600">
                          <ShieldAlert size={12} />
                          {r.violationCount}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400">0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 shrink-0">
          <span className="text-xs font-bold text-slate-400">
            {results.length > 0 && `${results.length} học sinh`}
          </span>
          <button type="button" onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors">
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
}
