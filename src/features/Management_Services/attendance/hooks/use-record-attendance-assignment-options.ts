import { useMemo } from 'react';
import type { Lesson } from '@/features/Management_Services/study-week/types';

export type AssignedStaffOption = {
  userUuid: string;
  fullName?: string;
  email?: string;
  roleName?: string;
};

function addToMapSet(map: Map<string, Set<string>>, key: string, value: string) {
  const set = map.get(key) ?? new Set<string>();
  set.add(value);
  map.set(key, set);
}

function staffFromLessonAssignment(
  assignment: NonNullable<Lesson['employee_assignments']>[number],
): AssignedStaffOption | null {
  if (!assignment.user_uuid) return null;

  return {
    userUuid: assignment.user_uuid,
    fullName: assignment.full_name,
    email: assignment.email,
    roleName: assignment.role_name,
  };
}

export function useRecordAttendanceAssignmentOptions(lessons: Lesson[]) {
  const assignmentOptions = useMemo(() => {
    const lessonToUserUuids = new Map<string, Set<string>>();
    const userToLessonUuids = new Map<string, Set<string>>();
    const assignedStaffByUuid = new Map<string, AssignedStaffOption>();

    for (const lesson of lessons) {
      const lessonUuid = lesson.lesson_uuid;
      if (!lessonUuid) continue;

      const staffList = (lesson.employee_assignments ?? [])
        .map(staffFromLessonAssignment)
        .filter((staff): staff is AssignedStaffOption => Boolean(staff));

      for (const staff of staffList) {
        assignedStaffByUuid.set(staff.userUuid, {
          ...assignedStaffByUuid.get(staff.userUuid),
          ...staff,
        });
        addToMapSet(lessonToUserUuids, lessonUuid, staff.userUuid);
        addToMapSet(userToLessonUuids, staff.userUuid, lessonUuid);
      }
    }

    return {
      assignedStaffByUuid,
      lessonToUserUuids,
      userToLessonUuids,
    };
  }, [lessons]);

  return {
    ...assignmentOptions,
    isLoading: false,
    isError: false,
  };
}
