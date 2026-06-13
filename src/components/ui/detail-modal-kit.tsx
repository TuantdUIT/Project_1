import type { ComponentType, ReactNode } from 'react';
import { Trash2 } from 'lucide-react';

/**
 * Ý nghĩa: Bộ khối giao diện dùng chung cho các dialog chi tiết dạng
 * "xem → Chỉnh sửa → Áp dụng / Xóa" (nhân sự, template...), tách từ thiết kế
 * của user-detail-modal để các modal template tái sử dụng cùng một look & feel.
 */

export const detailFieldClass =
  'h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-[14px] font-extrabold text-slate-950 outline-none transition focus:border-[#1870FF] focus:ring-4 focus:ring-[rgba(24,112,255,0.14)]';

type IconComponent = ComponentType<{ size?: number | string; strokeWidth?: number | string }>;

export function DetailSection({
  icon: Icon,
  title,
  children,
}: {
  icon: IconComponent;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="px-6 py-5">
      <div className="mb-4 flex items-center gap-2 text-[#1870FF]">
        <Icon size={18} strokeWidth={2.5} />
        <h4 className="text-[14px] font-extrabold uppercase tracking-[0.06em]">{title}</h4>
      </div>
      {children}
    </div>
  );
}

export function DetailGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">{children}</div>;
}

export function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p className="mt-1 break-words text-[14px] font-extrabold text-slate-950">{value || '—'}</p>
    </div>
  );
}

export function EditableRow({
  label,
  value,
  editing,
  onChange,
  type = 'text',
  required = false,
  displayValue,
}: {
  label: string;
  value?: string | null;
  editing: boolean;
  onChange: (next: string) => void;
  type?: string;
  required?: boolean;
  /** Giá trị hiển thị ở chế độ xem (nếu khác giá trị raw của input). */
  displayValue?: string | null;
}) {
  return (
    <div>
      <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p>
      {editing ? (
        <input
          type={type}
          value={value ?? ''}
          onChange={(event) => onChange(event.target.value)}
          required={required}
          className={`${detailFieldClass} mt-1`}
        />
      ) : (
        <p className="mt-1 break-words text-[14px] font-extrabold text-slate-950">
          {(displayValue ?? value) || '—'}
        </p>
      )}
    </div>
  );
}

export function EditableSelectRow({
  label,
  value,
  editing,
  onChange,
  required = false,
  displayValue,
  children,
}: {
  label: string;
  value: string;
  editing: boolean;
  onChange: (next: string) => void;
  required?: boolean;
  displayValue?: string | null;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p>
      {editing ? (
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required={required}
          className={`${detailFieldClass} mt-1`}
        >
          {children}
        </select>
      ) : (
        <p className="mt-1 break-words text-[14px] font-extrabold text-slate-950">
          {displayValue || '—'}
        </p>
      )}
    </div>
  );
}

export function ConfirmDeleteBanner({
  message,
  isPending,
  onCancel,
  onConfirm,
}: {
  message: string;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="border-t border-rose-100 bg-rose-50 px-4 py-3">
      <p className="text-[13px] font-semibold text-rose-700">{message}</p>
      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="h-10 rounded-xl bg-white px-4 text-[13px] font-extrabold text-slate-700 transition hover:bg-slate-50"
        >
          Giữ lại
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isPending}
          className="h-10 rounded-xl bg-rose-600 px-4 text-[13px] font-extrabold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? 'Đang xóa...' : 'Xác nhận xóa'}
        </button>
      </div>
    </div>
  );
}

export function DetailModalFooter({
  isEditing,
  isDirty,
  isBusy,
  isSaving,
  onToggleEdit,
  onRequestDelete,
}: {
  isEditing: boolean;
  isDirty: boolean;
  isBusy: boolean;
  isSaving: boolean;
  onToggleEdit: () => void;
  onRequestDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-end gap-3 border-t border-slate-100 p-4">
      <button
        type="button"
        onClick={onToggleEdit}
        disabled={isBusy}
        className="h-11 rounded-xl bg-slate-100 px-5 text-[14px] font-extrabold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isEditing ? 'Hủy' : 'Chỉnh sửa'}
      </button>
      <button
        type="button"
        onClick={onRequestDelete}
        disabled={isBusy}
        className="flex h-11 items-center gap-2 rounded-xl bg-rose-50 px-5 text-[14px] font-extrabold text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Trash2 size={16} />
        Xóa
      </button>
      <button
        type="submit"
        disabled={!isDirty || isBusy || !isEditing}
        className="h-11 rounded-xl bg-[#1870FF] px-5 text-[14px] font-extrabold text-white shadow-[0_12px_22px_rgba(24,112,255,0.26)] transition hover:bg-[#0f62e6] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none"
      >
        {isSaving ? 'Đang lưu...' : 'Áp dụng'}
      </button>
    </div>
  );
}
