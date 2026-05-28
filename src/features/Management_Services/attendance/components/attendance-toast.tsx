import { useEffect } from 'react';
import { CheckCircle2, Undo2 } from 'lucide-react';

export type AttendanceToastState = {
  id: number;
  message: string;
  tone: 'success' | 'warning';
};

export default function AttendanceToast({
  toast,
  onClose,
}: {
  toast: AttendanceToastState | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!toast) return;

    const timeoutId = window.setTimeout(onClose, 3000);
    return () => window.clearTimeout(timeoutId);
  }, [onClose, toast]);

  if (!toast) return null;

  const toneClass =
    toast.tone === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : 'border-amber-200 bg-amber-50 text-amber-800';
  const icon =
    toast.tone === 'success'
      ? <CheckCircle2 size={20} className="shrink-0 text-emerald-600" />
      : <Undo2 size={20} className="shrink-0 text-amber-600" />;

  return (
    <div
      key={toast.id}
      className={`fixed bottom-5 left-5 z-50 flex max-w-[360px] items-center gap-3 rounded-xl border px-4 py-3 text-[14px] font-black shadow-[0_18px_40px_rgba(15,23,42,0.18)] ${toneClass}`}
      role="status"
      aria-live="polite"
    >
      {icon}
      <span>{toast.message}</span>
    </div>
  );
}
