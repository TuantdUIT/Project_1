import { type FormEvent, type ReactNode, useState } from 'react';
import { X } from 'lucide-react';
import { useCreateEmployeeRATemplate } from '@/features/Management_Services/employee-ra-template/api/employee-ra-templates';
import { useTimetableTemplatesQuery } from '@/features/Management_Services/timetable-template/api/templates';

const fieldClass =
  'h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-[14px] font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1870FF] focus:ring-4 focus:ring-[rgba(24,112,255,0.14)]';
const labelClass = 'text-[13px] font-bold text-slate-600';

/**
 * Dialog tạo mới Mẫu chấm công — payload khớp ReqCreateEmployeeRATemplateDTO.
 * Trường bắt buộc (name, timetableTemplateId) có dấu * đỏ cạnh tiêu đề.
 */
export default function RaTemplateCreateModal({ onClose }: { onClose: () => void }) {
  const timetableTemplatesQuery = useTimetableTemplatesQuery();
  const createTemplate = useCreateEmployeeRATemplate();

  const [form, setForm] = useState({ name: '', timetableTemplateId: '' });
  const [error, setError] = useState('');

  const timetableTemplates = timetableTemplatesQuery.data ?? [];

  function updateField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');

    if (!form.name.trim() || !form.timetableTemplateId) {
      setError('Vui lòng nhập đầy đủ thông tin bắt buộc.');
      return;
    }

    try {
      await createTemplate.mutateAsync({
        name: form.name.trim(),
        timetableTemplateId: form.timetableTemplateId,
      });
      onClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : 'Không tạo được mẫu chấm công.',
      );
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4 py-6">
      <form
        onSubmit={handleSubmit}
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[12px] font-extrabold uppercase tracking-[0.16em] text-[#1870FF]">
              Employee RA Template
            </p>
            <h3 className="mt-1 text-[22px] font-extrabold leading-tight text-slate-950">
              Tạo mẫu chấm công
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

        <div className="grid grid-cols-1 gap-4">
          <Field label="Tên template" required>
            <input
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
              required
              placeholder="K12-2026-RA"
              className={fieldClass}
            />
          </Field>

          <Field label="Mẫu thời khóa biểu liên kết" required>
            <select
              value={form.timetableTemplateId}
              onChange={(event) => updateField('timetableTemplateId', event.target.value)}
              required
              className={`${fieldClass} font-extrabold`}
            >
              <option value="">Chọn mẫu thời khóa biểu</option>
              {timetableTemplates.map((template) => (
                <option
                  key={template.timetable_template_uuid}
                  value={template.timetable_template_uuid ?? ''}
                >
                  {template.timetable_template_name ?? '—'}
                  {template.grade?.name ? ` · ${template.grade.name}` : ''}
                  {template.school_year != null ? ` · ${template.school_year}` : ''}
                </option>
              ))}
            </select>
            {!timetableTemplatesQuery.isLoading && timetableTemplates.length === 0 ? (
              <p className="mt-1 text-[12px] font-semibold text-rose-500">
                Chưa có mẫu thời khóa biểu nào. Hãy tạo mẫu thời khóa biểu trước.
              </p>
            ) : null}
          </Field>
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
