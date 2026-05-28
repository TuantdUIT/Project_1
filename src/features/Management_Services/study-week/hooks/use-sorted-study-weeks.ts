import { useMemo } from 'react';
import type { StudyWeek } from '@/features/Management_Services/study-week/types';

export function useSortedStudyWeeks(studyWeeks: StudyWeek[] | undefined) {
  return useMemo(
    () =>
      [...(studyWeeks ?? [])].sort((a, b) => {
        const yearDiff = (b.school_year ?? 0) - (a.school_year ?? 0);
        if (yearDiff !== 0) return yearDiff;
        return (a.week_number ?? 0) - (b.week_number ?? 0);
      }),
    [studyWeeks],
  );
}

