import type { components } from '@/types/openapi_MS';

export type StudyWeek = components['schemas']['ResStudyWeekDTO'];
export type ReqCreateStudyWeekDTO = components['schemas']['ReqCreateStudyWeekDTO'];
export type ReqUpdateStudyWeekDTO = components['schemas']['ReqUpdateStudyWeekDTO'];

export type Lesson = components['schemas']['ResLessonDTO'];
export type ReqUpdateLessonDTO = components['schemas']['ReqUpdateLessonDTO'];
export type ReqUpdateLessonStatusDTO = components['schemas']['ReqUpdateLessonStatusDTO'];

/**
 * NOT_STARTED: chưa có học sinh nào được điểm danh
 * IN_PROGRESS: có ≥1 học sinh được điểm danh thành công, real_lesson_length = 0 (đang diễn ra)
 * COMPLETED:   có ≥1 học sinh được điểm danh thành công, real_lesson_length > 0 (đã kết thúc)
 */
export enum LessonStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

