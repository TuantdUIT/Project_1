import { type FormEvent, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import {
  useCreateStudyWeek,
  useUpdateStudyWeek,
} from '@/features/Management_Services/study-week/api/study-weeks';
import type { StudyWeek } from '@/features/Management_Services/study-week/types';

const fieldClass =
  'h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-[14px] font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1870FF] focus:ring-4 focus:ring-[rgba(24,112,255,0.14)]';
const labelClass = 'text-[13px] font-bold text-slate-600';

type StudyWeekFormModalProps = {
  studyWeek?: StudyWeek;
  onClose: () => void;
};

export default function StudyWeekFormModal({ studyWeek, onClose }: StudyWeekFormModalProps) {
  const isUpdate = Boolean(studyWeek?.week_uuid);
  const initial = useMemo(
    () => ({
      weekNumber: studyWeek?.week_number != null ? String(studyWeek.week_number) : '',
      schoolYear: studyWeek?.school_year != null ? String(studyWeek.school_year) : String(new Date().getFullYear()),
      startDate: studyWeek?.week_start_date ?? '',
      endDate: studyWeek?.week_end_date ?? '',
    }),
    [studyWeek],
  );
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');
  const createStudyWeek = useCreateStudyWeek();
  const updateStudyWeek = useUpdateStudyWeek();
  const isPending = createStudyWeek.isPending || updateStudyWeek.isPending;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');

    const weekNumber = Number(form.weekNumber);
    const schoolYear = Number(form.schoolYear);

    if (!Number.isFinite(weekNumber) || weekNumber < 1) {
      setError('Số thứ tự tuần phải lớn hơn 0.');
      return;
    }

    if (!Number.isFinite(schoolYear)) {
      setError('Vui lòng nhập năm học.');
      return;
    }

    const body = {
      weekNumber,
      schoolYear,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
    };

    try {
      if (isUpdate) {
        await updateStudyWeek.mutateAsync({ weekUuid: studyWeek?.week_uuid ?? '', body });
      } else {
        await createStudyWeek.mutateAsync(body);
      }
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Không lưu được tuần học.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[12px] font-extrabold uppercase tracking-[0.16em] text-[#1870FF]">
              Study Week
            </p>
            <h3 className="mt-1 text-[22px] font-extrabold text-slate-950">
              {isUpdate ? 'Sửa tuần học' : 'Tạo tuần học'}
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

        {isUpdate ? (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] font-semibold text-amber-800">
            Cập nhật tuần học sẽ xóa và sinh lại Lesson của tuần này.
          </div>
        ) : (
          <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-[13px] font-semibold text-blue-700">
            Nếu để trống ngày bắt đầu/kết thúc, backend sẽ tự tính khoảng tuần.
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Số thứ tự tuần" required>
            <input
              type="number"
              min={1}
              value={form.weekNumber}
              onChange={(event) => setForm((current) => ({ ...current, weekNumber: event.target.value }))}
              className={fieldClass}
              required
            />
          </Field>
          <Field label="Năm học" required>
            <input
              type="number"
              value={form.schoolYear}
              onChange={(event) => setForm((current) => ({ ...current, schoolYear: event.target.value }))}
              className={fieldClass}
              required
            />
          </Field>
          <Field label="Ngày bắt đầu">
            <input
              type="date"
              value={form.startDate}
              onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))}
              className={fieldClass}
            />
          </Field>
          <Field label="Ngày kết thúc">
            <input
              type="date"
              value={form.endDate}
              onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))}
              className={fieldClass}
            />
          </Field>
        </div>

        {error ? <p className="mt-4 text-[13px] font-semibold text-rose-600">{error}</p> : null}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-xl border border-slate-300 px-4 text-[14px] font-extrabold text-slate-600 transition hover:bg-slate-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="h-11 rounded-xl bg-[#1870FF] px-5 text-[14px] font-extrabold text-white shadow-[0_12px_22px_rgba(24,112,255,0.26)] transition hover:bg-[#0f62e6] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? 'Đang lưu...' : isUpdate ? 'Lưu thay đổi' : 'Tạo tuần'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-2">
      <span className={labelClass}>
        {label}
        {required ? <span className="text-rose-500"> *</span> : null}
      </span>
      {children}
    </label>
  );
}
