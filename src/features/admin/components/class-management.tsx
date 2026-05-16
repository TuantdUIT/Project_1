import { useEffect, useMemo, useState } from 'react';
import { Eye, GraduationCap, Mail, User, Users, X } from 'lucide-react';
import {
  useStudentByStudentIdQuery,
  useStudentsQuery,
  useUpdateStudentByUuid,
  type ResStudentDTO,
} from '@/features/admin';
import { useGradesQuery } from '@/features/curriculum';

const currentSchoolYear = new Date().getFullYear();

const cardClass = 'rounded-2xl border border-slate-200/80 bg-white shadow-[0_16px_36px_rgba(15,23,42,0.24)]';
const fieldClass =
  'h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-[14px] font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1870FF] focus:ring-4 focus:ring-[rgba(24,112,255,0.14)]';
const selectClass =
  'h-11 rounded-xl border border-slate-300 bg-white px-3 text-[14px] font-extrabold text-slate-950 outline-none transition focus:border-[#1870FF] focus:ring-4 focus:ring-[rgba(24,112,255,0.14)]';

const UNASSIGNED_GRADE_KEY = '__unassigned__';

type GradeGroup = {
  key: string;
  gradeId: number | null;
  label: string;
  students: ResStudentDTO[];
};

export default function ClassManagement() {
  const [schoolYear, setSchoolYear] = useState(currentSchoolYear);
  const [selectedGroupKey, setSelectedGroupKey] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [detailTarget, setDetailTarget] = useState<{ studentId?: string; schoolYear?: number; fallback: ResStudentDTO } | null>(null);

  const studentsQuery = useStudentsQuery({
    studentStatus: 'ACTIVE',
    schoolYear,
    page,
    size: 100,
  });
  const gradesQuery = useGradesQuery();

  const allStudents = studentsQuery.data?.result ?? [];

  const groups: GradeGroup[] = useMemo(() => {
    const map = new Map<string, GradeGroup>();

    for (const student of allStudents) {
      const primaryGrade = student.grades?.[0];
      const key = primaryGrade?.id != null ? `g-${primaryGrade.id}` : UNASSIGNED_GRADE_KEY;
      const label = primaryGrade?.name ?? 'Chưa xếp khối';
      const gradeId = primaryGrade?.id ?? null;

      const existing = map.get(key);
      if (existing) {
        existing.students.push(student);
      } else {
        map.set(key, { key, gradeId, label, students: [student] });
      }
    }

    return Array.from(map.values()).sort((a, b) => {
      if (a.key === UNASSIGNED_GRADE_KEY) {
        return 1;
      }
      if (b.key === UNASSIGNED_GRADE_KEY) {
        return -1;
      }
      return (a.gradeId ?? 0) - (b.gradeId ?? 0);
    });
  }, [allStudents]);

  const normalizedSearch = search.trim().toLowerCase();
  const displayed = selectedGroupKey
    ? (groups.find((group) => group.key === selectedGroupKey)?.students ?? [])
    : allStudents;
  const filteredStudents = normalizedSearch
    ? displayed.filter((student) => {
        const haystack = [
          student.user_fullname,
          student.user_email,
          student.user_phone_number,
          student.student_id,
          student.student_class,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(normalizedSearch);
      })
    : displayed;

  const selectedGroupLabel = selectedGroupKey
    ? (groups.find((group) => group.key === selectedGroupKey)?.label ?? '')
    : 'Tất cả các khối';

  return (
    <div className="space-y-6">
      <section className={cardClass}>
        <SectionHeader icon={GraduationCap} title="Tổng quan các khối" />
        <div className="border-t border-slate-100 p-5 sm:p-6">
          {groups.length === 0 ? (
            <p className="py-6 text-center text-[14px] font-semibold text-slate-500">
              {studentsQuery.isLoading ? 'Đang tải…' : 'Chưa có học sinh đang học.'}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              <GradeCard
                variant="total"
                label="Tất cả"
                count={allStudents.length}
                active={selectedGroupKey === null}
                onClick={() => setSelectedGroupKey(null)}
              />
              {groups.map((group) => (
                <GradeCard
                  key={group.key}
                  variant="grade"
                  label={group.label}
                  count={group.students.length}
                  active={selectedGroupKey === group.key}
                  onClick={() => setSelectedGroupKey(group.key)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className={cardClass}>
        <SectionHeader icon={Users} title={`Danh sách HS · ${selectedGroupLabel}`} trailing={`${filteredStudents.length} HS`} />
        <div className="border-t border-slate-100 p-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:max-w-4xl">
            <label className="space-y-2">
              <span className="text-[13px] font-bold text-slate-600">Năm</span>
              <select
                value={schoolYear}
                onChange={(event) => {
                  setSchoolYear(Number(event.target.value));
                  setPage(1);
                  setSelectedGroupKey(null);
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
                value={
                  selectedGroupKey === null
                    ? ''
                    : selectedGroupKey === UNASSIGNED_GRADE_KEY
                      ? UNASSIGNED_GRADE_KEY
                      : (groups.find((group) => group.key === selectedGroupKey)?.gradeId ?? '')
                }
                onChange={(event) => {
                  const value = event.target.value;
                  if (value === '') {
                    setSelectedGroupKey(null);
                  } else if (value === UNASSIGNED_GRADE_KEY) {
                    setSelectedGroupKey(UNASSIGNED_GRADE_KEY);
                  } else {
                    setSelectedGroupKey(`g-${value}`);
                  }
                }}
                className={`${selectClass} w-full`}
              >
                <option value="">Tất cả</option>
                {(gradesQuery.data ?? []).map((grade) => (
                  <option key={grade.id} value={grade.id}>
                    {grade.name}
                  </option>
                ))}
                {groups.some((group) => group.key === UNASSIGNED_GRADE_KEY) ? (
                  <option value={UNASSIGNED_GRADE_KEY}>Chưa xếp khối</option>
                ) : null}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-[13px] font-bold text-slate-600">Tìm theo tên / SĐT / email / lớp</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nhập từ khoá…"
                className={fieldClass}
              />
            </label>
          </div>
        </div>

        <div className="border-t border-slate-100 overflow-x-auto">
          <table className="w-full min-w-[920px] text-left">
            <thead className="bg-slate-50/80 text-[12px] font-extrabold uppercase text-slate-500">
              <tr>
                <th className="px-6 py-4">Học sinh</th>
                <th className="px-6 py-4">Khối</th>
                <th className="px-6 py-4">Lớp</th>
                <th className="px-6 py-4">Trường</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((student) => (
                <tr key={student.user_uuid} className="h-[78px] transition hover:bg-slate-50/70">
                  <td className="px-6 py-4">
                    <p className="text-[16px] font-extrabold text-slate-950">{student.user_fullname}</p>
                    <p className="mt-1 text-[12px] font-medium text-slate-500">
                      {student.student_id ? `${student.student_id} · ` : ''}
                      {student.user_email}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-[14px] font-medium text-slate-900">
                    {student.grades?.map((grade) => grade.name).join(', ') || '—'}
                  </td>
                  <td className="px-6 py-4 text-[14px] font-medium text-slate-900">{student.student_class ?? '—'}</td>
                  <td className="px-6 py-4 text-[14px] font-medium text-slate-900">{student.school ?? '—'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setDetailTarget({
                            studentId: student.student_id,
                            schoolYear: student.school_year,
                            fallback: student,
                          })
                        }
                        className="flex h-9 items-center gap-1.5 rounded-xl border border-[#1870FF] px-3 text-[13px] font-extrabold text-[#1870FF] transition hover:bg-[rgba(24,112,255,0.08)]"
                      >
                        <Eye size={15} />
                        Xem chi tiết
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[14px] font-semibold text-slate-500">
                    {studentsQuery.isLoading
                      ? 'Đang tải…'
                      : normalizedSearch
                        ? 'Không tìm thấy học sinh khớp từ khoá.'
                        : 'Không có học sinh trong nhóm này.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {detailTarget ? (
        <StudentDetailModal
          studentId={detailTarget.studentId}
          schoolYear={detailTarget.schoolYear}
          fallback={detailTarget.fallback}
          onClose={() => setDetailTarget(null)}
        />
      ) : null}
    </div>
  );
}

function StudentDetailModal({
  studentId,
  schoolYear,
  fallback,
  onClose,
}: {
  studentId?: string;
  schoolYear?: number;
  fallback: ResStudentDTO;
  onClose: () => void;
}) {
  const detailQuery = useStudentByStudentIdQuery(studentId, schoolYear);
  const student = detailQuery.data ?? fallback;
  const isLoading = detailQuery.isLoading;
  const isError = detailQuery.isError;
  const updateStudent = useUpdateStudentByUuid();

  const originals = useMemo(
    () => ({
      fullName: student.user_fullname ?? '',
      studentId: student.student_id ?? '',
      schoolYear: student.school_year != null ? String(student.school_year) : '',
      school: student.school ?? '',
      className: student.student_class ?? '',
      email: student.user_email ?? '',
      phoneNumber: student.user_phone_number ?? '',
      fbLink: student.fb_link ?? '',
      parentName: student.parent_name ?? '',
      parentNumber: student.parent_number ?? '',
    }),
    [student],
  );

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(originals);

  useEffect(() => {
    setForm(originals);
  }, [originals]);

  const isDirty = (Object.keys(originals) as Array<keyof typeof originals>).some(
    (key) => form[key] !== originals[key],
  );

  const yearValue =
    student.school_year != null
      ? String(student.school_year)
      : schoolYear != null
        ? String(schoolYear)
        : undefined;

  const gradeLabel = student.grades?.map((grade) => grade.name).filter(Boolean).join(', ');
  const classGradeValue = student.student_class && gradeLabel
    ? `${student.student_class} (${gradeLabel})`
    : student.student_class || gradeLabel || undefined;

  const debtValue = student.debt != null ? String(student.debt) : undefined;

  function updateField<K extends keyof typeof originals>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleApply() {
    if (!student.user_uuid || !isDirty) {
      return;
    }
    const trimmedYear = form.schoolYear.trim();
    const parsedYear = trimmedYear ? Number(trimmedYear) : Number.NaN;
    await updateStudent.mutateAsync({
      userUuid: student.user_uuid,
      body: {
        fullName: form.fullName.trim() || undefined,
        studentId: form.studentId.trim() || undefined,
        schoolYear: Number.isFinite(parsedYear) ? parsedYear : undefined,
        school: form.school.trim() || undefined,
        className: form.className.trim() || undefined,
        email: form.email.trim() || undefined,
        phoneNumber: form.phoneNumber.trim() || undefined,
        fbLink: form.fbLink.trim() || undefined,
        parentName: form.parentName.trim() || undefined,
        parentNumber: form.parentNumber.trim() || undefined,
      },
    });
    setIsEditing(false);
  }

  function toggleEditing() {
    if (isEditing) {
      setForm(originals);
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4 py-6">
      <div className="flex w-full max-w-2xl max-h-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 p-6">
          <div className="min-w-0">
            <p className="text-[12px] font-extrabold uppercase tracking-[0.16em] text-[#1870FF]">Học sinh</p>
            {isEditing ? (
              <input
                type="text"
                value={form.fullName}
                onChange={(event) => updateField('fullName', event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1 text-[28px] font-extrabold leading-tight text-slate-950 outline-none transition focus:border-[#1870FF] focus:ring-4 focus:ring-[rgba(24,112,255,0.14)]"
                placeholder="Họ và tên học sinh"
              />
            ) : (
              <h3 className="mt-1 truncate text-[28px] font-extrabold leading-tight text-slate-950">
                {student.user_fullname ?? '—'}
              </h3>
            )}
            <div className="mt-3">
              <StatusBadge status={student.student_status} />
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
          {isLoading || isError ? (
            <div className="px-6 pb-2">
              {isLoading ? (
                <p className="text-[13px] font-semibold text-slate-500">Đang tải chi tiết học sinh…</p>
              ) : null}
              {isError ? (
                <p className="text-[13px] font-semibold text-rose-600">
                  Không lấy được chi tiết từ server. Đang hiển thị thông tin tóm tắt từ danh sách.
                </p>
              ) : null}
            </div>
          ) : null}

          <DetailSection icon={User} title="Thông tin học sinh">
            <DetailGrid>
              <EditableRow
                label="Mã học sinh (SID)"
                value={isEditing ? form.studentId : student.student_id}
                editing={isEditing}
                onChange={(next) => updateField('studentId', next)}
              />
              <EditableRow
                label="Năm học"
                value={isEditing ? form.schoolYear : yearValue}
                editing={isEditing}
                onChange={(next) => updateField('schoolYear', next.replace(/\D/g, ''))}
                type="number"
              />
              <EditableRow
                label="Trường"
                value={isEditing ? form.school : student.school}
                editing={isEditing}
                onChange={(next) => updateField('school', next)}
              />
              <EditableRow
                label={isEditing && gradeLabel ? `Lớp (Khối ${gradeLabel})` : 'Lớp / Khối'}
                value={isEditing ? form.className : classGradeValue}
                editing={isEditing}
                onChange={(next) => updateField('className', next)}
              />
              <DetailRow label="Ngày nhập học" value={student.student_first_enroll_date} />
              <DetailRow label="Công nợ" value={debtValue} />
            </DetailGrid>
          </DetailSection>

          <DetailSection icon={Mail} title="Liên hệ & mạng xã hội">
            <DetailGrid>
              <EditableRow
                label="Email"
                value={isEditing ? form.email : student.user_email}
                editing={isEditing}
                onChange={(next) => updateField('email', next)}
                type="email"
              />
              <EditableRow
                label="Số điện thoại"
                value={isEditing ? form.phoneNumber : student.user_phone_number}
                editing={isEditing}
                onChange={(next) => updateField('phoneNumber', next)}
                type="tel"
              />
            </DetailGrid>
            <div className="mt-4">
              <EditableRow
                label="Facebook profile"
                value={isEditing ? form.fbLink : student.fb_link}
                editing={isEditing}
                onChange={(next) => updateField('fbLink', next)}
                type="url"
              />
            </div>
          </DetailSection>

          <div className="bg-slate-50">
            <DetailSection icon={Users} title="Thông tin phụ huynh">
              <DetailGrid>
                <EditableRow
                  label="Tên phụ huynh"
                  value={isEditing ? form.parentName : student.parent_name}
                  editing={isEditing}
                  onChange={(next) => updateField('parentName', next)}
                />
                <EditableRow
                  label="SĐT phụ huynh"
                  value={isEditing ? form.parentNumber : student.parent_number}
                  editing={isEditing}
                  onChange={(next) => updateField('parentNumber', next)}
                  type="tel"
                />
              </DetailGrid>
            </DetailSection>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 p-4">
          <button
            type="button"
            onClick={toggleEditing}
            disabled={updateStudent.isPending}
            className="h-11 rounded-xl bg-slate-100 px-5 text-[14px] font-extrabold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isEditing ? 'Hủy' : 'Chỉnh sửa'}
          </button>
          <button
            type="button"
            disabled={updateStudent.isPending || isEditing}
            className="h-11 rounded-xl bg-rose-50 px-5 text-[14px] font-extrabold text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Xóa
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={!isDirty || updateStudent.isPending}
            className="h-11 rounded-xl bg-[#1870FF] px-5 text-[14px] font-extrabold text-white shadow-[0_12px_22px_rgba(24,112,255,0.26)] transition hover:bg-[#0f62e6] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none"
          >
            {updateStudent.isPending ? 'Đang lưu…' : 'Áp dụng'}
          </button>
        </div>
      </div>
    </div>
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

function StatusBadge({ status }: { status?: string }) {
  const styles =
    status === 'ACTIVE'
      ? { dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700' }
      : status === 'WAITING'
        ? { dot: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700' }
        : { dot: 'bg-slate-400', bg: 'bg-slate-100', text: 'text-slate-600' };

  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 ${styles.bg}`}>
      <span className={`h-2 w-2 rounded-full ${styles.dot}`} />
      <span className={`text-[12px] font-extrabold uppercase tracking-[0.08em] ${styles.text}`}>
        {status ?? '—'}
      </span>
    </span>
  );
}

function EditableRow({
  label,
  value,
  editing,
  onChange,
  type = 'text',
}: {
  label: string;
  value?: string | null;
  editing: boolean;
  onChange: (next: string) => void;
  type?: string;
}) {
  return (
    <div>
      <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p>
      {editing ? (
        <input
          type={type}
          value={value ?? ''}
          onChange={(event) => onChange(event.target.value)}
          className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-[14px] font-extrabold text-slate-950 outline-none transition focus:border-[#1870FF] focus:ring-4 focus:ring-[rgba(24,112,255,0.14)]"
        />
      ) : (
        <p className="mt-1 break-words text-[14px] font-extrabold text-slate-950">{value || '—'}</p>
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

function GradeCard({
  variant,
  label,
  count,
  active,
  onClick,
}: {
  variant: 'total' | 'grade';
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  const isTotal = variant === 'total';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition ${
        active
          ? 'border-[#1870FF] bg-[#1870FF] text-white shadow-[0_14px_24px_rgba(24,112,255,0.24)]'
          : isTotal
            ? 'border-slate-300 bg-slate-50 text-slate-900 hover:border-[#1870FF] hover:bg-white'
            : 'border-slate-200 bg-white text-slate-900 hover:border-[#1870FF] hover:bg-[rgba(24,112,255,0.04)]'
      }`}
    >
      {isTotal ? (
        <p className="text-[24px] font-extrabold leading-tight">{label}</p>
      ) : (
        <>
          <p className={`text-[12px] font-bold uppercase tracking-[0.12em] ${active ? 'text-white/80' : 'text-slate-500'}`}>
            Khối
          </p>
          <p className="mt-1 text-[16px] font-extrabold">{label}</p>
        </>
      )}
      <p
        className={`text-[24px] font-black ${isTotal ? 'mt-2' : 'mt-3'} ${
          active ? 'text-white' : 'text-slate-900'
        }`}
      >
        {count}
      </p>
      <p className={`text-[12px] font-semibold ${active ? 'text-white/80' : 'text-slate-500'}`}>học sinh</p>
    </button>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  trailing,
}: {
  icon: typeof Users;
  title: string;
  trailing?: string;
}) {
  return (
    <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
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
    </div>
  );
}
