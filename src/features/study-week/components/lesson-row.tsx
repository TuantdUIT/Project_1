import { type KeyboardEvent, useState } from 'react';
import { Edit3 } from 'lucide-react';
import { paths } from '@/config/paths';
import { useUpdateLesson } from '@/features/study-week/api/lessons';
import { formatLessonDate, formatLessonTime } from '@/features/study-week/lib/format-week';
import type { Lesson } from '@/features/study-week/types';

export default function LessonRow({
  lesson,
  weekUuid,
  gradeId,
  onOpen,
}: {
  lesson: Lesson;
  weekUuid: string;
  gradeId: number;
  onOpen: (url: string) => void;
}) {
  const updateLesson = useUpdateLesson();
  const [isEditing, setIsEditing] = useState(false);
  const [lengthValue, setLengthValue] = useState(
    lesson.real_lesson_length != null ? String(lesson.real_lesson_length) : '',
  );
  const lessonUuid = lesson.lesson_uuid ?? '';

  async function saveLength() {
    const realLessonLength = Number(lengthValue);
    if (!lessonUuid || !Number.isFinite(realLessonLength) || realLessonLength < 0) return;

    await updateLesson.mutateAsync({
      lessonUuid,
      body: { realLessonLength },
    });
    setIsEditing(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      saveLength();
    }
    if (event.key === 'Escape') {
      setIsEditing(false);
      setLengthValue(lesson.real_lesson_length != null ? String(lesson.real_lesson_length) : '');
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
      <td className="px-5 py-4 text-[14px] font-bold text-slate-900">
        {formatLessonDate(lesson)}
      </td>
      <td className="px-5 py-4 text-[14px] font-bold text-slate-700">
        {formatLessonTime(lesson.lesson_start_time)}
      </td>
      <td className="px-5 py-4 text-[14px] font-bold text-slate-700">
        {lesson.lesson_type?.lesson_type_name ?? '-'}
      </td>
      <td className="px-5 py-4 text-[14px] font-bold text-slate-700">
        {isEditing ? (
          <input
            type="number"
            min={0}
            value={lengthValue}
            onClick={(event) => event.stopPropagation()}
            onChange={(event) => setLengthValue(event.target.value)}
            onBlur={saveLength}
            onKeyDown={handleKeyDown}
            className="h-9 w-24 rounded-lg border border-slate-300 px-3 text-[14px] font-bold outline-none focus:border-[#1870FF] focus:ring-4 focus:ring-[rgba(24,112,255,0.14)]"
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
            {lesson.real_lesson_length ? `${lesson.real_lesson_length}'` : 'Chưa diễn ra'}
            <Edit3 size={14} />
          </button>
        )}
      </td>
    </tr>
  );
}
