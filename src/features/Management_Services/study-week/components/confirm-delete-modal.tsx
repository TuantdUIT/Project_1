import { X } from 'lucide-react';
import { useDeleteStudyWeek } from '@/features/Management_Services/study-week/api/study-weeks';
import { formatWeekLabel } from '@/features/Management_Services/study-week/lib/format-week';
import type { StudyWeek } from '@/features/Management_Services/study-week/types';

export default function ConfirmDeleteModal({
  studyWeek,
  onClose,
}: {
  studyWeek: StudyWeek;
  onClose: () => void;
}) {
  const deleteStudyWeek = useDeleteStudyWeek();

  async function handleDelete() {
    if (!studyWeek.week_uuid) return;
    await deleteStudyWeek.mutateAsync(studyWeek.week_uuid);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[12px] font-extrabold uppercase tracking-[0.16em] text-rose-600">
              Xóa tuần học
            </p>
            <h3 className="mt-1 text-[20px] font-extrabold text-slate-950">
              {formatWeekLabel(studyWeek)}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] font-semibold text-rose-700">
          Thao tác này sẽ xóa StudyWeek và các Lesson liên quan của tuần này. Chỉ tiếp tục khi bạn chắc chắn.
        </p>

        {deleteStudyWeek.isError ? (
          <p className="mt-4 text-[13px] font-semibold text-rose-600">
            Không xóa được tuần học.
          </p>
        ) : null}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-xl border border-slate-300 px-4 text-[14px] font-extrabold text-slate-600 transition hover:bg-slate-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteStudyWeek.isPending}
            className="h-11 rounded-xl bg-rose-600 px-5 text-[14px] font-extrabold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleteStudyWeek.isPending ? 'Đang xóa...' : 'Xóa tuần'}
          </button>
        </div>
      </div>
    </div>
  );
}
