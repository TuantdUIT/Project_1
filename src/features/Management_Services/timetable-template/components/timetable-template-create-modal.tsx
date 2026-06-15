import { type FormEvent, type ReactNode, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { useGradesQuery, useLessonTypesQuery } from '@/features/Management_Services/curriculum';
import { useCreateTimetableTemplate } from '@/features/Management_Services/timetable-template/api/templates';
import { DAY_OF_WEEK_LABEL } from '@/features/Management_Services/timetable-template/lib/time';
import type { DayOfWeek, ReqTimetableTemplateItem } from '@/features/Management_Services/timetable-template/types';

const fieldClass =
  'h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-[14px] font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1870FF] focus:ring-4 focus:ring-[rgba(24,112,255,0.14)]';
const labelClass = 'text-[13px] font-bold text-slate-600';

const todayIso = () => new Date().toISOString().slice(0, 10);

const DAY_OF_WEEK_ENTRIES = Object.entries(DAY_OF_WEEK_LABEL) as [DayOfWeek, string][];

type ItemRow = {
  lessonTypeId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  sortOrder: string;
};

/**
 * Dialog tạo mới Mẫu thời khóa biểu — payload khớp ReqCreateTimetableTemplateDTO.
 * Trường bắt buộc (name, gradeId, schoolYear, applyFrom) có dấu * đỏ cạnh tiêu đề.
 * Phần "Giờ học theo loại buổi" tương ứng mảng items (lessonType + thứ + giờ bắt đầu + thứ tự).
 */
export default function TimetableTemplateCreateModal({ onClose }: { onClose: () => void }) {
  const gradesQuery = useGradesQuery();
  const lessonTypesQuery = useLessonTypesQuery();
  const createTemplate = useCreateTimetableTemplate();

  const [form, setForm] = useState({
    name: '',
    gradeId: '',
    schoolYear: String(new Date().getFullYear()),
    applyFrom: todayIso(),
    active: true,
  });
  const [items, setItems] = useState<ItemRow[]>([]);
  const [error, setError] = useState('');

  function updateField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function addItemRow() {
    setItems((current) => [
      ...current,
      { lessonTypeId: '', dayOfWeek: 'MONDAY', startTime: '', sortOrder: String(current.length + 1) },
    ]);
  }

  function updateItemRow(index: number, patch: Partial<ItemRow>) {
    setItems((current) => current.map((row, idx) => (idx === index ? { ...row, ...patch } : row)));
  }

  function removeItemRow(index: number) {
    setItems((current) => current.filter((_, idx) => idx !== index));
  }

  function validateItems(): ReqTimetableTemplateItem[] | string {
    const result: ReqTimetableTemplateItem[] = [];
    for (const [index, row] of items.entries()) {
      if (!row.lessonTypeId) return `Dòng giờ học ${index + 1}: chưa chọn loại buổi.`;
      if (!row.dayOfWeek) return `Dòng giờ học ${index + 1}: chưa chọn thứ.`;
      if (!row.startTime) return `Dòng giờ học ${index + 1}: chưa nhập giờ bắt đầu.`;
      const sortOrder = Number(row.sortOrder);
      if (!Number.isFinite(sortOrder) || sortOrder < 1) {
        return `Dòng giờ học ${index + 1}: thứ tự phải >= 1.`;
      }
      result.push({
        lessonTypeId: row.lessonTypeId,
        dayOfWeek: row.dayOfWeek,
        startTime: row.startTime,
        sortOrder,
      });
    }
    return result;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');

    const gradeId = Number(form.gradeId);
    const schoolYear = Number(form.schoolYear);

    if (
      !form.name.trim()
      || !form.gradeId
      || !Number.isFinite(gradeId)
      || !Number.isFinite(schoolYear)
      || !form.applyFrom
    ) {
      setError('Vui lòng nhập đầy đủ thông tin bắt buộc.');
      return;
    }

    const validatedItems = validateItems();
    if (typeof validatedItems === 'string') {
      setError(validatedItems);
      return;
    }

    try {
      await createTemplate.mutateAsync({
        name: form.name.trim(),
        gradeId,
        schoolYear,
        applyFrom: form.applyFrom,
        active: form.active,
        items: validatedItems,
      });
      onClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : 'Không tạo được mẫu thời khóa biểu.',
      );
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4 py-6">
      <form
        onSubmit={handleSubmit}
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[12px] font-extrabold uppercase tracking-[0.16em] text-[#1870FF]">
              Timetable Template
            </p>
            <h3 className="mt-1 text-[22px] font-extrabold leading-tight text-slate-950">
              Tạo mẫu thời khóa biểu
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Tên template" required>
            <input
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
              required
              placeholder="K12-2026-TKB"
              className={fieldClass}
            />
          </Field>

          <Field label="Khối" required>
            <select
              value={form.gradeId}
              onChange={(event) => updateField('gradeId', event.target.value)}
              required
              className={`${fieldClass} font-extrabold`}
            >
              <option value="">Chọn khối</option>
              {(gradesQuery.data?.grades ?? []).map((grade) => (
                <option key={grade.id} value={grade.id ?? ''}>
                  {grade.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Năm học" required>
            <input
              type="number"
              value={form.schoolYear}
              onChange={(event) => updateField('schoolYear', event.target.value)}
              required
              className={fieldClass}
            />
          </Field>

          <Field label="Ngày áp dụng (applyFrom)" required>
            <input
              type="date"
              value={form.applyFrom}
              onChange={(event) => updateField('applyFrom', event.target.value)}
              required
              className={fieldClass}
            />
          </Field>

          <label className="flex items-center gap-2 sm:col-span-2">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(event) => updateField('active', event.target.checked)}
              className="h-5 w-5 rounded border-slate-300 accent-[#1870FF]"
            />
            <span className={labelClass}>Đang hoạt động (active)</span>
          </label>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[14px] font-extrabold text-slate-950">Giờ học theo loại buổi</p>
              <p className="mt-0.5 text-[12px] font-semibold text-slate-500">
                Có thể bỏ trống và thêm các tiết sau ở trang Thời Khóa Biểu.
              </p>
            </div>
            <button
              type="button"
              onClick={addItemRow}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#1870FF] px-3 text-[12px] font-extrabold text-[#1870FF] transition hover:bg-[rgba(24,112,255,0.08)]"
            >
              <Plus size={14} />
              Thêm dòng
            </button>
          </div>

          {items.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-4 text-center text-[12px] font-semibold text-slate-500">
              Chưa có giờ học. Có thể bỏ trống.
            </p>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-[2fr_1.2fr_1fr_0.8fr_auto] items-center gap-2 px-2">
                <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-slate-500">Loại buổi học</span>
                <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-slate-500">Thứ</span>
                <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-slate-500">Giờ bắt đầu</span>
                <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-slate-500">Thứ tự</span>
                <span className="w-11" aria-hidden />
              </div>
              {items.map((row, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[2fr_1.2fr_1fr_0.8fr_auto] items-center gap-2 rounded-lg bg-white p-2"
                >
                  <select
                    value={row.lessonTypeId}
                    onChange={(event) => updateItemRow(index, { lessonTypeId: event.target.value })}
                    required
                    className={`${fieldClass} font-extrabold`}
                  >
                    <option value="">Chọn loại buổi</option>
                    {(lessonTypesQuery.data ?? []).map((lessonType) => (
                      <option
                        key={lessonType.lesson_type_uuid ?? lessonType.lesson_type_name}
                        value={lessonType.lesson_type_uuid ?? ''}
                      >
                        {lessonType.lesson_type_name ?? '—'}
                      </option>
                    ))}
                  </select>
                  <select
                    value={row.dayOfWeek}
                    onChange={(event) => updateItemRow(index, { dayOfWeek: event.target.value as DayOfWeek })}
                    required
                    className={`${fieldClass} font-extrabold`}
                  >
                    {DAY_OF_WEEK_ENTRIES.map(([day, label]) => (
                      <option key={day} value={day}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="time"
                    value={row.startTime}
                    onChange={(event) => updateItemRow(index, { startTime: event.target.value })}
                    required
                    className={fieldClass}
                  />
                  <input
                    type="number"
                    min={1}
                    value={row.sortOrder}
                    onChange={(event) => updateItemRow(index, { sortOrder: event.target.value })}
                    placeholder="Thứ tự"
                    required
                    className={`${fieldClass} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                  />
                  <button
                    type="button"
                    onClick={() => removeItemRow(index)}
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-rose-100 bg-rose-50 text-rose-600 transition hover:bg-rose-100"
                    aria-label="Xóa dòng"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error ? <p className="mt-4 text-[13px] font-semibold text-rose-600">{error}</p> : null}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-xl border border-slate-300 px-4 text-[14px] font-extrabold text-slate-600 transition hover:bg-slate-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={createTemplate.isPending}
            className="h-11 rounded-xl bg-[#1870FF] px-5 text-[14px] font-extrabold text-white shadow-[0_12px_22px_rgba(24,112,255,0.26)] transition hover:bg-[#0f62e6] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {createTemplate.isPending ? 'Đang tạo...' : 'Tạo template'}
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
  children: ReactNode;
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
