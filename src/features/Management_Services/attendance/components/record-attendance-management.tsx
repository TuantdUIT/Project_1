import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import {
  Download,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Trash2,
  UserRoundCheck,
} from 'lucide-react';
import {
  useDeleteRecordAttendance,
  useExportRecordAttendanceWeeklySummary,
  useRecordAttendancesQuery,
  useRecordAttendanceWeeklySummaryQuery,
  useSaveRecordAttendance,
} from '@/features/Management_Services/attendance/api/record-attendances';
import type { RecordAttendance } from '@/features/Management_Services/attendance/types';
import {
  useRecordAttendanceAssignmentOptions,
  type AssignedStaffOption,
} from '@/features/Management_Services/attendance/hooks/use-record-attendance-assignment-options';
import { useLessonsQuery } from '@/features/Management_Services/study-week/api/lessons';
import type { Lesson } from '@/features/Management_Services/study-week/types';
import { formatDate, formatDateTime, formatTime } from '@/utils/date';
import { parseApiError } from '@/utils/api-errors';

type FormState = {
  userUuid: string;
  lessonUuid: string;
  recordAttendanceTime: string;
  lessonTime: string;
  overtime: string;
};

const emptyForm: FormState = {
  userUuid: '',
  lessonUuid: '',
  recordAttendanceTime: '',
  lessonTime: '',
  overtime: '0',
};

const fieldClass =
  'h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-[14px] font-bold text-slate-900 outline-none transition focus:border-[#1870FF] focus:ring-4 focus:ring-[rgba(24,112,255,0.12)]';

function formatMinutes(value?: number) {
  if (value == null) return '-';
  return `${value} phút`;
}

function getLessonWeekNumber(lesson: Lesson) {
  return lesson.study_week?.week_number;
}

function getLessonSchoolYear(lesson: Lesson) {
  return lesson.study_week?.school_year;
}

function isLessonInWeek(lesson: Lesson, schoolYear: number, weekNumber: number) {
  return getLessonSchoolYear(lesson) === schoolYear && getLessonWeekNumber(lesson) === weekNumber;
}

function isRecordInWeek(record: RecordAttendance, schoolYear: number, weekNumber: number) {
  return record.lesson?.school_year === schoolYear && record.lesson?.week_number === weekNumber;
}

function getLessonLabel(lesson: Lesson) {
  const name = lesson.lesson_type?.lesson_type_name ?? 'Buổi học';
  const date = formatDate(lesson.lesson_date);
  const startTime = formatTime(lesson.lesson_start_time);
  const gradeName = lesson.grade?.name;

  return `${name} - ${date} ${startTime}${gradeName ? ` - ${gradeName}` : ''}`;
}

function getRecordLessonLabel(record: RecordAttendance) {
  const lesson = record.lesson;
  const name = lesson?.lesson_type_name ?? 'Buổi học';
  const date = formatDate(lesson?.lesson_date);
  const startTime = formatTime(lesson?.lesson_start_time);
  const weekNumber = lesson?.week_number;

  return `${name} - ${date} ${startTime}${weekNumber != null ? ` - Tuần ${weekNumber}` : ''}`;
}

function getStaffLabel(user: AssignedStaffOption) {
  return `${user.fullName ?? user.email ?? 'Nhân sự'}${user.roleName ? ` - ${user.roleName}` : ''}`;
}

function toForm(record: RecordAttendance): FormState {
  return {
    userUuid: record.user?.user_uuid ?? '',
    lessonUuid: record.lesson?.lesson_uuid ?? '',
    recordAttendanceTime: record.ra_attd_time?.slice(0, 16) ?? '',
    lessonTime: record.ra_lesson_time != null ? String(record.ra_lesson_time) : '',
    overtime: record.ra_overtime != null ? String(record.ra_overtime) : '0',
  };
}

