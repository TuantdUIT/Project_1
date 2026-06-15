import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Check, Download, Pencil, RefreshCw, Trash2, X } from 'lucide-react';
import {
  useDeleteRecordAttendance,
  useExportRecordAttendanceWeeklySummary,
  useRecordAttendancesQuery,
  useSaveRecordAttendance,
} from '@/features/Management_Services/attendance/api/record-attendances';
import type { RecordAttendance } from '@/features/Management_Services/attendance/types';
import { formatDate, formatDateTime, formatTime } from '@/utils/date';
import { parseApiError } from '@/utils/api-errors';

type FormState = {
  recordAttendanceTime: string;
  lessonTime: string;
  overtime: string;
};

const fieldClass =
  'h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-[14px] font-bold text-slate-900 outline-none transition focus:border-[#1870FF] focus:ring-4 focus:ring-[rgba(24,112,255,0.12)]';
const labelClass = 'mb-2 block text-[12px] font-black uppercase tracking-[0.12em] text-slate-400';
const noSpinnerClass =
  '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';

function formatMinutes(value?: number) {
  if (value == null) return '-';
  return `${value} phút`;
}

function isRecordInWeek(record: RecordAttendance, schoolYear: number, weekNumber: number) {
  return record.lesson?.school_year === schoolYear && record.lesson?.week_number === weekNumber;
}

function getRecordLessonLabel(record: RecordAttendance) {
  const lesson = record.lesson;
  const name = lesson?.lesson_type_name ?? 'Buổi học';
  const date = formatDate(lesson?.lesson_date);
  const startTime = formatTime(lesson?.lesson_start_time);
  const weekNumber = lesson?.week_number;

  return `${name} - ${date} ${startTime}${weekNumber != null ? ` - Tuần ${weekNumber}` : ''}`;
}

function toForm(record: RecordAttendance): FormState {
  return {
    recordAttendanceTime: record.ra_attd_time?.slice(0, 16) ?? '',
    lessonTime: record.ra_lesson_time != null ? String(record.ra_lesson_time) : '',
    overtime: record.ra_overtime != null ? String(record.ra_overtime) : '0',
  };
}

