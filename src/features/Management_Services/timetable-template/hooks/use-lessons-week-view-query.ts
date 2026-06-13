import { useMemo } from 'react';
import { useLessonTypesQuery } from '@/features/Management_Services/curriculum';
import { useLessonsQuery } from '@/features/Management_Services/study-week/api/lessons';
import type { Lesson } from '@/features/Management_Services/study-week/types';
import type { EmployeeRATemplateItem } from '@/features/Management_Services/employee-ra-template/types';
import {
  GRADE_BADGE_BY_ID,
  SUPPLEMENT_GRADE_IDS_BY_PRIMARY_ID,
  type PrimaryGradeId,
} from '@/features/Management_Services/timetable-template/lib/supplement-grades';
import { DAY_OF_WEEK_ORDER } from '@/features/Management_Services/timetable-template/lib/time';
import type { DayOfWeek, MergedTimetableItem } from '@/features/Management_Services/timetable-template/types';

/**
 * Ý nghĩa: Nguồn dữ liệu cho lưới calendar — đọc từ LESSON của tuần (frozen),
 * KHÔNG đọc từ timetable template (live). Nhờ đó calendar:
 *   - đúng giờ theo từng tuần (lesson_start_time đã frozen lúc tạo tuần),
 *   - không mất nhân sự (đọc employee_assignments, không qua slot matching),
 *   - không phụ thuộc grade-id/{id} hay apply_from "hiệu lực hôm nay".
 * Xem docs/fe-tickets/FE-P1-003-calendar-lesson-based.md
 */

function dayOfWeekFromDate(value?: string): DayOfWeek | undefined {
  if (!value) return undefined;
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return undefined;
  return DAY_OF_WEEK_ORDER[date.getDay()];
}

function lessonToItem(lesson: Lesson): MergedTimetableItem | null {
  const dayOfWeek = dayOfWeekFromDate(lesson.lesson_date);
  if (!dayOfWeek) return null;

  // employee_assignments (frozen) → shape personnel mà card/popover đang đọc.
  const personnel: EmployeeRATemplateItem[] = (lesson.employee_assignments ?? []).map((assignment) => ({
    user_uuid: assignment.user_uuid,
    full_name: assignment.full_name,
    email: assignment.email,
    role_name: assignment.role_name,
  }));

  const gradeId = lesson.grade?.id ?? 0;
  return {
    // Dùng lesson_uuid làm id để layout dedup ổn định.
    timetable_template_item_uuid: lesson.lesson_uuid,
    lesson_type_uuid: lesson.lesson_type?.lesson_type_uuid,
    lesson_type_name: lesson.lesson_type?.lesson_type_name,
    day_of_week: dayOfWeek,
    start_time: lesson.lesson_start_time,
    sort_order: 0,
    _source_grade_id: gradeId,
    _source_grade_name: lesson.grade?.name ?? GRADE_BADGE_BY_ID[gradeId] ?? `#${gradeId}`,
    _personnel: personnel,
  };
}

/**
 * Pure builder: lọc lesson theo tuần + (khối chính & khối phụ), map sang
 * MergedTimetableItem để TimetableGrid vẽ. Dùng được cả trong view "Tất cả"
 * (gọi trong vòng lặp) lẫn view theo khối.
 */
export function buildLessonWeekItems(
  lessons: Lesson[],
  weekUuid: string | undefined,
  primaryGradeId: PrimaryGradeId,
): MergedTimetableItem[] {
  if (!weekUuid) return [];
  const gradeIds = [primaryGradeId, ...SUPPLEMENT_GRADE_IDS_BY_PRIMARY_ID[primaryGradeId]];

  return lessons
    .filter(
      (lesson) =>
        lesson.study_week?.week_uuid === weekUuid
        && lesson.grade?.id != null
        && gradeIds.includes(lesson.grade.id),
    )
    .map(lessonToItem)
    .filter((item): item is MergedTimetableItem => item != null);
}

export function useLessonsWeekViewQuery(primaryGradeId: PrimaryGradeId, weekUuid?: string) {
  const lessonsQuery = useLessonsQuery();
  const lessonTypesQuery = useLessonTypesQuery();

  const items = useMemo(
    () => buildLessonWeekItems(lessonsQuery.data ?? [], weekUuid, primaryGradeId),
    [lessonsQuery.data, primaryGradeId, weekUuid],
  );

  return {
    items,
    lessonTypes: lessonTypesQuery.data ?? [],
    isLoading: lessonsQuery.isLoading || lessonTypesQuery.isLoading,
    isError: lessonsQuery.isError || lessonTypesQuery.isError,
    refetch: () => {
      lessonsQuery.refetch();
      lessonTypesQuery.refetch();
    },
  };
}
