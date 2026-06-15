import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, RefreshCw, RotateCcw, Save, UsersRound } from 'lucide-react';
import {
  useDeleteRecordAttendance,
  useRecordAttendancesQuery,
  useSaveRecordAttendance,
} from '@/features/Management_Services/attendance/api/record-attendances';
import type { RecordAttendance } from '@/features/Management_Services/attendance/types';
import { UNASSIGNED_PERSONNEL_MESSAGE } from '@/features/Management_Services/study-week/lib/lesson-personnel';
import type { Lesson } from '@/features/Management_Services/study-week/types';
import { parseApiError } from '@/utils/api-errors';
import AttendanceToast, { type AttendanceToastState } from './attendance-toast';

type AssigneeRow = {
  userUuid: string;
  fullName: string;
  email?: string;
  roleName?: string;
};

type RecordRow = {
  initiallyTicked: boolean;
  currentlyTicked: boolean;
  initialLessonTime: number;
  initialOvertime: number;
  raAttdUuid?: string;
  error?: string;
};

type PendingMetrics = {
  lessonTime?: number;
  overtime?: number;
};

const numberInputClass =
  'h-11 w-24 rounded-xl border border-slate-200 bg-white px-3 text-center text-[15px] font-black text-slate-950 outline-none transition focus:border-[#1870FF] focus:ring-4 focus:ring-[rgba(24,112,255,0.12)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';

function extractErrorMessage(error: unknown) {
  return parseApiError(error).message;
}

function getDefaultLessonTime(lesson: Lesson) {
  // Số phút công mặc định = thời lượng thực tế của buổi học (giờ kết thúc − giờ bắt đầu,
  // quy ra phút) do manager nhập qua "Lưu giờ kết thúc" → lưu thành real_lesson_length.
  // Dùng `||` để khi chưa nhập giờ kết thúc (real_lesson_length = 0) thì fallback sang
  // thời lượng chuẩn của loại buổi thay vì để 0.
  return lesson.real_lesson_length || lesson.lesson_type?.lesson_time || 0;
}

function buildAssigneeRows(lesson: Lesson): AssigneeRow[] {
  return (lesson.employee_assignments ?? [])
    .filter((assignment) => Boolean(assignment.user_uuid))
    .map((assignment) => ({
      userUuid: assignment.user_uuid ?? '',
      fullName: assignment.full_name ?? assignment.email ?? 'Nhân sự',
      email: assignment.email,
      roleName: assignment.role_name,
    }));
}

function findRecordForAssignee(records: RecordAttendance[], lessonUuid: string | undefined, userUuid: string) {
  if (!lessonUuid) return undefined;

  return records.find(
    (record) => record.lesson?.lesson_uuid === lessonUuid && record.user?.user_uuid === userUuid,
  );
}

function hasRowChanged(row: RecordRow, pendingTick: boolean | undefined, pendingMetric: PendingMetrics | undefined) {
  const nextTicked = pendingTick ?? row.currentlyTicked;
  const nextLessonTime = pendingMetric?.lessonTime ?? row.initialLessonTime;
  const nextOvertime = pendingMetric?.overtime ?? row.initialOvertime;

  return (
    nextTicked !== row.initiallyTicked
    || (nextTicked && (nextLessonTime !== row.initialLessonTime || nextOvertime !== row.initialOvertime))
  );
}

