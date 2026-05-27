import { type FormEvent, useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Edit3,
  Filter,
  Loader2,
  Plus,
  UserCheck,
  UserX,
  Users,
  X,
} from 'lucide-react';
import {
  useCreateStudent,
  useStudentByStudentIdQuery,
  useStudentsQuery,
  useUpdateStudentByUuid,
  type ResStudentDTO,
} from '@/features/admin';
import { useGradesQuery } from '@/features/curriculum';
import { formatDate } from '@/utils/date';

const currentSchoolYear = new Date().getFullYear();

const cardClass = 'rounded-2xl border border-slate-200/80 bg-white shadow-[0_16px_36px_rgba(15,23,42,0.24)]';
const fieldClass =
  'h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-[14px] font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1870FF] focus:ring-4 focus:ring-[rgba(24,112,255,0.14)]';
const selectClass =
  'h-11 rounded-xl border border-slate-300 bg-white px-3 text-[14px] font-extrabold text-slate-950 outline-none transition focus:border-[#1870FF] focus:ring-4 focus:ring-[rgba(24,112,255,0.14)]';

export default function RegistrationManagement() {
  const [schoolYear, setSchoolYear] = useState(currentSchoolYear);
  const [gradeFilter, setGradeFilter] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [acceptTarget, setAcceptTarget] = useState<ResStudentDTO | null>(null);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);

  const studentsQuery = useStudentsQuery({
    studentStatus: 'WAITING',
    schoolYear,
    page,
    size: 10,
  });
  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudentByUuid();
  const gradesQuery = useGradesQuery();

  const [form, setForm] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
    parentName: '',
    parentNumber: '',
    school: '',
    className: '',
    gradeId: '',
  });

  async function handleCreate(event: FormEvent) {
    event.preventDefault();

    await createStudent.mutateAsync({
      fullName: form.fullName,
      phoneNumber: form.phoneNumber,
      email: form.email,
      parentName: form.parentName || undefined,
      parentNumber: form.parentNumber || undefined,
      school: form.school || undefined,
      className: form.className || undefined,
      studentStatus: 'WAITING',
      schoolYear,
      gradeIds: [Number(form.gradeId)],
    });

    setForm({
      fullName: '',
      phoneNumber: '',
      email: '',
      parentName: '',
      parentNumber: '',
      school: '',
      className: '',
      gradeId: '',
    });
  }

  async function confirmAccept(studentId: string) {
    if (!acceptTarget?.user_uuid) {
      return;
    }
    await updateStudent.mutateAsync({
      userUuid: acceptTarget.user_uuid,
      body: { studentStatus: 'ACTIVE', studentId },
    });
    setAcceptTarget(null);
  }

  async function rejectStudent(userUuid?: string) {
    if (!userUuid) {
      return;
    }
    await updateStudent.mutateAsync({
      userUuid,
      body: { studentStatus: 'INACTIVE' },
    });
  }

  const allStudents = studentsQuery.data?.result ?? [];
  const meta = studentsQuery.data?.meta;
  const totalPages = meta?.totalPages ?? 1;
  const normalizedSearch = search.trim().toLowerCase();
  const gradeFiltered = gradeFilter
    ? allStudents.filter((student) =>
        (student.grades ?? []).some((grade) => grade.id === gradeFilter),
      )
    : allStudents;
  const students = normalizedSearch
    ? gradeFiltered.filter((student) => {
        const haystack = [
          student.user_fullname,
          student.user_email,
          student.user_phone_number,
          student.student_id,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(normalizedSearch);
      })
    : gradeFiltered;

  return (
    <div className="space-y-6">
      <form onSubmit={handleCreate} className={cardClass}>
        <SectionHeader
          icon={Plus}
          title="Tạo nhanh học sinh đăng ký"
          isOpen={isQuickCreateOpen}
          onToggle={() => setIsQuickCreateOpen((current) => !current)}
        />

        {isQuickCreateOpen ? (
          <div className="border-t border-slate-100 p-5 sm:p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Input value={form.fullName} onChange={(value) => setForm({ ...form, fullName: value })} placeholder="Họ tên" required />
              <Input value={form.phoneNumber} onChange={(value) => setForm({ ...form, phoneNumber: value })} placeholder="SĐT" required />
              <Input value={form.email} onChange={(value) => setForm({ ...form, email: value })} placeholder="Email" type="email" required />
              <Input value={form.parentName} onChange={(value) => setForm({ ...form, parentName: value })} placeholder="Tên phụ huynh" />
              <Input value={form.parentNumber} onChange={(value) => setForm({ ...form, parentNumber: value })} placeholder="SĐT phụ huynh" />
              <Input value={form.school} onChange={(value) => setForm({ ...form, school: value })} placeholder="Trường" />
              <Input value={form.className} onChange={(value) => setForm({ ...form, className: value })} placeholder="Lớp nguyện vọng" />
              <select
                value={form.gradeId}
                onChange={(event) => setForm({ ...form, gradeId: event.target.value })}
                required
                className={`${fieldClass} font-extrabold`}
              >
                <option value="">Chọn khối</option>
                {(gradesQuery.data?.grades ?? []).map((grade) => (
                  <option key={grade.id} value={grade.id}>
                    {grade.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-6 flex justify-start">
              <button
                type="submit"
                disabled={createStudent.isPending}
                className="h-11 rounded-xl bg-[#1870FF] px-5 text-[15px] font-extrabold text-white shadow-[0_12px_22px_rgba(24,112,255,0.26)] transition hover:bg-[#0f62e6] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {createStudent.isPending ? 'Đang tạo...' : 'Tạo HS chờ duyệt'}
              </button>
            </div>
          </div>
        ) : null}
      </form>

      <section className={cardClass}>
        <SectionHeader icon={Filter} title="Bộ lọc" />

        <div className="border-t border-slate-100 p-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:max-w-5xl">
            <label className="space-y-2">
              <span className="text-[13px] font-bold text-slate-600">Năm</span>
              <select
                value={schoolYear}
                onChange={(event) => {
                  setSchoolYear(Number(event.target.value));
                  setPage(1);
                }}
                className={`${selectClass} w-full`}
              >
                {[currentSchoolYear - 1, currentSchoolYear, currentSchoolYear + 1].map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-[13px] font-bold text-slate-600">Khối</span>
              <select
                value={gradeFilter ?? ''}
                onChange={(event) => {
                  const value = event.target.value;
                  setGradeFilter(value === '' ? null : Number(value));
                }}
                className={`${selectClass} w-full`}
              >
                <option value="">Tất cả</option>
                {(gradesQuery.data?.grades ?? []).map((grade) => (
                  <option key={grade.id} value={grade.id}>
                    {grade.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className="text-[13px] font-bold text-slate-600">Tìm theo tên / email / SĐT</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nhập từ khoá…"
                className={fieldClass}
              />
            </label>
          </div>
        </div>
      </section>

      <section className={cardClass}>
        <SectionHeader
          icon={Users}
          title="Học sinh chờ duyệt"
          trailing={`${meta?.totalItems ?? 0} HS`}
        />

        <div className="border-t border-slate-100">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left">
              <thead className="bg-slate-50/80 text-[12px] font-extrabold uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-4">Học sinh</th>
                  <th className="px-6 py-4">Liên hệ</th>
                  <th className="px-6 py-4">Khối nguyện vọng</th>
                  <th className="px-6 py-4">Ngày đăng ký</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => (
                  <tr key={student.user_uuid} className="h-[80px] transition hover:bg-slate-50/70">
                    <td className="px-6 py-4">
                      <p className="text-[16px] font-extrabold text-slate-950">{student.user_fullname}</p>
                      <p className="mt-1 text-[12px] font-medium text-slate-500">
                        {student.student_id ? `${student.student_id} · ` : ''}
                        {student.school ?? '—'}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-[14px] font-medium text-slate-900">
                      <p>{student.user_phone_number ?? '—'}</p>
                      <p className="text-[12px] text-slate-500">{student.user_email ?? '—'}</p>
                    </td>
                    <td className="px-6 py-4 text-[14px] font-medium text-slate-900">
                      {student.grades?.map((grade) => grade.name).join(', ') || '-'}
                    </td>
                    <td className="px-6 py-4 text-[14px] font-medium text-slate-900">
                      {formatDate(student.student_first_enroll_date)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setAcceptTarget(student)}
                          disabled={updateStudent.isPending}
                          className="flex h-9 items-center gap-1.5 rounded-xl bg-emerald-500 px-3 text-[13px] font-extrabold text-white shadow-sm transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <UserCheck size={15} />
                          Nhận vào lớp
                        </button>
                        <button
                          type="button"
                          onClick={() => rejectStudent(student.user_uuid)}
                          disabled={updateStudent.isPending}
                          className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-300 px-3 text-[13px] font-extrabold text-slate-600 transition hover:border-rose-400 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <UserX size={15} />
                          Từ chối
                        </button>
                        <button
                          type="button"
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-300 text-slate-500 transition hover:border-[#1870FF] hover:text-[#1870FF]"
                          aria-label="Sửa thông tin (sẽ làm sau)"
                          disabled
                        >
                          <Edit3 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {students.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-[14px] font-semibold text-slate-500">
                      {normalizedSearch
                        ? 'Không tìm thấy học sinh khớp từ khoá.'
                        : 'Chưa có học sinh đăng ký chờ duyệt.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-4 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-[14px] font-extrabold text-slate-500">
              Trang {meta?.page ?? page}/{totalPages} · {meta?.totalItems ?? 0} HS chờ duyệt
            </p>
            <div className="flex items-center gap-6">
              <button
                onClick={() => setPage((current) => Math.max(current - 1, 1))}
                disabled={page <= 1}
                className="text-[14px] font-extrabold text-slate-950 transition hover:text-[#1870FF] disabled:cursor-not-allowed disabled:text-slate-400"
              >
                Trước
              </button>
              <button
                onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
                disabled={page >= totalPages}
                className="text-[14px] font-extrabold text-slate-950 transition hover:text-[#1870FF] disabled:cursor-not-allowed disabled:text-slate-400"
              >
                Sau
              </button>
            </div>
          </div>
        </div>
      </section>

      {acceptTarget ? (
        <AcceptStudentModal
          student={acceptTarget}
          schoolYear={schoolYear}
          isSubmitting={updateStudent.isPending}
          onCancel={() => setAcceptTarget(null)}
          onConfirm={confirmAccept}
        />
      ) : null}
    </div>
  );
}

function AcceptStudentModal({
  student,
  schoolYear,
  isSubmitting,
  onCancel,
  onConfirm,
}: {
  student: ResStudentDTO;
  schoolYear: number;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: (studentId: string) => void;
}) {
  const [studentId, setStudentId] = useState('');
  const [debouncedSid, setDebouncedSid] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedSid(studentId.trim()), 400);
    return () => window.clearTimeout(handle);
  }, [studentId]);

  const duplicateQuery = useStudentByStudentIdQuery(debouncedSid || undefined, schoolYear);
  const isCheckingDuplicate =
    debouncedSid.length > 0 && (duplicateQuery.isLoading || duplicateQuery.isFetching);
  const existingStudent =
    !duplicateQuery.isError && duplicateQuery.data && duplicateQuery.data.user_uuid !== student.user_uuid
      ? duplicateQuery.data
      : null;
  const isDuplicate = Boolean(existingStudent);
  const isSidAvailable =
    debouncedSid.length > 0 && !isCheckingDuplicate && !isDuplicate && duplicateQuery.isError;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = studentId.trim();
    if (!trimmed) {
      setError('Vui lòng nhập mã học sinh (SID).');
      return;
    }
    if (isCheckingDuplicate) {
      setError('Đang kiểm tra SID, vui lòng chờ...');
      return;
    }
    if (isDuplicate) {
      setError('Mã SID đã được dùng trong năm học này.');
      return;
    }
    setError('');
    onConfirm(trimmed);
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-slate-400">Duyệt học sinh</p>
            <h3 className="mt-1 truncate text-[20px] font-extrabold leading-tight text-slate-950">
              {student.user_fullname ?? '—'}
            </h3>
            <p className="mt-1 text-[13px] font-medium text-slate-500">
              {student.user_email} · {student.user_phone_number ?? '—'}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        <label className="block space-y-2">
          <span className="text-[13px] font-bold text-slate-600">
            Mã học sinh (SID) <span className="text-rose-500">*</span>
            <span className="ml-1 text-slate-400 font-medium">· Năm học {schoolYear}</span>
          </span>
          <input
            type="text"
            value={studentId}
            onChange={(event) => setStudentId(event.target.value)}
            placeholder="Ví dụ: 00010"
            autoFocus
            aria-invalid={isDuplicate}
            className={`${fieldClass} ${
              isDuplicate
                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-100'
                : isSidAvailable
                  ? 'border-emerald-400 focus:border-emerald-500 focus:ring-emerald-100'
                  : ''
            }`}
          />
          {isCheckingDuplicate ? (
            <p className="flex items-center gap-1.5 text-[12px] font-medium text-slate-500">
              <Loader2 size={13} className="animate-spin" />
              Đang kiểm tra SID...
            </p>
          ) : isDuplicate && existingStudent ? (
            <p className="flex items-center gap-1.5 text-[12px] font-semibold text-rose-600">
              <AlertCircle size={13} />
              SID đã thuộc về <strong>{existingStudent.user_fullname ?? '—'}</strong> trong năm {schoolYear}.
            </p>
          ) : isSidAvailable ? (
            <p className="flex items-center gap-1.5 text-[12px] font-semibold text-emerald-600">
              <CheckCircle2 size={13} />
              SID khả dụng.
            </p>
          ) : null}
          {error ? <p className="text-[13px] font-semibold text-rose-600">{error}</p> : null}
        </label>

        <p className="mt-3 text-[12px] font-medium text-slate-500">
          Sau khi xác nhận, học sinh sẽ chuyển sang trạng thái <strong>ACTIVE</strong> với mã SID vừa nhập.
        </p>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="h-11 rounded-xl border border-slate-300 px-4 text-[14px] font-extrabold text-slate-600 transition hover:bg-slate-50"
          >
            Huỷ
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isCheckingDuplicate || isDuplicate}
            className="h-11 rounded-xl bg-emerald-500 px-4 text-[14px] font-extrabold text-white shadow-[0_12px_22px_rgba(16,185,129,0.28)] transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Đang lưu…' : 'Nhận vào lớp'}
          </button>
        </div>
      </form>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  trailing,
  isOpen,
  onToggle,
}: {
  icon: typeof Plus;
  title: string;
  trailing?: string;
  isOpen?: boolean;
  onToggle?: () => void;
}) {
  const content = (
    <>
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(24,112,255,0.1)] text-[#1870FF]">
          <Icon size={19} strokeWidth={2.6} />
        </span>
        <h2 className="text-[18px] font-extrabold leading-tight text-slate-950">{title}</h2>
      </div>
      {trailing ? (
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-[12px] font-extrabold text-slate-600">
          {trailing}
        </span>
      ) : null}
      {onToggle ? (
        <ChevronDown
          size={20}
          className={`text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      ) : null}
    </>
  );

  if (onToggle) {
    return (
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full flex-col gap-3 p-5 text-left transition hover:bg-slate-50/70 sm:flex-row sm:items-center sm:justify-between sm:p-6"
      >
        {content}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      {content}
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      required={required}
      className={fieldClass}
    />
  );
}
