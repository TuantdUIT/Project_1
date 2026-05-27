import { type FormEvent, type ReactNode, useState } from 'react';
import { Mail, Phone } from 'lucide-react';
import { useGradesQuery } from '@/features/curriculum';
import { useStudentRegister } from '@/features/landing/api/student-register';

const currentSchoolYear = new Date().getFullYear();

type FormState = {
  fullName: string;
  phoneNumber: string;
  parentName: string;
  parentNumber: string;
  fbLink: string;
  email: string;
  school: string;
  className: string;
  gradeIds: number[];
};

const INITIAL_FORM: FormState = {
  fullName: '',
  phoneNumber: '',
  parentName: '',
  parentNumber: '',
  fbLink: '',
  email: '',
  school: '',
  className: '',
  gradeIds: [],
};

export default function ConsultationForm() {
  const gradesQuery = useGradesQuery();
  const registerMutation = useStudentRegister();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [gradeError, setGradeError] = useState('');

  function updateField<K extends Exclude<keyof FormState, 'gradeIds'>>(
    field: K,
    value: FormState[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function toggleGrade(gradeId: number) {
    setGradeError('');
    setForm((current) => {
      const exists = current.gradeIds.includes(gradeId);
      return {
        ...current,
        gradeIds: exists
          ? current.gradeIds.filter((id) => id !== gradeId)
          : [...current.gradeIds, gradeId],
      };
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (form.gradeIds.length === 0) {
      setGradeError('Vui lòng chọn ít nhất một khối học.');
      return;
    }

    await registerMutation.mutateAsync({
      fullName: form.fullName,
      phoneNumber: form.phoneNumber,
      parentName: form.parentName || undefined,
      parentNumber: form.parentNumber,
      fbLink: form.fbLink || undefined,
      email: form.email,
      school: form.school || undefined,
      className: form.className || undefined,
      schoolYear: currentSchoolYear,
      gradeIds: form.gradeIds,
    });

    setForm(INITIAL_FORM);
  }

  return (
    <section className="bg-surface-container-low py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col overflow-hidden rounded-3xl bg-white shadow-academic-lg lg:flex-row">
          <div className="flex flex-col justify-center bg-indigo-deep p-12 text-white lg:w-2/5">
            <h2 className="mb-6 text-3xl font-black leading-tight">
              Nhận tư vấn lộ trình học tập miễn phí
            </h2>
            <p className="mb-10 leading-relaxed text-white/80">
              Để lại thông tin, đội ngũ tư vấn sẽ liên hệ với gia đình trong vòng 24 giờ.
            </p>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                  <Phone size={20} />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider opacity-60">Hotline</div>
                  <div className="font-bold">1900 123 456</div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                  <Mail size={20} />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider opacity-60">Email</div>
                  <div className="font-bold">contact@edtechpro.vn</div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-12 lg:w-3/5">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Field label="Họ và tên">
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(event) => updateField('fullName', event.target.value)}
                    required
                    className="w-full rounded-academic border border-on-surface/10 px-4 py-3 outline-none transition-all focus:border-indigo-deep focus:ring-1 focus:ring-indigo-deep"
                  />
                </Field>
                <Field label="Số điện thoại học sinh">
                  <input
                    type="tel"
                    value={form.phoneNumber}
                    onChange={(event) => updateField('phoneNumber', event.target.value)}
                    required
                    className="w-full rounded-academic border border-on-surface/10 px-4 py-3 outline-none transition-all focus:border-indigo-deep focus:ring-1 focus:ring-indigo-deep"
                  />
                </Field>
              </div>

              <Field label="Email">
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  required
                  className="w-full rounded-academic border border-on-surface/10 px-4 py-3 outline-none transition-all focus:border-indigo-deep focus:ring-1 focus:ring-indigo-deep"
                />
              </Field>

              <Field label="Khối học (có thể chọn nhiều)">
                {gradesQuery.isLoading ? (
                  <p className="text-sm font-medium text-on-surface-variant">Đang tải danh sách khối...</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {(gradesQuery.data?.grades ?? []).map((grade) => {
                      const gradeId = grade.id;
                      if (gradeId == null) return null;
                      const isSelected = form.gradeIds.includes(gradeId);
                      return (
                        <label
                          key={gradeId}
                          className={`inline-flex cursor-pointer items-center gap-2 rounded-academic border px-4 py-2 text-sm font-bold transition-all ${
                            isSelected
                              ? 'border-indigo-deep bg-indigo-deep text-white shadow-sm'
                              : 'border-on-surface/10 bg-white text-on-surface hover:border-indigo-deep'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleGrade(gradeId)}
                            className="sr-only"
                          />
                          <span>{grade.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
                {gradeError ? (
                  <p className="text-sm font-bold text-red-600">{gradeError}</p>
                ) : null}
              </Field>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Field label="Tên phụ huynh">
                  <input
                    type="text"
                    value={form.parentName}
                    onChange={(event) => updateField('parentName', event.target.value)}
                    className="w-full rounded-academic border border-on-surface/10 px-4 py-3 outline-none transition-all focus:border-indigo-deep focus:ring-1 focus:ring-indigo-deep"
                  />
                </Field>
                <Field label="Số điện thoại phụ huynh">
                  <input
                    type="tel"
                    value={form.parentNumber}
                    onChange={(event) => updateField('parentNumber', event.target.value)}
                    required
                    className="w-full rounded-academic border border-on-surface/10 px-4 py-3 outline-none transition-all focus:border-indigo-deep focus:ring-1 focus:ring-indigo-deep"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Field label="Trường học">
                  <input
                    type="text"
                    value={form.school}
                    onChange={(event) => updateField('school', event.target.value)}
                    className="w-full rounded-academic border border-on-surface/10 px-4 py-3 outline-none transition-all focus:border-indigo-deep focus:ring-1 focus:ring-indigo-deep"
                  />
                </Field>
                <Field label="Lớp">
                  <input
                    type="text"
                    value={form.className}
                    onChange={(event) => updateField('className', event.target.value)}
                    placeholder="10A1"
                    className="w-full rounded-academic border border-on-surface/10 px-4 py-3 outline-none transition-all focus:border-indigo-deep focus:ring-1 focus:ring-indigo-deep"
                  />
                </Field>
              </div>

              <Field label="Facebook">
                <input
                  type="url"
                  value={form.fbLink}
                  onChange={(event) => updateField('fbLink', event.target.value)}
                  className="w-full rounded-academic border border-on-surface/10 px-4 py-3 outline-none transition-all focus:border-indigo-deep focus:ring-1 focus:ring-indigo-deep"
                />
              </Field>

              {registerMutation.isSuccess && (
                <p className="text-sm font-bold text-growth-green">Đã gửi thông tin tư vấn.</p>
              )}

              <button
                type="submit"
                disabled={registerMutation.isPending}
                className="w-full btn-primary py-4 text-lg font-bold disabled:cursor-not-allowed disabled:opacity-70"
              >
                {registerMutation.isPending ? 'Đang gửi...' : 'Gửi thông tin ngay'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold uppercase text-on-surface-variant">{label}</label>
      {children}
    </div>
  );
}
