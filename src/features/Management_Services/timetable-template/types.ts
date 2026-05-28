import type { components } from '@/types/openapi_MS';
import type { EmployeeRATemplateItem } from '@/features/Management_Services/employee-ra-template/types';

export type TimetableTemplate = components['schemas']['ResTimetableTemplateDTO'];
export type TimetableTemplateItem = components['schemas']['ResTimetableTemplateItemDTO'];
export type LessonType = components['schemas']['ResLessonTypeDTO'];

export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export type MergedTimetableItem = TimetableTemplateItem & {
  _source_grade_id: number;
  _source_grade_name: string;
  _template_uuid?: string;
  _personnel?: EmployeeRATemplateItem[];
};

export type TimetableCardLayout = {
  id: string;
  item: MergedTimetableItem;
  dayIndex: number;
  topPx: number;
  heightPx: number;
  leftPercent: number;
  widthPercent: number;
  startMinutes: number;
  endMinutes: number;
  startLabel: string;
  endLabel: string;
};

export type TimetableLayoutResult = {
  cards: TimetableCardLayout[];
  startHour: number;
  endHour: number;
  totalHeightPx: number;
};
