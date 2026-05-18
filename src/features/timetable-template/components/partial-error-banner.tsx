import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function PartialErrorBanner({
  failedNames,
  onRetry,
  tone = 'warning',
}: {
  failedNames: string[];
  onRetry: () => void;
  tone?: 'warning' | 'danger';
}) {
  const isDanger = tone === 'danger';

  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${
        isDanger
          ? 'border-rose-200 bg-rose-50 text-rose-700'
          : 'border-amber-200 bg-amber-50 text-amber-800'
      }`}
    >
      <div className="flex items-start gap-2">
        <AlertTriangle size={18} className="mt-0.5 shrink-0" />
        <p className="text-[14px] font-bold">
          {isDanger
            ? 'Không tải được mẫu thời gian.'
            : `Không tải được TKB ${failedNames.join(', ')}. Các phần còn lại vẫn được hiển thị.`}
        </p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className={`inline-flex h-9 items-center justify-center gap-2 rounded-xl px-3 text-[13px] font-black transition ${
          isDanger
            ? 'bg-rose-600 text-white hover:bg-rose-700'
            : 'bg-amber-500 text-white hover:bg-amber-600'
        }`}
      >
        <RefreshCw size={14} />
        Tải lại
      </button>
    </div>
  );
}
