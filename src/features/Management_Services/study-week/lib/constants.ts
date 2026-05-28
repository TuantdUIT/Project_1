export const STUDY_WEEK_GRADE_IDS = [1, 2, 3, 4, 5] as const;
export type StudyWeekGradeId = (typeof STUDY_WEEK_GRADE_IDS)[number];
export const DEFAULT_STUDY_WEEK_GRADE_ID: StudyWeekGradeId = 1;

export const STUDY_WEEK_GRADE_LABEL: Record<StudyWeekGradeId, string> = {
  1: 'K10',
  2: 'K11',
  3: 'K12',
  4: 'VDC',
  5: 'DGNL',
};

export function isStudyWeekGradeId(value: number): value is StudyWeekGradeId {
  return STUDY_WEEK_GRADE_IDS.includes(value as StudyWeekGradeId);
}

