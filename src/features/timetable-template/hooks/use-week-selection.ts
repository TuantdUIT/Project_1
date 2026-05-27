import { useEffect, useMemo } from 'react';
import dayjs from 'dayjs';
import { useSearchParams } from 'react-router';
import { useStudyWeeksQuery } from '@/features/study-week/api/study-weeks';
import type { StudyWeek } from '@/features/study-week/types';

function findDefaultWeek(weeks: StudyWeek[]) {
  const today = dayjs().format('YYYY-MM-DD');

  const currentWeek = weeks.find(
    (week) =>
      Boolean(week.week_start_date && week.week_end_date)
      && week.week_start_date! <= today
      && week.week_end_date! >= today,
  );
  if (currentWeek) return currentWeek;

  const latestPastWeek = [...weeks]
    .filter((week) => Boolean(week.week_start_date) && week.week_start_date! <= today)
    .sort((a, b) => (b.week_start_date ?? '').localeCompare(a.week_start_date ?? ''))[0];

  return latestPastWeek ?? weeks[0];
}

export function useWeekSelection() {
  const [searchParams, setSearchParams] = useSearchParams();
  const studyWeeksQuery = useStudyWeeksQuery();
  const weekUuidFromUrl = searchParams.get('week') ?? undefined;

  const weeks = useMemo(
    () =>
      [...(studyWeeksQuery.data ?? [])].sort((a, b) => {
        const yearDiff = (b.school_year ?? 0) - (a.school_year ?? 0);
        if (yearDiff !== 0) return yearDiff;
        return (a.week_number ?? 0) - (b.week_number ?? 0);
      }),
    [studyWeeksQuery.data],
  );

  const selectedWeek = useMemo(() => {
    if (!weeks.length) return undefined;
    return weeks.find((week) => week.week_uuid === weekUuidFromUrl) ?? findDefaultWeek(weeks);
  }, [weekUuidFromUrl, weeks]);

  useEffect(() => {
    if (!selectedWeek?.week_uuid || selectedWeek.week_uuid === weekUuidFromUrl) return;

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('week', selectedWeek.week_uuid);
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, selectedWeek?.week_uuid, setSearchParams, weekUuidFromUrl]);

  function setSelectedWeekUuid(weekUuid: string) {
    const nextParams = new URLSearchParams(searchParams);
    if (weekUuid) {
      nextParams.set('week', weekUuid);
    } else {
      nextParams.delete('week');
    }
    setSearchParams(nextParams);
  }

  return {
    selectedWeek,
    setSelectedWeekUuid,
    weeks,
    isLoading: studyWeeksQuery.isLoading,
  };
}
