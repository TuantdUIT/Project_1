import type { components, paths } from '@/types/openapi';

export type Grade = components['schemas']['ResGradeDTO'];
export type GradesOverview =
  paths['/api/v1/grades']['get']['responses'][200]['content']['*/*'];
export type LessonType = components['schemas']['ResLessonTypeDTO'];
