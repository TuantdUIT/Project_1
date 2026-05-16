import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, Mail, Shield, Trash2, User, X } from 'lucide-react';
import {
  useDeleteUser,
  useUpdateUser,
  useUserDetailQuery,
  type ResUserDTO,
  type StaffRoleOption,
  type UserUpdatePayload,
} from '@/features/admin';

const fieldClass =
  'h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-[14px] font-extrabold text-slate-950 outline-none transition focus:border-[#1870FF] focus:ring-4 focus:ring-[rgba(24,112,255,0.14)]';

type UserDetailModalProps = {
  userUuid: string;
  fallback: ResUserDTO;
  roleOptions: StaffRoleOption[];
  onClose: () => void;
};

export default function UserDetailModal({
  userUuid,
  fallback,
  roleOptions,
  onClose,
}: UserDetailModalProps) {
  const detailQuery = useUserDetailQuery(userUuid);
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');
  const user = detailQuery.data ?? fallback;

  const originals = useMemo(
    () => ({
      fullName: user.user_fullname ?? '',
      email: user.user_email ?? '',
      phoneNumber: user.user_phone_number ?? '',
      fbLink: user.fb_link ?? '',
      roleId: user.role?.id != null ? String(user.role.id) : '',
    }),
    [user],
  );

  const [form, setForm] = useState({ ...originals, password: '' });

  useEffect(() => {
    setForm({ ...originals, password: '' });
    setError('');
  }, [originals]);

  const isDirty = (Object.keys(originals) as Array<keyof typeof originals>).some(
    (key) => form[key] !== originals[key],
  ) || form.password.trim().length > 0;

  const roleName = user.role?.name ?? '—';

  function updateField<K extends keyof typeof form>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleEditing() {
    if (isEditing) {
      setForm({ ...originals, password: '' });
      setError('');
      setIsEditing(false);
    } else {
      setIsEditing(true);
      setConfirmDelete(false);
    }
  }

  async function handleApply(event: FormEvent) {
    event.preventDefault();

    if (!user.id || !isDirty) {
      return;
    }

    if (form.password && form.password.length < 6) {
      setError('Mật khẩu mới cần có ít nhất 6 ký tự.');
      return;
    }

    const roleId = Number(form.roleId);
    const body: UserUpdatePayload = {};

    if (form.fullName !== originals.fullName) {
      body.fullName = form.fullName.trim() || undefined;
    }
    if (form.email !== originals.email) {
      body.email = form.email.trim() || undefined;
    }
    if (form.phoneNumber !== originals.phoneNumber) {
      body.phoneNumber = form.phoneNumber.trim() || undefined;
    }
    if (form.fbLink !== originals.fbLink) {
      body.fbLink = form.fbLink.trim() || undefined;
    }
    if (form.roleId !== originals.roleId && Number.isFinite(roleId)) {
      body.roleId = roleId;
    }
    if (form.password.trim()) {
      body.password = form.password;
    }

    setError('');
    await updateUser.mutateAsync({ userUuid: user.id, body });
    setIsEditing(false);
  }

  async function handleDelete() {
    if (!user.id) {
      return;
    }

    await deleteUser.mutateAsync(user.id);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4 py-6">
      <form onSubmit={handleApply} className="flex w-full max-w-2xl max-h-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 p-6">
          <div className="min-w-0">
            <p className="text-[12px] font-extrabold uppercase tracking-[0.16em] text-[#1870FF]">Nhân sự</p>
            {isEditing ? (
              <input
                value={form.fullName}
                onChange={(event) => updateField('fullName', event.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1 text-[28px] font-extrabold leading-tight text-slate-950 outline-none transition focus:border-[#1870FF] focus:ring-4 focus:ring-[rgba(24,112,255,0.14)]"
              />
            ) : (
              <h3 className="mt-1 truncate text-[28px] font-extrabold leading-tight text-slate-950">
                {user.user_fullname ?? '—'}
              </h3>
            )}
            <div className="mt-3">
              <RoleBadge name={roleName} />
            </div>
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

        <div className="flex-1 overflow-y-auto">
          {detailQuery.isLoading || detailQuery.data === null ? (
            <div className="px-6 pb-2">
              {detailQuery.isLoading ? (
                <p className="text-[13px] font-semibold text-slate-500">Đang tải chi tiết nhân sự...</p>
              ) : null}
              {detailQuery.data === null ? (
                <p className="text-[13px] font-semibold text-rose-600">
                  Không tìm thấy user này trên server. Đang hiển thị dữ liệu tóm tắt từ danh sách.
                </p>
              ) : null}
            </div>
          ) : null}

          <DetailSection icon={User} title="Thông tin tài khoản">
            <DetailGrid>
              <EditableRow
                label="Họ tên"
                value={isEditing ? form.fullName : user.user_fullname}
                editing={isEditing}
                onChange={(next) => updateField('fullName', next)}
                required
              />
              <EditableRow
                label="Email"
                value={isEditing ? form.email : user.user_email}
                editing={isEditing}
                onChange={(next) => updateField('email', next)}
                type="email"
                required
              />
              <EditableRow
                label="Số điện thoại"
                value={isEditing ? form.phoneNumber : user.user_phone_number}
                editing={isEditing}
                onChange={(next) => updateField('phoneNumber', next.replace(/\D/g, ''))}
                type="tel"
              />
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-slate-400">Vai trò</p>
                {isEditing ? (
                  <select
                    value={form.roleId}
                    onChange={(event) => updateField('roleId', event.target.value)}
                    className={`${fieldClass} mt-1`}
                    required
                  >
                    <option value="">Chọn vai trò</option>
                    {roleOptions.map((role) => (
                      <option key={`${role.name}-${role.id}`} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="mt-1 break-words text-[14px] font-extrabold text-slate-950">{roleName}</p>
                )}
              </div>
            </DetailGrid>
          </DetailSection>

          <DetailSection icon={Mail} title="Liên hệ & bảo mật">
            <DetailGrid>
              <EditableRow
                label="Facebook profile"
                value={isEditing ? form.fbLink : user.fb_link}
                editing={isEditing}
                onChange={(next) => updateField('fbLink', next)}
                type="url"
              />
              <PasswordRow
                value={form.password}
                editing={isEditing}
                showPassword={showPassword}
                onToggleShow={() => setShowPassword((current) => !current)}
                onChange={(next) => updateField('password', next)}
              />
            </DetailGrid>
          </DetailSection>

          <div className="bg-slate-50">
            <DetailSection icon={Shield} title="Dấu vết hệ thống">
              <DetailGrid>
                <DetailRow label="Ngày tạo" value={formatDateTime(user.created_at)} />
                <DetailRow label="Ngày cập nhật" value={formatDateTime(user.updated_at)} />
                <DetailRow label="Người tạo" value={user.created_by} />
                <DetailRow label="Người cập nhật" value={user.updated_by} />
              </DetailGrid>
            </DetailSection>
          </div>
        </div>

        {error ? <p className="border-t border-slate-100 px-4 pt-3 text-[13px] font-semibold text-rose-600">{error}</p> : null}

        {confirmDelete ? (
          <div className="border-t border-rose-100 bg-rose-50 px-4 py-3">
            <p className="text-[13px] font-semibold text-rose-700">
              Xóa user này? Thao tác này không thể hoàn tác.
            </p>
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="h-10 rounded-xl bg-white px-4 text-[13px] font-extrabold text-slate-700 transition hover:bg-slate-50"
              >
                Giữ lại
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteUser.isPending}
                className="h-10 rounded-xl bg-rose-600 px-4 text-[13px] font-extrabold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleteUser.isPending ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        ) : null}

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 p-4">
          <button
            type="button"
            onClick={toggleEditing}
            disabled={updateUser.isPending || deleteUser.isPending}
            className="h-11 rounded-xl bg-slate-100 px-5 text-[14px] font-extrabold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isEditing ? 'Hủy' : 'Chỉnh sửa'}
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            disabled={updateUser.isPending || deleteUser.isPending}
            className="flex h-11 items-center gap-2 rounded-xl bg-rose-50 px-5 text-[14px] font-extrabold text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 size={16} />
            Xóa
          </button>
          <button
            type="submit"
            disabled={!isDirty || updateUser.isPending || deleteUser.isPending || !isEditing}
            className="h-11 rounded-xl bg-[#1870FF] px-5 text-[14px] font-extrabold text-white shadow-[0_12px_22px_rgba(24,112,255,0.26)] transition hover:bg-[#0f62e6] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none"
          >
            {updateUser.isPending ? 'Đang lưu...' : 'Áp dụng'}
          </button>
        </div>
      </form>
    </div>
  );
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function RoleBadge({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-[#1870FF]/10 px-3 py-1 text-[12px] font-extrabold uppercase tracking-[0.08em] text-[#1870FF]">
      <span className="h-2 w-2 rounded-full bg-[#1870FF]" />
      {name}
    </span>
  );
}

function DetailSection({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof User;
  title: string;
  children: React.ReactNode;
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

function DetailGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">{children}</div>;
}

function EditableRow({
  label,
  value,
  editing,
  onChange,
  type = 'text',
  required = false,
}: {
  label: string;
  value?: string | null;
  editing: boolean;
  onChange: (next: string) => void;
  type?: string;
  required?: boolean;
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
          className={`${fieldClass} mt-1`}
        />
      ) : (
        <p className="mt-1 break-words text-[14px] font-extrabold text-slate-950">{value || '—'}</p>
      )}
    </div>
  );
}

function PasswordRow({
  value,
  editing,
  showPassword,
  onToggleShow,
  onChange,
}: {
  value: string;
  editing: boolean;
  showPassword: boolean;
  onToggleShow: () => void;
  onChange: (next: string) => void;
}) {
  return (
    <div>
      <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-slate-400">Mật khẩu mới</p>
      {editing ? (
        <div className="relative mt-1">
          <input
            type={showPassword ? 'text' : 'password'}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            minLength={value ? 6 : undefined}
            placeholder="Để trống nếu không đổi"
            className={`${fieldClass} pr-11`}
          />
          <button
            type="button"
            onClick={onToggleShow}
            className="absolute right-1 top-0.5 flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          >
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
      ) : (
        <p className="mt-1 break-words text-[14px] font-extrabold text-slate-950">Không hiển thị</p>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p className="mt-1 break-words text-[14px] font-extrabold text-slate-950">{value || '—'}</p>
    </div>
  );
}
