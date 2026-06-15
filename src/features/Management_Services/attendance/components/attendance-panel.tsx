import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Filter,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  UsersRound,
} from 'lucide-react';
import { createAttendance, deleteAttendance, useAttendancesQuery } from '@/features/Management_Services/attendance/api/attendances';
import type { Attendance } from '@/features/Management_Services/attendance/types';
import { useStudentsQuery } from '@/features/Management_Services/admin/api/students';
import type { ResStudentDTO } from '@/features/Management_Services/admin/types';
import { lessonsKey } from '@/features/Management_Services/study-week/api/lessons';
import type { Lesson } from '@/features/Management_Services/study-week/types';
import { formatDate, formatDateTime, formatTime } from '@/utils/date';
import { parseApiError } from '@/utils/api-errors';
import AttendanceToast, { type AttendanceToastState } from './attendance-toast';

type GradeLike = {
  id?: number;
  grade_id?: number;
  name?: string;
  grade_name?: string;
};

type AttendanceRowState = {
  initiallyTicked: boolean;
  currentlyTicked: boolean;
  attendanceUuid?: string;
  error?: string;
};

type SaveOperation =
  | {
      type: 'create';
      userUuid: string;
      run: () => Promise<Attendance>;
    }
  | {
      type: 'delete';
      userUuid: string;
      attendanceUuid: string;
      run: () => Promise<void>;
    };

type StatusFilter = 'ALL' | 'ATTENDED' | 'NOT_ATTENDED';

function getGradeId(grade?: GradeLike) {
  return grade?.id ?? grade?.grade_id;
}

function getGradeName(grade?: GradeLike) {
  return grade?.name ?? grade?.grade_name ?? '-';
}

function isDuplicateAttendanceError(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes('da duoc diem danh') || normalized.includes('đã được điểm danh');
}

function getStudentPeriodErrorMessage(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes('period')) {
    return 'Học sinh này chưa đăng ký Period phù hợp cho buổi học này. Liên hệ quản lý.';
  }

  return message;
}

function studentHasGrade(student: ResStudentDTO, gradeId?: number) {
  if (!gradeId) return false;

  return (student.grades ?? []).some((grade) => getGradeId(grade as GradeLike) === gradeId);
}

function normalizeLessonStartTime(value?: string) {
  if (!value) return undefined;

  const trimmed = value.trim();
  if (/^\d{2}:\d{2}$/.test(trimmed)) return `${trimmed}:00`;
  if (/^\d{2}:\d{2}:\d{2}$/.test(trimmed)) return trimmed;

  return undefined;
}

function getLessonAttendanceTime(lesson: Lesson) {
  const startTime = normalizeLessonStartTime(lesson.lesson_start_time);
  if (!lesson.lesson_date || !startTime) return undefined;

  return `${lesson.lesson_date}T${startTime}`;
}

function formatStudentAttendanceTime(value?: string) {
  if (!value) return '-';

  const [datePart, timePart] = value.split('T');
  const time = formatTime(timePart ?? value, '');
  const date = formatDate(datePart || value, '');

  if (time && date) return `${time} ${date}`;
  return formatDateTime(value, '-');
}

