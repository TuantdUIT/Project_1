import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, RefreshCw, RotateCcw, Save, UsersRound } from 'lucide-react';
import { useToggleRecordAttendance } from '@/features/attendance/api/record-attendances';
import type { EmployeeRATemplateItem } from '@/features/employee-ra-template/types';
import { UNASSIGNED_PERSONNEL_MESSAGE } from '@/features/study-week/lib/lesson-personnel';
import type { Lesson } from '@/features/study-week/types';
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
  'h-11 w-24 rounded-xl border border-slate-200 bg-white px-3 text-center text-[15px] font-black text-slate-950 outline-none transition focus:border-[#1870FF] focus:ring-4 focus:ring-[rgba(24,112,255,0.12)]';

function extractErrorMessage(error: unknown) {
  return parseApiError(error).message;
}

function getDefaultLessonTime(lesson: Lesson) {
  return lesson.lesson_type?.lesson_time ?? lesson.real_lesson_length ?? 0;
}

function buildAssigneeRows(
  lesson: Lesson,
  templatePersonnel: EmployeeRATemplateItem[] | undefined,
): AssigneeRow[] {
  if (templatePersonnel?.length) {
    return templatePersonnel
      .filter((personnel) => Boolean(personnel.user_uuid))
      .map((personnel) => ({
        userUuid: personnel.user_uuid ?? '',
        fullName: personnel.full_name ?? personnel.email ?? 'Nhân sự',
        email: personnel.email,
        roleName: personnel.role_name,
      }));
  }

  return (lesson.employee_assignments ?? [])
    .filter((assignment) => Boolean(assignment.user_uuid))
    .map((assignment) => ({
      userUuid: assignment.user_uuid ?? '',
      fullName: assignment.full_name ?? assignment.email ?? 'Nhân sự',
      email: assignment.email,
      roleName: assignment.role_name,
    }));
}

export default function RecordAttendancePanel({
  lesson,
  templatePersonnel,
  isTemplatePersonnelLoading = false,
  isTemplatePersonnelError = false,
}: {
  lesson: Lesson;
  templatePersonnel?: EmployeeRATemplateItem[];
  isTemplatePersonnelLoading?: boolean;
  isTemplatePersonnelError?: boolean;
}) {
  const initialAssignees = useMemo(
    () => buildAssigneeRows(lesson, templatePersonnel),
    [lesson, templatePersonnel],
  );
  const defaultLessonTime = getDefaultLessonTime(lesson);
  const [assignees, setAssignees] = useState<AssigneeRow[]>([]);
  const [rows, setRows] = useState<Record<string, RecordRow>>({});
  const [pendingTicks, setPendingTicks] = useState<Record<string, boolean>>({});
  const [pendingMetrics, setPendingMetrics] = useState<Record<string, PendingMetrics>>({});
  const [toast, setToast] = useState<AttendanceToastState | null>(null);
  const toggleRecordAttendance = useToggleRecordAttendance();

  useEffect(() => {
    setAssignees(initialAssignees);
    setRows(
      Object.fromEntries(
        initialAssignees.map((assignee) => [
          assignee.userUuid,
          {
            initiallyTicked: false,
            currentlyTicked: false,
            initialLessonTime: defaultLessonTime,
            initialOvertime: 0,
          },
        ]),
      ),
    );
    setPendingTicks({});
    setPendingMetrics({});
  }, [defaultLessonTime, initialAssignees]);

  const presentCount = useMemo(
    () => Object.values(rows).filter((row) => row.currentlyTicked).length,
    [rows],
  );
  const dirtyCount = useMemo(
    () =>
      assignees.filter((assignee) => {
        const row = rows[assignee.userUuid];
        if (!row) return false;

        const nextTicked = pendingTicks[assignee.userUuid] ?? row.currentlyTicked;
        return nextTicked !== row.initiallyTicked;
      }).length,
    [assignees, pendingTicks, rows],
  );

  function showAttendanceToast(message: string, tone: AttendanceToastState['tone']) {
    setToast({ id: Date.now(), message, tone });
  }

  function updateMetric(userUuid: string, field: keyof PendingMetrics, value: number) {
    setPendingMetrics((current) => ({
      ...current,
      [userUuid]: {
        ...current[userUuid],
        [field]: Math.max(value, 0),
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
    if (!dirtyCount || toggleRecordAttendance.isPending || !lessonUuid) return;

    const changedAssignees = assignees.filter((assignee) => {
      const row = rows[assignee.userUuid];
      if (!row) return false;

      const nextTicked = pendingTicks[assignee.userUuid] ?? row.currentlyTicked;
      return nextTicked !== row.initiallyTicked;
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
        if (row.initiallyTicked && !row.raAttdUuid) {
          throw new Error('Không tìm thấy mã điểm danh để bỏ điểm danh nhân sự này.');
        }

        return toggleRecordAttendance.toggle({
          currentRaUuid: row.initiallyTicked ? row.raAttdUuid : undefined,
          createPayload: {
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

    results.forEach((result, index) => {
      const assignee = changedAssignees[index];
      if (!assignee) return;
      const row = rows[assignee.userUuid];
      if (!row) return;

      if (result.status === 'fulfilled') {
        const metrics = pendingMetrics[assignee.userUuid] ?? {};
        const nextTicked = !row.initiallyTicked;
        if (nextTicked) {
          checkedCount += 1;
        } else {
          uncheckedCount += 1;
        }

        successPatches[assignee.userUuid] = {
          initiallyTicked: nextTicked,
          currentlyTicked: nextTicked,
          initialLessonTime: metrics.lessonTime ?? row.initialLessonTime ?? defaultLessonTime,
          initialOvertime: metrics.overtime ?? row.initialOvertime ?? 0,
          raAttdUuid: nextTicked ? result.value?.ra_attd_uuid : undefined,
          error: undefined,
        };
        return;
      }

      failedUserUuids.add(assignee.userUuid);
      successPatches[assignee.userUuid] = {
        currentlyTicked: true,
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
            disabled={toggleRecordAttendance.isPending || !dirtyCount}
            className="inline-flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 text-[15px] font-extrabold text-slate-700 transition hover:border-[#1870FF] hover:text-[#1870FF] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCcw size={20} />
            Hoàn tác
          </button>
          <button
            type="button"
            onClick={saveDraft}
            disabled={toggleRecordAttendance.isPending || !dirtyCount}
            className="inline-flex h-12 items-center gap-3 rounded-xl bg-[#1870FF] px-6 text-[15px] font-extrabold text-white shadow-[0_14px_26px_rgba(24,112,255,0.28)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {toggleRecordAttendance.isPending ? <RefreshCw size={20} className="animate-spin" /> : <Save size={20} />}
            Lưu thay đổi
          </button>
        </div>
      </div>

      {isTemplatePersonnelLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-8 text-center text-[14px] font-bold text-slate-500">
          Đang tải nhân sự...
        </div>
      ) : assignees.length && !isTemplatePersonnelError ? (
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
                  const lessonTime = metrics.lessonTime ?? row?.initialLessonTime ?? 0;
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
                          aria-label={`Số tiết của ${assignee.fullName}`}
                        />
                      </td>
                      <td className="px-5 py-4">
                        <input
                          type="number"
                          min={0}
                          value={overtime}
                          onChange={(event) => updateMetric(assignee.userUuid, 'overtime', Number(event.target.value))}
                          className={numberInputClass}
                          aria-label={`OT của ${assignee.fullName}`}
                        />
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full px-4 py-1.5 text-[13px] font-black ${
                          isTicked
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
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
