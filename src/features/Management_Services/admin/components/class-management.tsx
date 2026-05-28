import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { ArrowLeft, Eye, GraduationCap, Mail, User, Users } from 'lucide-react';
import {
  useStudentByUuidQuery,
  useStudentsQuery,
  useUpdateStudentByUuid,
  type ResStudentDTO,
} from '@/features/Management_Services/admin';
import { paths } from '@/config/paths';
import { useGradesQuery } from '@/features/Management_Services/curriculum';
import { formatDate } from '@/utils/date';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';
import StudentPeriodsSection from './student-periods-section';

const currentSchoolYear = new Date().getFullYear();

const cardClass = 'rounded-2xl border border-slate-200/80 bg-white shadow-[0_16px_36px_rgba(15,23,42,0.24)]';
const fieldClass =
  'h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-[14px] font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1870FF] focus:ring-4 focus:ring-[rgba(24,112,255,0.14)]';
const selectClass =
  'h-11 rounded-xl border border-slate-300 bg-white px-3 text-[14px] font-extrabold text-slate-950 outline-none transition focus:border-[#1870FF] focus:ring-4 focus:ring-[rgba(24,112,255,0.14)]';

const studentDetailTabs = ['Tổng quan', 'Điểm số', 'Học phí', 'Bài tập'] as const;

type StudentDetailTab = (typeof studentDetailTabs)[number];

type GradeGroup = {
  key: string;
  gradeId: number | null;
  label: string;
  count: number;
};

export default function ClassManagement() {
  const { userUuid } = useParams();

  if (userUuid) {
    return <StudentDetailPanel userUuid={userUuid} />;
  }

  return <ClassListPanel />;
}