function getSearchText(student: ResStudentDTO) {
  return [
    student.student_id,
    student.user_fullname,
    student.user_email,
    student.user_phone_number,
    student.parent_name,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
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
  tone?: 'blue' | 'green' | 'orange';
}) {
  const toneClass = {
    blue: 'bg-blue-50 text-[#1870FF]',
    green: 'bg-emerald-50 text-emerald-600',
    orange: 'bg-orange-50 text-orange-600',
  }[tone];

  return (
    <div className="flex min-w-0 items-center gap-4 border-slate-200 px-5 py-2 first:pl-0 md:border-r md:last:border-r-0">
      <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${toneClass}`}>
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[12px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</span>
        <span className={`mt-1 block text-[22px] font-black ${tone === 'blue' ? 'text-slate-950' : toneClass.split(' ')[1]}`}>
          {value}
        </span>
      </span>
    </div>
  );
}

export default function AttendancePanel({ lesson }: { lesson: Lesson }) {
  const queryClient = useQueryClient();
  const lessonUuid = lesson.lesson_uuid ?? '';
  const gradeId = getGradeId(lesson.grade as GradeLike);
  const schoolYear = lesson.study_week?.school_year;
  const lessonAttendanceTime = getLessonAttendanceTime(lesson);
  const studentsQuery = useStudentsQuery({
    studentStatus: 'ACTIVE',
    schoolYear,
    page: 1,
    size: 2000,
  });
  const attendancesQuery = useAttendancesQuery();
  const [rows, setRows] = useState<Record<string, AttendanceRowState>>({});
  const [pendingTicks, setPendingTicks] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<AttendanceToastState | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  const eligibleStudents = useMemo(
    () =>
      (studentsQuery.data?.result ?? [])
        .filter((student) => student.student_status === 'ACTIVE' && studentHasGrade(student, gradeId))
        .sort((a, b) =>
          `${a.student_id ?? ''} ${a.user_fullname ?? ''}`.localeCompare(
            `${b.student_id ?? ''} ${b.user_fullname ?? ''}`,
          ),
        ),
    [gradeId, studentsQuery.data?.result],
  );

  const attendancesOfLesson = useMemo(
    () =>
      (attendancesQuery.data ?? []).filter(
        (attendance) => attendance.lesson?.lesson_uuid === lessonUuid,
      ),
    [attendancesQuery.data, lessonUuid],
  );

  const attendanceByStudentUuid = useMemo(() => {
    const attendanceMap = new Map<string, Attendance>();

    attendancesOfLesson.forEach((attendance) => {
      const userUuid = attendance.student?.user_uuid;
      if (userUuid) {
        attendanceMap.set(userUuid, attendance);
      }
    });

    return attendanceMap;
  }, [attendancesOfLesson]);

  useEffect(() => {
    const nextRows: Record<string, AttendanceRowState> = {};

    eligibleStudents.forEach((student) => {
      const userUuid = student.user_uuid;
      if (!userUuid) return;

      const attendance = attendanceByStudentUuid.get(userUuid);
      nextRows[userUuid] = {
        initiallyTicked: Boolean(attendance?.attendance_uuid),
        currentlyTicked: Boolean(attendance?.attendance_uuid),
        attendanceUuid: attendance?.attendance_uuid,
      };
    });

    setRows(nextRows);
    setPendingTicks({});
    setSaveMessage(null);
  }, [attendanceByStudentUuid, eligibleStudents]);

  const filteredStudents = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return eligibleStudents.filter((student) => {
      const userUuid = student.user_uuid ?? '';
      const isTicked = pendingTicks[userUuid] ?? Boolean(rows[userUuid]?.currentlyTicked);
      const matchesSearch = !normalizedSearch || getSearchText(student).includes(normalizedSearch);
      const matchesStatus =
        statusFilter === 'ALL'
        || (statusFilter === 'ATTENDED' && isTicked)
        || (statusFilter === 'NOT_ATTENDED' && !isTicked);

      return matchesSearch && matchesStatus;
    });
  }, [eligibleStudents, rows, pendingTicks, searchTerm, statusFilter]);

  const selectedCount = useMemo(
    () => Object.values(rows).filter((row) => row.currentlyTicked).length,
    [rows],
  );
  const dirtyCount = useMemo(
    () =>
      Object.entries(pendingTicks).filter(
        ([uuid, next]) => next !== Boolean(rows[uuid]?.initiallyTicked),
      ).length,
    [pendingTicks, rows],
  );
  const isLoading = studentsQuery.isLoading || attendancesQuery.isLoading;
  const isError = studentsQuery.isError || attendancesQuery.isError;
  const isAllFilteredSelected =
    filteredStudents.length > 0
    && filteredStudents.every((student) => {
      const uuid = student.user_uuid ?? '';
      return pendingTicks[uuid] ?? Boolean(rows[uuid]?.currentlyTicked);
    });

  function showAttendanceToast(message: string, tone: AttendanceToastState['tone']) {
    setToast({ id: Date.now(), message, tone });
  }

  function resetChanges() {
    setPendingTicks({});
    setRows((currentRows) =>
      Object.fromEntries(
        Object.entries(currentRows).map(([userUuid, row]) => [
          userUuid,
          { ...row, currentlyTicked: row.initiallyTicked, error: undefined },
        ]),
      ),
    );
    setSaveMessage(null);
  }

  async function saveAttendance() {
    if (!lessonUuid || isSaving) return;

    const mergedRows: Record<string, AttendanceRowState> = Object.fromEntries(
      Object.entries(rows).map(([uuid, row]) => [
        uuid,
        uuid in pendingTicks
          ? { ...row, currentlyTicked: pendingTicks[uuid], error: undefined }
          : row,
      ]),
    );

    setRows(mergedRows);
    setPendingTicks({});

    const operations = Object.entries(mergedRows).reduce<SaveOperation[]>((acc, [userUuid, row]) => {
      if (!row.initiallyTicked && row.currentlyTicked) {
        acc.push({
          type: 'create',
          userUuid,
          run: () => createAttendance({ userUuid, lessonUuid, attendanceTime: lessonAttendanceTime }),
        });
        return acc;
      }

      if (row.initiallyTicked && !row.currentlyTicked && row.attendanceUuid) {
        acc.push({
          type: 'delete',
          userUuid,
          attendanceUuid: row.attendanceUuid,
          run: () => deleteAttendance(String(row.attendanceUuid)),
        });
        return acc;
      }

      return acc;
    }, []);

    if (!operations.length) {
      setSaveMessage('Không có thay đổi cần lưu.');
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);
    setRows((currentRows) =>
      Object.fromEntries(
        Object.entries(currentRows).map(([userUuid, row]) => [
          userUuid,
          { ...row, error: undefined },
        ]),
      ),
    );

    const results = await Promise.all(
      operations.map(async (operation) => {
        try {
          const data = await operation.run();
          return { operation, data, error: null };
        } catch (error) {
          return { operation, data: null, error };
        }
      }),
    );

    let successCount = 0;
    let createSuccessCount = 0;
    let deleteSuccessCount = 0;
    let duplicateCount = 0;
    let failureCount = 0;
    let shouldRefresh = false;
    const rowPatches: Record<string, Partial<AttendanceRowState>> = {};

    results.forEach(({ operation, data, error }) => {
      if (!error) {
        successCount += 1;
        shouldRefresh = true;

        if (operation.type === 'create') {
          createSuccessCount += 1;
          rowPatches[operation.userUuid] = {
            initiallyTicked: true,
            currentlyTicked: true,
            attendanceUuid: data?.attendance_uuid,
            error: undefined,
          };
        } else {
          deleteSuccessCount += 1;
          rowPatches[operation.userUuid] = {
            initiallyTicked: false,
            currentlyTicked: false,
            attendanceUuid: undefined,
            error: undefined,
          };
        }
        return;
      }

      const parsedError = parseApiError(error);
      if (operation.type === 'create' && isDuplicateAttendanceError(parsedError.message)) {
        duplicateCount += 1;
        createSuccessCount += 1;
        shouldRefresh = true;
        rowPatches[operation.userUuid] = {
          currentlyTicked: true,
          error: undefined,
        };
        return;
      }

      failureCount += 1;
      rowPatches[operation.userUuid] = {
        error: getStudentPeriodErrorMessage(parsedError.message),
      };
    });

    setRows((currentRows) => {
      const nextRows = { ...currentRows };

      Object.entries(rowPatches).forEach(([userUuid, patch]) => {
        nextRows[userUuid] = {
          ...nextRows[userUuid],
          ...patch,
        };
      });

      return nextRows;
    });

    if (shouldRefresh) {
      await attendancesQuery.refetch();
      await queryClient.invalidateQueries({ queryKey: lessonsKey });
    }

    if (createSuccessCount) {
      showAttendanceToast(`Điểm danh ${createSuccessCount} học sinh`, 'success');
    }
    if (deleteSuccessCount) {
      showAttendanceToast(`Bỏ điểm danh ${deleteSuccessCount} học sinh`, 'warning');
    }

    if (failureCount) {
      setSaveMessage(`Đã lưu ${successCount + duplicateCount}/${operations.length} thay đổi. Kiểm tra các dòng báo lỗi.`);
    } else {
      setSaveMessage(null);
    }

    setIsSaving(false);
  }

  return (
    <div className="space-y-5">
      <AttendanceToast toast={toast} onClose={() => setToast(null)} />

      <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="grid gap-4 md:grid-cols-2">
          <StatBlock icon={<UsersRound size={24} />} label="Học sinh" value={eligibleStudents.length} />
          <StatBlock icon={<CheckCircle2 size={24} />} label="Đã điểm danh" value={selectedCount} tone="green" />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={resetChanges}
            disabled={isLoading || isSaving || !dirtyCount}
            className="inline-flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 text-[15px] font-extrabold text-slate-700 transition hover:border-[#1870FF] hover:text-[#1870FF] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCcw size={20} />
            Hoàn tác
          </button>
          <button
            type="button"
            onClick={saveAttendance}
            disabled={isLoading || isSaving || !dirtyCount}
            className="inline-flex h-12 items-center gap-3 rounded-xl bg-[#1870FF] px-6 text-[15px] font-extrabold text-white shadow-[0_14px_26px_rgba(24,112,255,0.28)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? <RefreshCw size={20} className="animate-spin" /> : <Save size={20} />}
            Lưu thay đổi
          </button>
        </div>
      </div>

      {saveMessage ? (
        <p className="rounded-xl border border-[#1870FF]/20 bg-[#1870FF]/5 px-4 py-3 text-[13px] font-bold text-[#145fd8]">
          {saveMessage}
        </p>
      ) : null}

      {isError ? (
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p className="text-[13px] font-bold">Không tải được dữ liệu điểm danh. Vui lòng thử lại.</p>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative block w-full sm:max-w-[320px]">
          <Search size={22} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 text-[15px] font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1870FF] focus:ring-4 focus:ring-[rgba(24,112,255,0.12)]"
            placeholder="Tìm học sinh..."
          />
        </label>
        <label className="relative block w-full sm:max-w-[220px]">
          <Filter size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-12 pr-4 text-[15px] font-extrabold text-slate-700 outline-none transition focus:border-[#1870FF] focus:ring-4 focus:ring-[rgba(24,112,255,0.12)]"
          >
            <option value="ALL">Trạng thái</option>
            <option value="ATTENDED">Có mặt</option>
            <option value="NOT_ATTENDED">Chưa điểm danh</option>
          </select>
        </label>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="bg-slate-50 text-[12px] font-black uppercase tracking-[0.08em] text-slate-500">
              <tr>
                <th className="w-16 px-5 py-4">
                  <input
                    type="checkbox"
                    checked={isAllFilteredSelected}
                    disabled={isLoading || isSaving || !filteredStudents.length}
                    onChange={(event) => {
                      const next = event.target.checked;
                      setPendingTicks((prev) => {
                        const draft = { ...prev };
                        filteredStudents.forEach((student) => {
                          const uuid = student.user_uuid ?? '';
                          if (uuid) draft[uuid] = next;
                        });
                        return draft;
                      });
                      setSaveMessage(null);
                    }}
                    className="h-5 w-5 rounded border-slate-300 accent-[#1870FF]"
                    aria-label="Chọn tất cả học sinh đang hiển thị"
                  />
                </th>
                <th className="px-5 py-4">Mã HS</th>
                <th className="px-5 py-4">Học sinh</th>
                <th className="px-5 py-4">Khối</th>
                <th className="px-5 py-4">Thời gian điểm danh</th>
                <th className="px-5 py-4">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredStudents.map((student) => {
                const userUuid = student.user_uuid ?? '';
                const row = rows[userUuid];
                const attendance = attendanceByStudentUuid.get(userUuid);
                const isTicked = pendingTicks[userUuid] ?? Boolean(row?.currentlyTicked);

                return (
                  <tr key={userUuid || student.student_id} className="transition hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <input
                        type="checkbox"
                        checked={isTicked}
                        disabled={!userUuid || isLoading || isSaving}
                        onChange={(event) => {
                          const next = event.target.checked;
                          setPendingTicks((prev) => ({ ...prev, [userUuid]: next }));
                          setSaveMessage(null);
                        }}
                        className="h-5 w-5 rounded border-slate-300 accent-[#1870FF]"
                        aria-label={`Điểm danh ${student.user_fullname ?? student.student_id ?? 'học sinh'}`}
                      />
                    </td>
                    <td className="px-5 py-4 text-[16px] font-black text-slate-800">{student.student_id ?? '-'}</td>
                    <td className="px-5 py-4">
                      <p className="text-[15px] font-black text-slate-950">{student.user_fullname ?? '-'}</p>
                      <p className="mt-1 text-[14px] font-semibold text-slate-500">{student.user_email ?? student.user_phone_number ?? '-'}</p>
                    </td>
                    <td className="px-5 py-4 text-[15px] font-black text-slate-900">
                      {(student.grades ?? []).map((grade) => getGradeName(grade as GradeLike)).join(', ') || '-'}
                    </td>
                    <td className="px-5 py-4 text-[15px] font-bold text-slate-500">
                      {isTicked ? formatStudentAttendanceTime(attendance?.attendance_time ?? lessonAttendanceTime) : '-'}
                    </td>
                    <td className="px-5 py-4">
                      {row?.error ? (
                        <p className="max-w-[300px] text-[13px] font-bold text-rose-600">{row.error}</p>
                      ) : isTicked ? (
                        <span className="inline-flex rounded-full bg-emerald-50 px-4 py-1.5 text-[13px] font-black text-emerald-700">
                          Có mặt
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-slate-100 px-4 py-1.5 text-[13px] font-black text-slate-600">
                          Chưa điểm danh
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {isLoading ? (
          <p className="px-5 py-6 text-center text-[14px] font-semibold text-slate-500">
            Đang tải học sinh và dữ liệu điểm danh...
          </p>
        ) : null}

        {!isLoading && !isError && !filteredStudents.length ? (
          <p className="px-5 py-6 text-center text-[14px] font-semibold text-slate-500">
            Không có học sinh phù hợp với bộ lọc hiện tại.
          </p>
        ) : null}
      </div>
    </div>
  );
}