export default function RecordAttendanceManagement() {
  const currentYear = new Date().getFullYear();
  const recordsQuery = useRecordAttendancesQuery();
  const saveMutation = useSaveRecordAttendance();
  const deleteMutation = useDeleteRecordAttendance();
  const exportMutation = useExportRecordAttendanceWeeklySummary();

  const [schoolYear, setSchoolYear] = useState(currentYear);
  const [weekNumber, setWeekNumber] = useState(1);
  const [selectedUserUuid, setSelectedUserUuid] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<RecordAttendance | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<FormState>({ recordAttendanceTime: '', lessonTime: '', overtime: '0' });
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const records = recordsQuery.data ?? [];

  const schoolYearOptions = useMemo(() => {
    const set = new Set<number>();
    records.forEach((record) => {
      const year = record.lesson?.school_year;
      if (year != null) set.add(year);
    });
    const arr = [...set].sort((a, b) => b - a);
    return arr.length ? arr : [currentYear];
  }, [records, currentYear]);

  const weekOptions = useMemo(() => {
    const set = new Set<number>();
    records.forEach((record) => {
      if (record.lesson?.school_year === schoolYear && record.lesson?.week_number != null) {
        set.add(record.lesson.week_number);
      }
    });
    const arr = [...set].sort((a, b) => a - b);
    return arr.length ? arr : [1];
  }, [records, schoolYear]);

  const weeklyRecords = useMemo(
    () =>
      records
        .filter((record) => isRecordInWeek(record, schoolYear, weekNumber))
        .sort((first, second) =>
          `${first.lesson?.lesson_date ?? ''} ${first.lesson?.lesson_start_time ?? ''}`.localeCompare(
            `${second.lesson?.lesson_date ?? ''} ${second.lesson?.lesson_start_time ?? ''}`,
          ),
        ),
    [records, schoolYear, weekNumber],
  );

  const staffOptions = useMemo(() => {
    const map = new Map<string, string>();
    weeklyRecords.forEach((record) => {
      const uuid = record.user?.user_uuid;
      if (uuid && !map.has(uuid)) {
        map.set(uuid, record.user?.user_fullname ?? record.user?.user_email ?? 'Nhân sự');
      }
    });
    return [...map.entries()]
      .map(([userUuid, label]) => ({ userUuid, label }))
      .sort((first, second) => first.label.localeCompare(second.label, 'vi'));
  }, [weeklyRecords]);

  const visibleRecords = useMemo(
    () =>
      selectedUserUuid
        ? weeklyRecords.filter((record) => record.user?.user_uuid === selectedUserUuid)
        : weeklyRecords,
    [weeklyRecords, selectedUserUuid],
  );

  // Đồng bộ các bộ lọc về giá trị hợp lệ theo dữ liệu hiện có.
  useEffect(() => {
    if (!schoolYearOptions.includes(schoolYear)) setSchoolYear(schoolYearOptions[0]);
  }, [schoolYearOptions, schoolYear]);

  useEffect(() => {
    if (!weekOptions.includes(weekNumber)) setWeekNumber(weekOptions[0]);
  }, [weekOptions, weekNumber]);

  useEffect(() => {
    if (selectedUserUuid && !staffOptions.some((staff) => staff.userUuid === selectedUserUuid)) {
      setSelectedUserUuid('');
    }
  }, [staffOptions, selectedUserUuid]);

  const isDirty = useMemo(() => {
    if (!selectedRecord) return false;
    const original = toForm(selectedRecord);
    return (
      form.recordAttendanceTime !== original.recordAttendanceTime
      || form.lessonTime !== original.lessonTime
      || form.overtime !== original.overtime
    );
  }, [form, selectedRecord]);

  const isSaving = saveMutation.isPending;

  function openDialog(record: RecordAttendance) {
    setSelectedRecord(record);
    setForm(toForm(record));
    setIsEditing(false);
    setMessage(null);
  }

  function closeDialog() {
    setSelectedRecord(null);
    setIsEditing(false);
  }

  function toggleEditing() {
    if (isEditing && selectedRecord) setForm(toForm(selectedRecord));
    setIsEditing((current) => !current);
  }

  async function handleApply() {
    if (!selectedRecord?.ra_attd_uuid) return;
    setMessage(null);

    const lessonTime = form.lessonTime.trim() === '' ? undefined : Number(form.lessonTime);
    const overtime = form.overtime.trim() === '' ? 0 : Number(form.overtime);
    if (lessonTime != null && (Number.isNaN(lessonTime) || lessonTime < 0)) {
      setMessage({ tone: 'error', text: 'Thời lượng không hợp lệ (phải là số ≥ 0).' });
      return;
    }
    if (Number.isNaN(overtime)) {
      setMessage({ tone: 'error', text: 'OT phải là một số hợp lệ.' });
      return;
    }

    try {
      const updated = await saveMutation.mutateAsync({
        raAttdUuid: selectedRecord.ra_attd_uuid,
        body: {
          userUuid: selectedRecord.user?.user_uuid ?? '',
          lessonUuid: selectedRecord.lesson?.lesson_uuid ?? '',
          recordAttendanceTime: form.recordAttendanceTime || undefined,
          lessonTime,
          overtime,
        },
      });
      setSelectedRecord(updated);
      setForm(toForm(updated));
      setIsEditing(false);
      setMessage({ tone: 'success', text: 'Đã cập nhật bản ghi chấm công.' });
    } catch (error) {
      setMessage({ tone: 'error', text: parseApiError(error).message });
    }
  }

  async function handleDelete() {
    if (!selectedRecord?.ra_attd_uuid) return;

    const confirmed = window.confirm(
      `Xóa bản ghi chấm công của ${selectedRecord.user?.user_fullname ?? selectedRecord.user?.user_email ?? 'nhân sự này'}?`,
    );
    if (!confirmed) return;

    setMessage(null);
    try {
      await deleteMutation.mutateAsync(selectedRecord.ra_attd_uuid);
      setMessage({ tone: 'success', text: 'Đã xóa bản ghi chấm công.' });
      closeDialog();
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

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-5 border-b border-slate-100 p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <button
              type="button"
              onClick={handleExport}
              disabled={exportMutation.isPending}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#1870FF] px-4 text-[14px] font-extrabold text-white shadow-[0_12px_22px_rgba(24,112,255,0.24)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {exportMutation.isPending ? <RefreshCw size={18} className="animate-spin" /> : <Download size={18} />}
              Xuất Excel
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <label>
              <span className={labelClass}>Tên nhân sự</span>
              <select
                value={selectedUserUuid}
                onChange={(event) => setSelectedUserUuid(event.target.value)}
                className={fieldClass}
              >
                <option value="">Tất cả nhân sự</option>
                {staffOptions.map((staff) => (
                  <option key={staff.userUuid} value={staff.userUuid}>
                    {staff.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className={labelClass}>Năm học</span>
              <select
                value={schoolYear}
                onChange={(event) => setSchoolYear(Number(event.target.value))}
                className={fieldClass}
              >
                {schoolYearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className={labelClass}>Tuần học</span>
              <select
                value={weekNumber}
                onChange={(event) => setWeekNumber(Number(event.target.value))}
                className={fieldClass}
              >
                {weekOptions.map((week) => (
                  <option key={week} value={week}>
                    Tuần {week}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left">
            <thead className="bg-slate-50 text-[12px] font-black uppercase tracking-[0.08em] text-slate-500">
              <tr>
                <th className="px-5 py-4">Nhân sự</th>
                <th className="px-5 py-4">Buổi học</th>
                <th className="px-5 py-4">Chấm công lúc</th>
                <th className="px-5 py-4">Thời lượng</th>
                <th className="px-5 py-4">OT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {recordsQuery.isLoading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-[14px] font-bold text-slate-500">
                    Đang tải dữ liệu chấm công...
                  </td>
                </tr>
              ) : visibleRecords.length ? (
                visibleRecords.map((record) => (
                  <tr
                    key={record.ra_attd_uuid}
                    onClick={() => openDialog(record)}
                    className="cursor-pointer transition hover:bg-slate-50"
                  >
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
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-[14px] font-bold text-slate-500">
                    Chưa có bản ghi chấm công phù hợp với bộ lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedRecord ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
          onClick={closeDialog}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(15,23,42,0.30)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-100 p-5">
              <div>
                <h3 className="text-[18px] font-black text-slate-950">Chi tiết chấm công</h3>
                <p className="mt-1 text-[13px] font-semibold text-slate-500">
                  {selectedRecord.user?.user_fullname ?? selectedRecord.user?.user_email ?? '-'}
                </p>
              </div>
              <button
                type="button"
                onClick={closeDialog}
                aria-label="Đóng"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <DialogRow label="Nhân sự">
                <p className="text-[15px] font-black text-slate-950">{selectedRecord.user?.user_fullname ?? '-'}</p>
                <p className="text-[13px] font-semibold text-slate-500">{selectedRecord.user?.user_email ?? '-'}</p>
                <span className="mt-1 inline-flex rounded-full bg-blue-50 px-3 py-1 text-[12px] font-black text-[#1870FF]">
                  {selectedRecord.user?.role_name ?? '-'}
                </span>
              </DialogRow>

              <DialogRow label="Buổi học">{getRecordLessonLabel(selectedRecord)}</DialogRow>

              <DialogRow label="Thời điểm chấm công">
                {isEditing ? (
                  <input
                    type="datetime-local"
                    value={form.recordAttendanceTime}
                    onChange={(event) => setForm((current) => ({ ...current, recordAttendanceTime: event.target.value }))}
                    className={fieldClass}
                  />
                ) : (
                  formatDateTime(selectedRecord.ra_attd_time)
                )}
              </DialogRow>

              <div className="grid gap-4 sm:grid-cols-2">
                <DialogRow label="Thời lượng (phút)">
                  {isEditing ? (
                    <input
                      type="number"
                      min={0}
                      value={form.lessonTime}
                      onChange={(event) => setForm((current) => ({ ...current, lessonTime: event.target.value }))}
                      placeholder="Auto"
                      className={`${fieldClass} ${noSpinnerClass}`}
                    />
                  ) : (
                    formatMinutes(selectedRecord.ra_lesson_time)
                  )}
                </DialogRow>
                <DialogRow label="OT (phút)">
                  {isEditing ? (
                    <input
                      type="number"
                      value={form.overtime}
                      onChange={(event) => setForm((current) => ({ ...current, overtime: event.target.value }))}
                      className={`${fieldClass} ${noSpinnerClass}`}
                    />
                  ) : (
                    formatMinutes(selectedRecord.ra_overtime)
                  )}
                </DialogRow>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 border-t border-slate-100 p-5">
              <button
                type="button"
                onClick={toggleEditing}
                disabled={isSaving}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-100 px-5 text-[14px] font-extrabold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Pencil size={18} />
                {isEditing ? 'Hủy' : 'Chỉnh sửa'}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isEditing || deleteMutation.isPending}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-rose-50 px-5 text-[14px] font-extrabold text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 size={18} />
                Xóa
              </button>
              <button
                type="button"
                onClick={handleApply}
                disabled={!isEditing || !isDirty || isSaving}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#1870FF] px-5 text-[14px] font-extrabold text-white shadow-[0_12px_22px_rgba(24,112,255,0.26)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none"
              >
                {isSaving ? <RefreshCw size={18} className="animate-spin" /> : <Check size={18} />}
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DialogRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <span className="mb-1.5 block text-[12px] font-black uppercase tracking-[0.12em] text-slate-400">{label}</span>
      <div className="text-[15px] font-bold text-slate-900">{children}</div>
    </div>
  );
}