function ClassListPanel() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const schoolYear = Number(searchParams.get('year') ?? currentSchoolYear);
  const selectedGroupKey = searchParams.get('group');
  const search = searchParams.get('q') ?? '';
  const page = Math.max(Number(searchParams.get('page') ?? 1), 1);

  const studentsQuery = useStudentsQuery({
    studentStatus: 'ACTIVE',
    schoolYear,
    page,
    size: DEFAULT_PAGE_SIZE,
  });
  const gradesQuery = useGradesQuery();

  function updateListParams(updates: Record<string, string | number | null>) {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '') {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
      });

      return next;
    });
  }

  const currentPageStudents = studentsQuery.data?.result ?? [];
  const studentsMeta = studentsQuery.data?.meta;
  const totalPages = Math.max(studentsMeta?.totalPages ?? 1, 1);

  const groups: GradeGroup[] = useMemo(() => {
    return (gradesQuery.data?.grades ?? [])
      .map((grade) => ({
        key: `g-${grade.id}`,
        gradeId: grade.id ?? null,
        label: grade.name ?? 'Khối',
        count: grade.studentsInPeriodCount ?? 0,
      }))
      .sort((a, b) => (a.gradeId ?? 0) - (b.gradeId ?? 0));
  }, [gradesQuery.data?.grades]);

  const normalizedSearch = search.trim().toLowerCase();
  const selectedGroup = selectedGroupKey
    ? groups.find((group) => group.key === selectedGroupKey)
    : undefined;
  const displayed = selectedGroupKey
    ? currentPageStudents.filter((student) =>
        (student.grades ?? []).some((grade) => grade.id === selectedGroup?.gradeId),
      )
    : currentPageStudents;
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
    ? (selectedGroup?.label ?? '')
    : 'Tất cả các khối';

  return (
    <div className="space-y-6">
      <section className={cardClass}>
        <SectionHeader icon={GraduationCap} title="Tổng quan các khối" />
        <div className="border-t border-slate-100 p-5 sm:p-6">
          {groups.length === 0 ? (
            <p className="py-6 text-center text-[14px] font-semibold text-slate-500">
              {gradesQuery.isLoading ? 'Đang tải...' : 'Chưa có dữ liệu khối.'}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              <GradeCard
                variant="total"
                label="Tất cả"
                count={gradesQuery.data?.totalActiveStudents ?? 0}
                active={selectedGroupKey === null}
                onClick={() => updateListParams({ group: null, page: 1 })}
              />
              {groups.map((group) => (
                <GradeCard
                  key={group.key}
                  variant="grade"
                  label={group.label}
                  count={group.count}
                  active={selectedGroupKey === group.key}
                  onClick={() => updateListParams({ group: group.key, page: 1 })}
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
                onChange={(event) => updateListParams({ year: Number(event.target.value), page: 1, group: null })}
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
                    : (selectedGroup?.gradeId ?? '')
                }
                onChange={(event) => {
                  const value = event.target.value;
                  if (value === '') {
                    updateListParams({ group: null, page: 1 });
                  } else {
                    updateListParams({ group: `g-${value}`, page: 1 });
                  }
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

            <label className="space-y-2">
              <span className="text-[13px] font-bold text-slate-600">Tìm theo tên / SĐT / email / lớp</span>
              <input
                value={search}
                onChange={(event) => updateListParams({ q: event.target.value, page: 1 })}
                placeholder="Nhập từ khóa..."
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
                        onClick={() => {
                          if (student.user_uuid) {
                            const query = searchParams.toString();
                            navigate(`${paths.adminPortalClassDetail(student.user_uuid)}${query ? `?${query}` : ''}`);
                          }
                        }}
                        disabled={!student.user_uuid}
                        className="flex h-9 items-center gap-1.5 rounded-xl border border-[#1870FF] px-3 text-[13px] font-extrabold text-[#1870FF] transition hover:bg-[rgba(24,112,255,0.08)] disabled:cursor-not-allowed disabled:opacity-60"
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
                      ? 'Đang tải...'
                      : normalizedSearch
                        ? 'Không tìm thấy học sinh khớp từ khóa.'
                        : 'Không có học sinh trong nhóm này.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-4 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-[14px] font-extrabold text-slate-500">
            Trang {page}/{totalPages} · {studentsMeta?.totalItems ?? 0} HS đang học
          </p>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => updateListParams({ page: Math.max(page - 1, 1) })}
              disabled={page <= 1}
              className="text-[14px] font-extrabold text-slate-950 transition hover:text-[#1870FF] disabled:cursor-not-allowed disabled:text-slate-400"
            >
              Trước
            </button>
            <button
              type="button"
              onClick={() => updateListParams({ page: Math.min(page + 1, totalPages) })}
              disabled={page >= totalPages}
              className="text-[14px] font-extrabold text-slate-950 transition hover:text-[#1870FF] disabled:cursor-not-allowed disabled:text-slate-400"
            >
              Sau
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function StudentDetailPanel({ userUuid }: { userUuid: string }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const detailQuery = useStudentByUuidQuery(userUuid);
  const student = detailQuery.data;
  const updateStudent = useUpdateStudentByUuid();
  const [activeTab, setActiveTab] = useState<StudentDetailTab>('Tổng quan');

  const originals = useMemo(
    () => ({
      fullName: student?.user_fullname ?? '',
      studentId: student?.student_id ?? '',
      schoolYear: student?.school_year != null ? String(student.school_year) : '',
      school: student?.school ?? '',
      className: student?.student_class ?? '',
      email: student?.user_email ?? '',
      phoneNumber: student?.user_phone_number ?? '',
      fbLink: student?.fb_link ?? '',
      parentName: student?.parent_name ?? '',
      parentNumber: student?.parent_number ?? '',
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

  function goBackToList() {
    const query = searchParams.toString();
    navigate(`${paths.adminPortalClasses}${query ? `?${query}` : ''}`);
  }

  function updateField<K extends keyof typeof originals>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleApply() {
    if (!student?.user_uuid || !isDirty) {
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
      setActiveTab('Tổng quan');
      setIsEditing(true);
    }
  }

  if (detailQuery.isLoading) {
    return <StudentDetailSkeleton onBack={goBackToList} />;
  }

  if (detailQuery.isError || !student) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-[0_16px_36px_rgba(15,23,42,0.18)]">
        <p className="text-[20px] font-extrabold text-slate-950">Không tìm thấy học sinh</p>
        <p className="mt-2 text-[14px] font-semibold text-slate-500">
          Dữ liệu chi tiết không sẵn sàng hoặc học sinh đã bị xóa.
        </p>
        <button
          type="button"
          onClick={goBackToList}
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-[#1870FF] px-5 text-[14px] font-extrabold text-white transition hover:bg-[#0f62e6]"
        >
          <ArrowLeft size={17} />
          Quay lại lớp học
        </button>
      </div>
    );
  }

  const gradeLabel = student.grades?.map((grade) => grade.name).filter(Boolean).join(', ');
  const classGradeValue = student.student_class && gradeLabel
    ? `${student.student_class} (${gradeLabel})`
    : student.student_class || gradeLabel || undefined;

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-[0_12px_30px_rgba(15,23,42,0.16)] backdrop-blur sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <button
              type="button"
              onClick={goBackToList}
              className="mb-3 inline-flex items-center gap-2 text-[13px] font-extrabold text-slate-500 transition hover:text-[#1870FF]"
            >
              <ArrowLeft size={16} />
              Quay lại lớp học
            </button>
            {isEditing ? (
              <input
                type="text"
                value={form.fullName}
                onChange={(event) => updateField('fullName', event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1 text-[28px] font-extrabold leading-tight text-slate-950 outline-none transition focus:border-[#1870FF] focus:ring-4 focus:ring-[rgba(24,112,255,0.14)]"
                placeholder="Họ và tên học sinh"
              />
            ) : (
              <h2 className="truncate text-[28px] font-extrabold leading-tight text-slate-950">
                {student.user_fullname ?? '—'}
              </h2>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <StatusBadge status={student.student_status} />
              <span className="text-[13px] font-semibold text-slate-500">
                {student.student_id ? `${student.student_id} · ` : ''}
                {student.user_email ?? '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-slate-200">
        <div className="flex gap-8 overflow-x-auto">
          {studentDetailTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`relative h-12 whitespace-nowrap text-[14px] font-extrabold transition ${
                activeTab === tab ? 'text-[#1870FF]' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab}
              {activeTab === tab ? (
                <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[#1870FF]" />
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'Tổng quan' ? (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
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
                  value={isEditing ? form.schoolYear : String(student.school_year ?? '')}
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
                <DetailRow label="Ngày nhập học" value={formatDate(student.student_first_enroll_date)} />
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

          <OverviewActions
            isDirty={isDirty}
            isEditing={isEditing}
            isPending={updateStudent.isPending}
            onApply={handleApply}
            onToggleEditing={toggleEditing}
          />
        </div>
      ) : activeTab === 'Học phí' ? (
        student.user_uuid ? (
          <StudentPeriodsSection userUuid={student.user_uuid} />
        ) : (
          <StudentFutureSection title="Học phí / Period" />
        )
      ) : (
        <StudentDetailEmptyTab title={activeTab} />
      )}
    </div>
  );
}

function StudentDetailSkeleton({ onBack }: { onBack: () => void }) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.12)]">
        <button
          type="button"
          onClick={onBack}
          className="mb-5 inline-flex items-center gap-2 text-[13px] font-extrabold text-slate-500 transition hover:text-[#1870FF]"
        >
          <ArrowLeft size={16} />
          Quay lại lớp học
        </button>
        <div className="h-8 w-72 animate-pulse rounded-lg bg-slate-200" />
        <div className="mt-4 h-6 w-36 animate-pulse rounded-full bg-slate-100" />
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="h-96 animate-pulse rounded-2xl bg-slate-100" />
        <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    </div>
  );
}

function OverviewActions({
  isDirty,
  isEditing,
  isPending,
  onApply,
  onToggleEditing,
}: {
  isDirty: boolean;
  isEditing: boolean;
  isPending: boolean;
  onApply: () => void;
  onToggleEditing: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-start">
      <button
        type="button"
        onClick={onToggleEditing}
        disabled={isPending}
        className="h-11 rounded-xl bg-slate-100 px-5 text-[14px] font-extrabold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isEditing ? 'Hủy' : 'Chỉnh sửa'}
      </button>
      <button
        type="button"
        disabled={isPending || isEditing}
        className="h-11 rounded-xl bg-rose-50 px-5 text-[14px] font-extrabold text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Xóa
      </button>
      <button
        type="button"
        onClick={onApply}
        disabled={!isDirty || isPending}
        className="h-11 rounded-xl bg-[#1870FF] px-5 text-[14px] font-extrabold text-white shadow-[0_12px_22px_rgba(24,112,255,0.26)] transition hover:bg-[#0f62e6] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none"
      >
        {isPending ? 'Đang lưu...' : 'Áp dụng'}
      </button>
    </div>
  );
}

function StudentFutureSection({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6">
      <p className="text-[14px] font-extrabold uppercase tracking-[0.08em] text-slate-400">{title}</p>
      <p className="mt-3 text-[14px] font-semibold text-slate-500">Khu vực đã sẵn sàng để nối dữ liệu ở task sau.</p>
    </div>
  );
}

function StudentDetailEmptyTab({ title }: { title: StudentDetailTab }) {
  return (
    <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <div>
        <p className="text-[18px] font-extrabold text-slate-900">{title}</p>
        <p className="mt-2 text-[14px] font-semibold text-slate-500">Chưa có dữ liệu để hiển thị.</p>
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
