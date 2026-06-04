import { useEffect } from 'react';
import { X, Loader2, AlertCircle, RefreshCw, ImageIcon, FileText } from 'lucide-react';
import { env } from '@/config/env';
import { useScoringJobQuery } from '@/features/Exam_Services/omr/api/omr';
import type { ResOmrScoringJob } from '@/features/Exam_Services/omr/types';

type Props = {
  jobUuid: string | null;
  fallback?: ResOmrScoringJob;
  examName?: string;
  fileName?: string;
  onClose: () => void;
  onSync?: (job: ResOmrScoringJob) => void;
};

const thCls = 'px-4 py-2.5 text-[11px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap';
const tdCls = 'px-4 py-2.5 text-sm text-slate-600';

const JOB_STATUS_COLOR: Record<string, string> = {
  PENDING:    'bg-slate-100 text-slate-500',
  PROCESSING: 'bg-blue-50 text-blue-600',
  EXTRACTED:  'bg-violet-50 text-violet-600',
  IMPORTING:  'bg-amber-50 text-amber-600',
  COMPLETED:  'bg-emerald-50 text-emerald-600',
  FAILED:     'bg-red-50 text-red-500',
};
const JOB_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Chờ xử lý', PROCESSING: 'Đang xử lý', EXTRACTED: 'Đã trích xuất',
  IMPORTING: 'Đang import', COMPLETED: 'Hoàn tất', FAILED: 'Thất bại',
};
const RESULT_STATUS_COLOR: Record<string, string> = {
  EXTRACTED: 'bg-violet-50 text-violet-600',
  IMPORTING: 'bg-amber-50 text-amber-600',
  COMPLETED: 'bg-emerald-50 text-emerald-600',
  FAILED:    'bg-red-50 text-red-500',
};

function fmtScore(value?: number) {
  if (value === undefined || value === null) return '—';
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function toAbsoluteUrl(url?: string) {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  return `${env.VITE_APP_API_URL_ES}${url.startsWith('/') ? '' : '/'}${url}`;
}

const TERMINAL = new Set(['COMPLETED', 'FAILED']);

export function OmrJobDetailDialog({ jobUuid, fallback, examName, fileName, onClose, onSync }: Props) {
  const isOpen = !!jobUuid;
  const { data, isLoading, isError, isFetching } = useScoringJobQuery(jobUuid, isOpen);

  // Đồng bộ dữ liệu mới nhất về store của trang cha.
  useEffect(() => {
    if (data) onSync?.(data);
  }, [data, onSync]);

  if (!isOpen) return null;

  const job = data ?? fallback;
  const results = job?.results ?? [];
  const status = job?.status;
  const isPolling = status != null && !TERMINAL.has(status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[88vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900">Chi tiết phiên chấm</h3>
              {status && (
                <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${JOB_STATUS_COLOR[status] ?? 'bg-slate-100 text-slate-500'}`}>
                  {JOB_STATUS_LABEL[status] ?? status}
                </span>
              )}
              {isPolling && (
                <span className="flex items-center gap-1 text-xs font-bold text-blue-500">
                  <RefreshCw size={12} className="animate-spin" />
                  đang theo dõi…
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5 truncate">
              {[examName, fileName].filter(Boolean).join(' · ') || jobUuid}
            </p>
          </div>
          <button type="button" onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors shrink-0">
            <X size={18} />
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-4 gap-3 px-6 py-4 border-b border-slate-100 shrink-0">
          {[
            ['Số trang', job?.pageCount ?? '—'],
            ['Kết quả', job?.resultCount ?? 0],
            ['Thành công', job?.completedCount ?? 0],
            ['Thất bại', job?.failedCount ?? 0],
          ].map(([label, value], i) => (
            <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{label}</p>
              <p className={`text-lg font-black ${i === 2 ? 'text-emerald-600' : i === 3 ? 'text-red-500' : 'text-slate-800'}`}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {job?.errorMessage && (
          <div className="mx-6 mt-3 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-bold shrink-0">
            <AlertCircle size={16} />
            {job.errorMessage}
          </div>
        )}

        {/* Body: results table */}
        <div className="flex-1 overflow-auto">
          {isLoading && !job ? (
            <div className="flex items-center justify-center py-20 gap-2 text-slate-400">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-sm font-bold">Đang tải…</span>
            </div>
          ) : isError && !job ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2 text-red-400">
              <AlertCircle size={28} />
              <p className="text-sm font-bold">Không thể tải chi tiết job.</p>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2 text-slate-400">
              <FileText size={28} className="opacity-20" />
              <p className="text-sm font-bold">
                {isPolling ? 'Hệ thống đang chấm, chưa có kết quả…' : 'Chưa có kết quả nào.'}
              </p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 sticky top-0">
                  <th className={`${thCls} text-center`}>Trang</th>
                  <th className={thCls}>Mã đề</th>
                  <th className={thCls}>Mã HS</th>
                  <th className={thCls}>Họ tên</th>
                  <th className={`${thCls} text-center`}>Điểm</th>
                  <th className={thCls}>Trạng thái</th>
                  <th className={`${thCls} text-center`}>Ảnh</th>
                  <th className={thCls}>Lỗi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.map((r, i) => {
                  const rawUrl = toAbsoluteUrl(r.rawImageUrl);
                  const scoredUrl = toAbsoluteUrl(r.scoredImageUrl);
                  return (
                    <tr key={r.jobResultUuid ?? i} className="hover:bg-slate-50/60 transition-colors">
                      <td className={`${tdCls} text-center`}>{r.pageNumber ?? '—'}</td>
                      <td className={`${tdCls} font-bold text-slate-800`}>{r.paperCode ?? '—'}</td>
                      <td className={`${tdCls} font-mono`}>{r.studentCode ?? '—'}</td>
                      <td className={`${tdCls} font-semibold text-slate-800`}>{r.studentFullname ?? '—'}</td>
                      <td className={`${tdCls} text-center font-black text-blue-600`}>{fmtScore(r.score)}</td>
                      <td className="px-4 py-2.5">
                        {r.status ? (
                          <span className={`px-2 py-0.5 rounded-md text-xs font-black ${RESULT_STATUS_COLOR[r.status] ?? 'bg-slate-100 text-slate-500'}`}>
                            {r.status}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-center gap-1.5">
                          {rawUrl && (
                            <a href={rawUrl} target="_blank" rel="noreferrer" title="Ảnh gốc"
                              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
                              <FileText size={15} />
                            </a>
                          )}
                          {scoredUrl && (
                            <a href={scoredUrl} target="_blank" rel="noreferrer" title="Ảnh đã chấm"
                              className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors">
                              <ImageIcon size={15} />
                            </a>
                          )}
                          {!rawUrl && !scoredUrl && <span className="text-slate-300 text-sm">—</span>}
                        </div>
                      </td>
                      <td className={`${tdCls} max-w-[160px] truncate text-red-500`} title={r.errorMessage ?? ''}>
                        {r.errorMessage ?? ''}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 shrink-0">
          <span className="text-xs font-bold text-slate-400">
            {isFetching && !isLoading ? 'Đang làm mới…' : results.length > 0 ? `${results.length} bài làm` : ''}
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
