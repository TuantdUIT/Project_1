import { type KeyboardEvent, useEffect, useState } from 'react';
import { Edit3, UsersRound } from 'lucide-react';
import { paths } from '@/config/paths';
import type { EmployeeRATemplateItem } from '@/features/employee-ra-template/types';
import { useUpdateLesson } from '@/features/study-week/api/lessons';
import {
  formatLessonDate,
  formatLessonTime,
  getLessonEndTime,
  getLessonLengthFromEndTime,
  normalizeTwentyFourHourInput,
} from '@/features/study-week/lib/format-week';
import { UNASSIGNED_PERSONNEL_MESSAGE } from '@/features/study-week/lib/lesson-personnel';
import {
  getEffectiveLessonStatus,
  getLessonStatusClass,
  getLessonStatusLabel,
} from '@/features/study-week/lib/lesson-status';
import type { Lesson } from '@/features/study-week/types';
import { formatWeekday } from '@/utils/date';

function formatLessonWeekday(lesson: Lesson) {
  const weekday = formatWeekday(lesson.lesson_date);
  if (weekday === '-') return weekday;
  return weekday.charAt(0).toUpperCase() + weekday.slice(1);
}

export default function LessonRow({
  lesson,
  weekUuid,
  gradeId,
  personnel = [],
  isPersonnelLoading = false,
  isPersonnelError = false,
  onOpen,
}: {
  lesson: Lesson;
  weekUuid: string;
  gradeId: number;
  personnel?: EmployeeRATemplateItem[];
  isPersonnelLoading?: boolean;
  isPersonnelError?: boolean;
  onOpen: (url: string) => void;
}) {
  const updateLesson = useUpdateLesson();
  const [isEditing, setIsEditing] = useState(false);
  const [endTimeValue, setEndTimeValue] = useState(
    getLessonEndTime(lesson.lesson_start_time, lesson.real_lesson_length),
  );
  const lessonUuid = lesson.lesson_uuid ?? '';
  const lessonStatus = getEffectiveLessonStatus(lesson);

  useEffect(() => {
    setEndTimeValue(getLessonEndTime(lesson.lesson_start_time, lesson.real_lesson_length));
  }, [lesson.lesson_start_time, lesson.real_lesson_length]);

  async function saveEndTime() {
    const realLessonLength = getLessonLengthFromEndTime(lesson.lesson_start_time, endTimeValue);
    if (!lessonUuid || realLessonLength == null) {
      setEndTimeValue(getLessonEndTime(lesson.lesson_start_time, lesson.real_lesson_length));
      setIsEditing(false);
      return;
    }

    await updateLesson.mutateAsync({
      lessonUuid,
      body: { realLessonLength },
    });
    setIsEditing(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      saveEndTime();
    }

    if (event.key === 'Escape') {
      setIsEditing(false);
      setEndTimeValue(getLessonEndTime(lesson.lesson_start_time, lesson.real_lesson_length));
    }
  }

  return (
    <tr
      className="cursor-pointer transition hover:bg-slate-50"
      onClick={() => {
        if (lessonUuid && !isEditing) {
          onOpen(paths.adminPortalStudyWeekLesson(weekUuid, gradeId, lessonUuid));
        }
      }}
    >
      <td className="px-5 py-4 text-[14px] font-black text-slate-800">
        {formatLessonWeekday(lesson)}
      </td>
      <td className="px-5 py-4 text-[14px] font-bold text-slate-900">
        {formatLessonDate(lesson)}
      </td>
      <td className="px-5 py-4 text-[14px] font-bold text-slate-700">
        {formatLessonTime(lesson.lesson_start_time)}
      </td>
      <td className="px-5 py-4 text-[14px] font-bold text-slate-700">
        {lesson.lesson_type?.lesson_type_name ?? '-'}
      </td>
      <td className="px-5 py-4">
        <LessonPersonnelCell
          personnel={personnel}
          isLoading={isPersonnelLoading}
          isError={isPersonnelError}
        />
      </td>
      <td className="px-5 py-4 text-[14px] font-bold text-slate-700">
        {isEditing ? (
          <input
            type="text"
            inputMode="numeric"
            placeholder="HH:mm"
            maxLength={5}
            value={endTimeValue}
            onClick={(event) => event.stopPropagation()}
            onChange={(event) => setEndTimeValue(normalizeTwentyFourHourInput(event.target.value))}
            onBlur={saveEndTime}
            onKeyDown={handleKeyDown}
            className="h-9 w-32 rounded-lg border border-slate-300 px-3 text-[14px] font-bold outline-none focus:border-[#1870FF] focus:ring-4 focus:ring-[rgba(24,112,255,0.14)]"
            autoFocus
          />
        ) : (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setIsEditing(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-slate-700 transition hover:bg-slate-100"
          >
            {getLessonEndTime(lesson.lesson_start_time, lesson.real_lesson_length) || '--:--'}
            <Edit3 size={14} />
          </button>
        )}
      </td>
      <td className="px-5 py-4">
        <span className={`inline-flex rounded-full px-4 py-1.5 text-[13px] font-black ${getLessonStatusClass(lessonStatus)}`}>
          {getLessonStatusLabel(lessonStatus)}
        </span>
      </td>
    </tr>
  );
}

function LessonPersonnelCell({
  personnel,
  isLoading,
  isError,
}: {
  personnel: EmployeeRATemplateItem[];
  isLoading: boolean;
  isError: boolean;
}) {
  if (isLoading) {
    return <span className="text-[13px] font-bold text-slate-500">Dang tai nhan su...</span>;
  }

  if (isError || !personnel.length) {
    return <span className="text-[13px] font-bold text-amber-700">{UNASSIGNED_PERSONNEL_MESSAGE}</span>;
  }

  return (
    <div className="max-w-[360px] space-y-1.5">
      {personnel.map((item, index) => (
        <div
          key={item.employee_ra_template_item_uuid ?? `${item.user_uuid ?? 'person'}-${index}`}
          className="flex max-w-full items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1.5 text-[12px] font-black text-[#1870FF]"
        >
          <UsersRound size={13} strokeWidth={2.5} className="shrink-0" />
          <span className="truncate">{item.full_name || item.email || 'Nhan su'}</span>
          {item.role_name ? (
            <span className="shrink-0 text-[10px] uppercase text-blue-500/80">· {item.role_name}</span>
          ) : null}
        </div>
      ))}
    </div>
  );
}
