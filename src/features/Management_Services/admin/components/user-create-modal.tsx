import { type FormEvent, useState } from 'react';
import { Eye, EyeOff, X } from 'lucide-react';
import { useCreateUser, type StaffRoleOption } from '@/features/Management_Services/admin';

const fieldClass =
  'h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-[14px] font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1870FF] focus:ring-4 focus:ring-[rgba(24,112,255,0.14)]';

type UserCreateModalProps = {
  roleOptions: StaffRoleOption[];
  onClose: () => void;
};

export default function UserCreateModal({ roleOptions, onClose }: UserCreateModalProps) {
  const createUser = useCreateUser();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    roleId: '',
    fbLink: '',
  });

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (form.password.length < 6) {
      setError('Mật khẩu cần có ít nhất 6 ký tự.');
      return;
    }

    const roleId = Number(form.roleId);
    if (!Number.isFinite(roleId)) {
      setError('Vui lòng chọn vai trò cho nhân sự.');
      return;
    }

    setError('');
    await createUser.mutateAsync({
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phoneNumber: form.phoneNumber.trim() || undefined,
      password: form.password,
      roleId,
      fbLink: form.fbLink.trim() || undefined,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4 py-6">
      <form onSubmit={handleSubmit} className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[12px] font-extrabold uppercase tracking-[0.16em] text-[#1870FF]">Nhân sự</p>
            <h3 className="mt-1 text-[22px] font-extrabold leading-tight text-slate-950">Tạo nhân sự mới</h3>
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
          <Field label="Họ tên" required>
            <input
              value={form.fullName}
              onChange={(event) => setForm({ ...form, fullName: event.target.value })}
              required
              placeholder="Nguyễn Văn A"
              className={fieldClass}
            />
          </Field>

          <Field label="Email" required>
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
              placeholder="a@example.com"
              className={fieldClass}
            />
          </Field>

          <Field label="SĐT">
            <input
              type="tel"
              value={form.phoneNumber}
              onChange={(event) => setForm({ ...form, phoneNumber: event.target.value.replace(/\D/g, '') })}
              placeholder="0123456789"
              className={fieldClass}
            />
          </Field>

          <Field label="Vai trò" required>
            <select
              value={form.roleId}
              onChange={(event) => setForm({ ...form, roleId: event.target.value })}
              required
              className={`${fieldClass} font-extrabold`}
            >
              <option value="">Chọn vai trò</option>
              {roleOptions.map((role) => (
                <option key={`${role.name}-${role.id}`} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Mật khẩu" required>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                required
                minLength={6}
                placeholder="Ít nhất 6 ký tự"
                className={`${fieldClass} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-1 top-1 flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </Field>

          <Field label="Facebook">
            <input
              type="url"
              value={form.fbLink}
              onChange={(event) => setForm({ ...form, fbLink: event.target.value })}
              placeholder="https://facebook.com/..."
              className={fieldClass}
            />
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
            disabled={createUser.isPending}
            className="h-11 rounded-xl bg-[#1870FF] px-5 text-[14px] font-extrabold text-white shadow-[0_12px_22px_rgba(24,112,255,0.26)] transition hover:bg-[#0f62e6] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {createUser.isPending ? 'Đang tạo...' : 'Tạo nhân sự'}
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
      <span className="text-[13px] font-bold text-slate-600">
        {label}
        {required ? <span className="text-rose-500"> *</span> : null}
      </span>
      {children}
    </label>
  );
}