export default function RecordAttendanceManagement() {
  const currentYear = new Date().getFullYear();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingRecord, setEditingRecord] = useState<RecordAttendance | null>(null);
  const [query, setQuery] = useState('');
  const [schoolYear, setSchoolYear] = useState(currentYear);
  const [weekNumber, setWeekNumber] = useState(1);
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const lessonsQuery = useLessonsQuery();
  const recordsQuery = useRecordAttendancesQuery();
  const summaryQuery = useRecordAttendanceWeeklySummaryQuery({ schoolYear, weekNumber });
  const saveMutation = useSaveRecordAttendance();
  const deleteMutation = useDeleteRecordAttendance();
  const exportMutation = useExportRecordAttendanceWeeklySummary();

  const lessons = lessonsQuery.data ?? [];
  const weeklyLessons = useMemo(
    () =>
      lessons
        .filter((lesson) => isLessonInWeek(lesson, schoolYear, weekNumber))
        .sort((first, second) =>
          `${first.lesson_date ?? ''} ${first.lesson_start_time ?? ''}`.localeCompare(
            `${second.lesson_date ?? ''} ${second.lesson_start_time ?? ''}`,
          ),
        ),
    [lessons, schoolYear, weekNumber],
  );
  const assignmentOptions = useRecordAttendanceAssignmentOptions(weeklyLessons);
  const records = recordsQuery.data ?? [];
  const weeklyRecords = useMemo(
    () => records.filter((record) => isRecordInWeek(record, schoolYear, weekNumber)),
    [records, schoolYear, weekNumber],
  );

  const availableStaffOptions = useMemo(() => {
    const validUserUuids = form.lessonUuid
      ? assignmentOptions.lessonToUserUuids.get(form.lessonUuid) ?? new Set<string>()
      : new Set(assignmentOptions.assignedStaffByUuid.keys());

    return [...validUserUuids]
      .map((userUuid) => assignmentOptions.assignedStaffByUuid.get(userUuid))
      .filter((staff): staff is AssignedStaffOption => Boolean(staff))
      .sort((first, second) => getStaffLabel(first).localeCompare(getStaffLabel(second), 'vi'));
  }, [assignmentOptions.assignedStaffByUuid, assignmentOptions.lessonToUserUuids, form.lessonUuid]);

  const availableLessons = useMemo(() => {
    const validLessonUuids = form.userUuid
      ? assignmentOptions.userToLessonUuids.get(form.userUuid) ?? new Set<string>()
      : new Set(assignmentOptions.lessonToUserUuids.keys());

    return weeklyLessons.filter((lesson) => Boolean(lesson.lesson_uuid && validLessonUuids.has(lesson.lesson_uuid)));
  }, [assignmentOptions.lessonToUserUuids, assignmentOptions.userToLessonUuids, form.userUuid, weeklyLessons]);

  const filteredRecords = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return weeklyRecords;

    return weeklyRecords.filter((record) => {
      const haystack = [
        record.user?.user_fullname,
        record.user?.user_email,
        record.user?.role_name,
        record.lesson?.lesson_type_name,
        record.lesson?.lesson_date,
        record.lesson?.week_number,
        record.lesson?.school_year,
      ]
        .filter((value) => value != null)
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalized);
    });
  }, [query, weeklyRecords]);

  const isSaving = saveMutation.isPending;

  useEffect(() => {
    if (!form.lessonUuid) return;
    if (weeklyLessons.some((lesson) => lesson.lesson_uuid === form.lessonUuid)) return;

    setForm((current) => ({ ...current, lessonUuid: '', userUuid: '' }));
    setEditingRecord(null);
  }, [form.lessonUuid, weeklyLessons]);

  useEffect(() => {
    if (!form.userUuid || !form.lessonUuid) return;

    const validUsersForLesson = assignmentOptions.lessonToUserUuids.get(form.lessonUuid);
    if (validUsersForLesson?.has(form.userUuid)) return;

    setForm((current) => ({ ...current, userUuid: '' }));
  }, [assignmentOptions.lessonToUserUuids, form.lessonUuid, form.userUuid]);

  function patchForm(patch: Partial<FormState>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingRecord(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (!form.userUuid || !form.lessonUuid || form.overtime.trim() === '') {
      setMessage({ tone: 'error', text: 'Vui lòng chọn nhân sự, buổi học và nhập OT.' });
      return;
    }

    const lessonTime = form.lessonTime.trim() === '' ? undefined : Number(form.lessonTime);
    const overtime = Number(form.overtime);
    if (lessonTime != null && lessonTime < 0) {
      setMessage({ tone: 'error', text: 'Thời lượng buổi học không được nhỏ hơn 0.' });
      return;
    }
    if (Number.isNaN(overtime)) {
      setMessage({ tone: 'error', text: 'OT phải là một số hợp lệ.' });
      return;
    }
    if (!assignmentOptions.lessonToUserUuids.get(form.lessonUuid)?.has(form.userUuid)) {
      setMessage({ tone: 'error', text: 'Nhân sự không thuộc phân công của buổi học đã chọn.' });
      return;
    }

    try {
      await saveMutation.mutateAsync({
        raAttdUuid: editingRecord?.ra_attd_uuid,
        body: {
          userUuid: form.userUuid,
          lessonUuid: form.lessonUuid,
          recordAttendanceTime: form.recordAttendanceTime || undefined,
          lessonTime,
          overtime,
        },
      });
      setMessage({
        tone: 'success',
        text: editingRecord ? 'Đã cập nhật bản ghi chấm công.' : 'Đã lưu bản ghi chấm công.',
      });
      resetForm();
    } catch (error) {
      setMessage({ tone: 'error', text: parseApiError(error).message });
    }
  }

  async function handleDelete(record: RecordAttendance) {
    if (!record.ra_attd_uuid) return;

    const confirmed = window.confirm(
      `Xóa bản ghi chấm công của ${record.user?.user_fullname ?? record.user?.user_email ?? 'nhân sự này'}?`,
    );
    if (!confirmed) return;

    setMessage(null);
    try {
      await deleteMutation.mutateAsync(record.ra_attd_uuid);
      if (editingRecord?.ra_attd_uuid === record.ra_attd_uuid) {
        resetForm();
      }
      setMessage({ tone: 'success', text: 'Đã xóa bản ghi chấm công.' });
    } catch (error) {
      setMessage({ tone: 'error', text: parseApiError(error).message });
    }
  }

  async function handleExport() {
    setMessage(null);
    try {
      const blob = await exportMutation.mutateAsync({ schoolYear, weekNumber });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `record-attendance-weekly-summary-${schoolYear}-week-${weekNumber}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      setMessage({ tone: 'error', text: parseApiError(error).message });
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Lessons trong tuần" value={weeklyLessons.length} />
        <StatCard label="Nhân sự có thể chấm" value={assignmentOptions.assignedStaffByUuid.size} />
        <StatCard
          label="Tổng giờ tuần"
          value={formatMinutes(summaryQuery.data?.reduce((sum, row) => sum + (row.total_lesson_time ?? 0), 0))}
        />
      </div>

      {message ? (
        <div
          className={`rounded-xl border px-4 py-3 text-[14px] font-bold ${
            message.tone === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {message.text}
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-[19px] font-black text-slate-950">
              {editingRecord ? 'Sửa bản ghi chấm công' : 'Tạo bản ghi chấm công'}
            </h2>
            <p className="mt-1 text-[14px] font-semibold text-slate-500">
              Chọn tuần cần chấm, sau đó chọn buổi học và nhân sự thuộc phân công của buổi đó.
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <label className="w-32">
              <span className="mb-2 block text-[12px] font-black uppercase tracking-[0.12em] text-slate-400">
                Năm học
              </span>
              <input
                type="number"
                value={schoolYear}
                onChange={(event) => setSchoolYear(Number(event.target.value) || currentYear)}
                className={fieldClass}
              />
            </label>
            <label className="w-28">
              <span className="mb-2 block text-[12px] font-black uppercase tracking-[0.12em] text-slate-400">
                Tuần
              </span>
              <input
                type="number"
                min={1}
                value={weekNumber}
                onChange={(event) => setWeekNumber(Math.max(Number(event.target.value) || 1, 1))}
                className={fieldClass}
              />
            </label>
            {editingRecord ? (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 text-[14px] font-extrabold text-slate-700 transition hover:border-[#1870FF] hover:text-[#1870FF]"
              >
                <RotateCcw size={18} />
                Tạo mới
              </button>
            ) : null}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-12">
          <label className="lg:col-span-4">
            <span className="mb-2 block text-[12px] font-black uppercase tracking-[0.12em] text-slate-400">
              Buổi học
            </span>
            <select
              value={form.lessonUuid}
              onChange={(event) => patchForm({ lessonUuid: event.target.value })}
              className={fieldClass}
            >
              <option value="">Chọn buổi học</option>
              {availableLessons.map((lesson) => (
                <option key={lesson.lesson_uuid} value={lesson.lesson_uuid ?? ''}>
                  {getLessonLabel(lesson)}
                </option>
              ))}
              {!lessonsQuery.isLoading && !availableLessons.length ? (
                <option value="" disabled>
                  Không có buổi học có phân công trong tuần này
                </option>
              ) : null}
            </select>
          </label>

          <label className="lg:col-span-3">
            <span className="mb-2 block text-[12px] font-black uppercase tracking-[0.12em] text-slate-400">
              Nhân sự
            </span>
            <select
              value={form.userUuid}
              onChange={(event) => patchForm({ userUuid: event.target.value })}
              className={fieldClass}
            >
              <option value="">Chọn nhân sự</option>
              {availableStaffOptions.map((user) => (
                <option key={user.userUuid} value={user.userUuid}>
                  {getStaffLabel(user)}
                </option>
              ))}
              {!lessonsQuery.isLoading && !availableStaffOptions.length ? (
                <option value="" disabled>
                  Không có nhân sự phù hợp
                </option>
              ) : null}
            </select>
            {lessonsQuery.isLoading ? (
              <p className="mt-2 text-[12px] font-bold text-slate-400">Đang đọc lessons và phân công...</p>
            ) : null}
          </label>

          <label className="lg:col-span-2">
            <span className="mb-2 block text-[12px] font-black uppercase tracking-[0.12em] text-slate-400">
              Thời điểm
            </span>
            <input
              type="datetime-local"
              value={form.recordAttendanceTime}
              onChange={(event) => patchForm({ recordAttendanceTime: event.target.value })}
              className={fieldClass}
            />
          </label>

          <label className="lg:col-span-1">
            <span className="mb-2 block text-[12px] font-black uppercase tracking-[0.12em] text-slate-400">
              Phút
            </span>
            <input
              type="number"
              min={0}
              value={form.lessonTime}
              onChange={(event) => patchForm({ lessonTime: event.target.value })}
              placeholder="Auto"
              className={fieldClass}
            />
          </label>

          <label className="lg:col-span-1">
            <span className="mb-2 block text-[12px] font-black uppercase tracking-[0.12em] text-slate-400">
              OT
            </span>
            <input
              type="number"
              value={form.overtime}
              onChange={(event) => patchForm({ overtime: event.target.value })}
              className={fieldClass}
            />
          </label>

          <div className="flex items-end lg:col-span-1">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#1870FF] px-4 text-[14px] font-extrabold text-white shadow-[0_12px_22px_rgba(24,112,255,0.24)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? <RefreshCw size={18} className="animate-spin" /> : editingRecord ? <Save size={18} /> : <Plus size={18} />}
              Lưu
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-[19px] font-black text-slate-950">Danh sách chấm công trong tuần</h2>
            <p className="mt-1 text-[14px] font-semibold text-slate-500">Mỗi bản ghi gắn với một nhân sự thuộc lesson.</p>
          </div>
          <label className="relative block w-full md:w-80">
            <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm nhân sự, bài học, tuần..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-[14px] font-bold text-slate-900 outline-none transition focus:border-[#1870FF] focus:ring-4 focus:ring-[rgba(24,112,255,0.12)]"
            />
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left">
            <thead className="bg-slate-50 text-[12px] font-black uppercase tracking-[0.08em] text-slate-500">
              <tr>
                <th className="px-5 py-4">Nhân sự</th>
                <th className="px-5 py-4">Buổi học</th>
                <th className="px-5 py-4">Chấm công lúc</th>
                <th className="px-5 py-4">Thời lượng</th>
                <th className="px-5 py-4">OT</th>
                <th className="px-5 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {recordsQuery.isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-[14px] font-bold text-slate-500">
                    Đang tải dữ liệu chấm công...
                  </td>
                </tr>
              ) : filteredRecords.length ? (
                filteredRecords.map((record) => (
                  <tr key={record.ra_attd_uuid} className="transition hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <p className="text-[15px] font-black text-slate-950">{record.user?.user_fullname ?? '-'}</p>
                      <p className="mt-1 text-[13px] font-semibold text-slate-500">{record.user?.user_email ?? '-'}</p>
                      <span className="mt-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-[12px] font-black text-slate-700">
                        {record.user?.role_name ?? '-'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[14px] font-bold text-slate-700">{getRecordLessonLabel(record)}</td>
                    <td className="px-5 py-4 text-[14px] font-bold text-slate-700">{formatDateTime(record.ra_attd_time)}</td>
                    <td className="px-5 py-4 text-[14px] font-black text-slate-950">{formatMinutes(record.ra_lesson_time)}</td>
                    <td className="px-5 py-4 text-[14px] font-black text-slate-950">{formatMinutes(record.ra_overtime)}</td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingRecord(record);
                            setForm(toForm(record));
                          }}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-[#1870FF] hover:text-[#1870FF]"
                          aria-label="Sửa bản ghi"
                          title="Sửa bản ghi"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(record)}
                          disabled={deleteMutation.isPending}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-rose-100 bg-rose-50 text-rose-600 transition hover:border-rose-300 disabled:cursor-not-allowed disabled:opacity-60"
                          aria-label="Xóa bản ghi"
                          title="Xóa bản ghi"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-[14px] font-bold text-slate-500">
                    Chưa có bản ghi chấm công phù hợp trong tuần này.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-[19px] font-black text-slate-950">Tổng hợp tuần</h2>
            <p className="mt-1 text-[14px] font-semibold text-slate-500">
              Tổng hợp toàn bộ nhân sự không phải học sinh theo năm học và tuần đang chọn.
            </p>
          </div>
          <button
            type="button"
            onClick={handleExport}
            disabled={exportMutation.isPending}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-950 px-4 text-[14px] font-extrabold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {exportMutation.isPending ? <RefreshCw size={18} className="animate-spin" /> : <Download size={18} />}
            Xuất Excel
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <thead className="bg-slate-50 text-[12px] font-black uppercase tracking-[0.08em] text-slate-500">
              <tr>
                <th className="px-5 py-4">Nhân sự</th>
                <th className="px-5 py-4">Số record</th>
                <th className="px-5 py-4">Tổng thời lượng</th>
                <th className="px-5 py-4">Tổng OT</th>
                <th className="px-5 py-4">Nhóm bài học</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {summaryQuery.isLoading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-[14px] font-bold text-slate-500">
                    Đang tải tổng hợp tuần...
                  </td>
                </tr>
              ) : summaryQuery.data?.length ? (
                summaryQuery.data.map((summary) => (
                  <tr key={summary.user_uuid ?? summary.user_email} className="transition hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <p className="text-[15px] font-black text-slate-950">{summary.user_fullname ?? '-'}</p>
                      <p className="mt-1 text-[13px] font-semibold text-slate-500">{summary.user_email ?? '-'}</p>
                      <span className="mt-2 inline-flex rounded-full bg-blue-50 px-3 py-1 text-[12px] font-black text-[#1870FF]">
                        {summary.role_name ?? '-'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[14px] font-black text-slate-950">{summary.total_records ?? 0}</td>
                    <td className="px-5 py-4 text-[14px] font-black text-slate-950">{formatMinutes(summary.total_lesson_time)}</td>
                    <td className="px-5 py-4 text-[14px] font-black text-slate-950">{formatMinutes(summary.total_overtime)}</td>
                    <td className="px-5 py-4">
                      <div className="flex max-w-xl flex-wrap gap-2">
                        {(summary.lesson_type_summaries ?? []).length ? (
                          summary.lesson_type_summaries?.map((item) => (
                            <span
                              key={item.lesson_type_uuid ?? item.lesson_type_name}
                              className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[12px] font-black text-slate-700"
                            >
                              {item.lesson_type_name ?? 'Bài học'}: {formatMinutes(item.total_lesson_time)} | OT {formatMinutes(item.total_overtime)}
                            </span>
                          ))
                        ) : (
                          <span className="text-[13px] font-bold text-slate-400">Chưa có record</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-[14px] font-bold text-slate-500">
                    Chưa có dữ liệu tổng hợp cho tuần này.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1870FF]">
        <UserRoundCheck size={24} />
      </span>
      <span>
        <span className="block text-[12px] font-black uppercase tracking-[0.14em] text-slate-400">{label}</span>
        <span className="mt-1 block text-[22px] font-black text-slate-950">{value}</span>
      </span>
    </div>
  );
}
