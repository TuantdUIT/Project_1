import { type FormEvent, useState } from 'react';
import { ArrowLeft, CalendarDays, Hash, Send, User } from 'lucide-react';

type ForgotPasswordFormProps = {
  onBack: () => void;
};

const inputClass =
  'w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-indigo-deep';
const iconClass = 'absolute left-3 top-1/2 -translate-y-1/2 text-gray-400';

/**
 * Form "Quên mật khẩu" — hiện mới ở mức LAYOUT, chưa kết nối backend.
 * Khi có API, nối submit vào endpoint reset/khôi phục tương ứng.
 */
export default function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const [form, setForm] = useState({ studentCode: '', schoolYear: '', fullName: '' });

  function updateField(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    // TODO: nối với backend khi có API khôi phục mật khẩu. Hiện chỉ là layout.
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="mb-2 block text-sm font-bold text-gray-700">Mã học sinh</label>
        <div className="relative">
          <Hash className={iconClass} size={18} />
          <input
            type="text"
            value={form.studentCode}
            onChange={(event) => updateField('studentCode', event.target.value)}
            className={inputClass}
            placeholder="VD: 1301"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-bold text-gray-700">Năm học</label>
        <div className="relative">
          <CalendarDays className={iconClass} size={18} />
          <input
            type="text"
            inputMode="numeric"
            value={form.schoolYear}
            onChange={(event) => updateField('schoolYear', event.target.value)}
            className={inputClass}
            placeholder="VD: 2026"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-bold text-gray-700">Họ tên</label>
        <div className="relative">
          <User className={iconClass} size={18} />
          <input
            type="text"
            value={form.fullName}
            onChange={(event) => updateField('fullName', event.target.value)}
            className={inputClass}
            placeholder="VD: Nguyễn Văn A"
          />
        </div>
      </div>

      <button
        type="submit"
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-deep py-4 text-lg font-bold text-white shadow-lg shadow-indigo-deep/20 transition-all hover:bg-indigo-700"
      >
        <Send size={18} />
        Gửi
      </button>

      <button
        type="button"
        onClick={onBack}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-sm font-bold text-gray-600 transition-all hover:border-indigo-deep hover:text-indigo-deep"
      >
        <ArrowLeft size={16} />
        Quay lại đăng nhập
      </button>
    </form>
  );
}