export default function RecordAttendancePanel({ lesson }: { lesson: Lesson }) {
  const initialAssignees = useMemo(() => buildAssigneeRows(lesson), [lesson]);
  const defaultLessonTime = getDefaultLessonTime(lesson);
  const [assignees, setAssignees] = useState<AssigneeRow[]>([]);
  const [rows, setRows] = useState<Record<string, RecordRow>>({});
  const [pendingTicks, setPendingTicks] = useState<Record<string, boolean>>({});
  const [pendingMetrics, setPendingMetrics] = useState<Record<string, PendingMetrics>>({});
  const [toast, setToast] = useState<AttendanceToastState | null>(null);
  const recordsQuery = useRecordAttendancesQuery();
  const saveRecordAttendance = useSaveRecordAttendance();
  const deleteRecordAttendance = useDeleteRecordAttendance();
  const isSaving = saveRecordAttendance.isPending || deleteRecordAttendance.isPending;

  useEffect(() => {
    setAssignees(initialAssignees);
    setRows(
      Object.fromEntries(
        initialAssignees.map((assignee) => {
          const existingRecord = findRecordForAssignee(
            recordsQuery.data ?? [],
            lesson.lesson_uuid,
            assignee.userUuid,
          );
          const isTicked = Boolean(existingRecord);

          return [
            assignee.userUuid,
            {
              initiallyTicked: isTicked,
              currentlyTicked: isTicked,
              // Giữ nguyên số phút công đã lưu của record (kể cả 0); chỉ dùng default cho
              // dòng chưa có record. Công thực tế được chốt qua sync khi nhập giờ kết thúc.
              initialLessonTime: existingRecord?.ra_lesson_time ?? defaultLessonTime,
              initialOvertime: existingRecord?.ra_overtime ?? 0,
              raAttdUuid: existingRecord?.ra_attd_uuid,
            },
          ];
        }),
      ),
    );
    setPendingTicks({});
    setPendingMetrics({});
  }, [defaultLessonTime, initialAssignees, lesson.lesson_uuid, recordsQuery.data]);

  const presentCount = useMemo(
    () => Object.values(rows).filter((row) => row.currentlyTicked).length,
    [rows],
  );
  const dirtyCount = useMemo(
    () =>
      assignees.filter((assignee) => {
        const row = rows[assignee.userUuid];
        if (!row) return false;

        return hasRowChanged(row, pendingTicks[assignee.userUuid], pendingMetrics[assignee.userUuid]);
      }).length,
    [assignees, pendingMetrics, pendingTicks, rows],
  );

  function showAttendanceToast(message: string, tone: AttendanceToastState['tone']) {
    setToast({ id: Date.now(), message, tone });
  }

  function updateMetric(userUuid: string, field: keyof PendingMetrics, value: number) {
    setPendingMetrics((current) => ({
      ...current,
      [userUuid]: {
        ...current[userUuid],
        [field]: field === 'lessonTime' ? Math.max(value, 0) : value,
      },
    }));
  }

  function resetChanges() {
    setRows((current) =>
      Object.fromEntries(
        Object.entries(current).map(([userUuid, row]) => [
          userUuid,
          {
            ...row,
            currentlyTicked: row.initiallyTicked,
            error: undefined,
          },
        ]),
      ),
    );
    setPendingTicks({});
    setPendingMetrics({});
  }

  async function saveDraft() {
    const lessonUuid = lesson.lesson_uuid;
    if (!dirtyCount || isSaving || !lessonUuid) return;

    const changedAssignees = assignees.filter((assignee) => {
      const row = rows[assignee.userUuid];
      if (!row) return false;

      return hasRowChanged(row, pendingTicks[assignee.userUuid], pendingMetrics[assignee.userUuid]);
    });

    if (!changedAssignees.length) return;

    setRows((currentRows) =>
      Object.fromEntries(
        Object.entries(currentRows).map(([userUuid, row]) => [
          userUuid,
          {
            ...row,
            currentlyTicked: pendingTicks[userUuid] ?? row.currentlyTicked,
            error: undefined,
          },
        ]),
      ),
    );

    const results = await Promise.allSettled(
      changedAssignees.map((assignee) => {
        const metrics = pendingMetrics[assignee.userUuid] ?? {};
        const row = rows[assignee.userUuid];
        if (!row) {
          throw new Error('Không tìm thấy dòng điểm danh nhân sự.');
        }

        const nextTicked = pendingTicks[assignee.userUuid] ?? row.currentlyTicked;
        if (!nextTicked) {
          if (!row.raAttdUuid) return Promise.resolve(undefined);
          return deleteRecordAttendance.mutateAsync(row.raAttdUuid);
        }

        return saveRecordAttendance.mutateAsync({
          raAttdUuid: row.raAttdUuid,
          body: {
            userUuid: assignee.userUuid,
            lessonUuid,
            lessonTime: metrics.lessonTime ?? row.initialLessonTime ?? defaultLessonTime,
            overtime: metrics.overtime ?? row.initialOvertime ?? 0,
          },
        });
      }),
    );

    const successPatches: Record<string, Partial<RecordRow>> = {};
    const failedUserUuids = new Set<string>();
    let checkedCount = 0;
    let uncheckedCount = 0;
    let updatedCount = 0;

    results.forEach((result, index) => {
      const assignee = changedAssignees[index];
      if (!assignee) return;
      const row = rows[assignee.userUuid];
      if (!row) return;
      const nextTicked = pendingTicks[assignee.userUuid] ?? row.currentlyTicked;

      if (result.status === 'fulfilled') {
        const metrics = pendingMetrics[assignee.userUuid] ?? {};
        if (nextTicked && !row.initiallyTicked) {
          checkedCount += 1;
        } else if (!nextTicked && row.initiallyTicked) {
          uncheckedCount += 1;
        } else if (nextTicked) {
          updatedCount += 1;
        }

        successPatches[assignee.userUuid] = {
          initiallyTicked: nextTicked,
          currentlyTicked: nextTicked,
          initialLessonTime: metrics.lessonTime ?? row.initialLessonTime ?? defaultLessonTime,
          initialOvertime: metrics.overtime ?? row.initialOvertime ?? 0,
          raAttdUuid: nextTicked ? (result.value as RecordAttendance | undefined)?.ra_attd_uuid ?? row.raAttdUuid : undefined,
          error: undefined,
        };
        return;
      }

      failedUserUuids.add(assignee.userUuid);
      successPatches[assignee.userUuid] = {
        currentlyTicked: nextTicked,
        error: extractErrorMessage(result.reason),
      };
    });

    setRows((currentRows) => {
      const nextRows = { ...currentRows };
      Object.entries(successPatches).forEach(([userUuid, patch]) => {
        nextRows[userUuid] = {
          ...nextRows[userUuid],
          ...patch,
        };
      });
      return nextRows;
    });

    setPendingTicks((current) => {
      const next = { ...current };
      changedAssignees.forEach((assignee) => {
        if (!failedUserUuids.has(assignee.userUuid)) {
          delete next[assignee.userUuid];
        }
      });
      return next;
    });
    setPendingMetrics((current) => {
      const next = { ...current };
      changedAssignees.forEach((assignee) => {
        if (!failedUserUuids.has(assignee.userUuid)) {
          delete next[assignee.userUuid];
        }
      });
      return next;
    });

    if (checkedCount) {
      showAttendanceToast(`Điểm danh ${checkedCount} nhân sự`, 'success');
    }
    if (uncheckedCount) {
      showAttendanceToast(`Bỏ điểm danh ${uncheckedCount} nhân sự`, 'warning');
    }
    if (updatedCount) {
      showAttendanceToast(`Cập nhật ${updatedCount} bản ghi chấm công`, 'success');
    }
  }

  return (
    <div className="space-y-5">
      <AttendanceToast toast={toast} onClose={() => setToast(null)} />

      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="grid gap-4 md:grid-cols-2">
          <StatBlock icon={<UsersRound size={24} />} label="Nhân sự" value={assignees.length} />
          <StatBlock icon={<CheckCircle2 size={24} />} label="Có mặt" value={presentCount} tone="green" />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={resetChanges}
            disabled={isSaving || !dirtyCount}
            className="inline-flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 text-[15px] font-extrabold text-slate-700 transition hover:border-[#1870FF] hover:text-[#1870FF] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCcw size={20} />
            Hoàn tác
          </button>
          <button
            type="button"
            onClick={saveDraft}
            disabled={isSaving || !dirtyCount}
            className="inline-flex h-12 items-center gap-3 rounded-xl bg-[#1870FF] px-6 text-[15px] font-extrabold text-white shadow-[0_14px_26px_rgba(24,112,255,0.28)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? <RefreshCw size={20} className="animate-spin" /> : <Save size={20} />}
            Lưu thay đổi
          </button>
        </div>
      </div>

      {recordsQuery.isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-8 text-center text-[14px] font-bold text-slate-500">
          Đang tải dữ liệu chấm công...
        </div>
      ) : assignees.length ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left">
              <thead className="bg-slate-50 text-[12px] font-black uppercase tracking-[0.08em] text-slate-500">
                <tr>
                  <th className="w-16 px-5 py-4"></th>
                  <th className="px-5 py-4">Họ tên</th>
                  <th className="px-5 py-4">Vai trò</th>
                  <th className="px-5 py-4">Thời gian</th>
                  <th className="px-5 py-4">OT</th>
                  <th className="px-5 py-4">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {assignees.map((assignee) => {
                  const row = rows[assignee.userUuid];
                  const isTicked = pendingTicks[assignee.userUuid] ?? Boolean(row?.currentlyTicked);
                  const metrics = pendingMetrics[assignee.userUuid] ?? {};
                  // Chỉ dòng đang điểm danh (Có mặt) mới hiển thị công; dòng chưa điểm danh = 0.
                  const lessonTime = isTicked ? (metrics.lessonTime ?? row?.initialLessonTime ?? 0) : 0;
                  const overtime = metrics.overtime ?? row?.initialOvertime ?? 0;

                  return (
                    <tr key={assignee.userUuid} className="transition hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <input
                          type="checkbox"
                          checked={isTicked}
                          onChange={(event) => {
                            setPendingTicks((current) => ({
                              ...current,
                              [assignee.userUuid]: event.target.checked,
                            }));
                          }}
                          className="h-5 w-5 rounded border-slate-300 accent-[#1870FF]"
                          aria-label={`Điểm danh ${assignee.fullName}`}
                        />
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-[15px] font-black text-slate-950">{assignee.fullName}</p>
                        <p className="mt-1 text-[14px] font-semibold text-slate-500">{assignee.email ?? '-'}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[12px] font-black text-slate-700">
                          {assignee.roleName ?? '-'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <input
                          type="number"
                          min={0}
                          value={lessonTime}
                          onChange={(event) => updateMetric(assignee.userUuid, 'lessonTime', Number(event.target.value))}
                          className={numberInputClass}
                          aria-label={`Số phút của ${assignee.fullName}`}
                        />
                      </td>
                      <td className="px-5 py-4">
                        <input
                          type="number"
                          value={overtime}
                          onChange={(event) => updateMetric(assignee.userUuid, 'overtime', Number(event.target.value))}
                          className={numberInputClass}
                          aria-label={`OT của ${assignee.fullName}`}
                        />
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-4 py-1.5 text-[13px] font-black ${
                            isTicked ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {isTicked ? 'Có mặt' : 'Chưa có'}
                        </span>
                        {row?.error ? (
                          <p className="mt-2 max-w-[280px] text-[13px] font-bold text-rose-600">{row.error}</p>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-[#1870FF]">
            <UsersRound size={30} />
          </span>
          <h3 className="mt-4 text-[19px] font-black text-slate-950">Chưa có nhân sự nào</h3>
          <p className="mt-2 max-w-md text-[14px] font-semibold text-slate-500">
            {UNASSIGNED_PERSONNEL_MESSAGE}
          </p>
        </div>
      )}
    </div>
  );
}

function StatBlock({
  icon,
  label,
  value,
  tone = 'blue',
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone?: 'blue' | 'green';
}) {
  const toneClass = {
    blue: 'bg-blue-50 text-[#1870FF]',
    green: 'bg-emerald-50 text-emerald-600',
  }[tone];

  return (
    <div className="flex min-w-0 items-center gap-4 border-slate-200 px-5 py-2 first:pl-0 md:border-r md:last:border-r-0">
      <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${toneClass}`}>
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[12px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</span>
        <span className={`mt-1 block text-[22px] font-black ${tone === 'blue' ? 'text-slate-950' : 'text-emerald-600'}`}>
          {value}
        </span>
      </span>
    </div>
  );
}
