import type { components } from '@/types/openapi';

export type StudentStatus = 'WAITING' | 'ACTIVE' | 'INACTIVE';
export type ResStudentDTO = components['schemas']['ResStudentDTO'];
export type ReqManagerCreateStudentDTO = components['schemas']['ReqManagerCreateStudentDTO'];
export type ReqManagerUpdateStudentDTO = components['schemas']['ReqManagerUpdateStudentDTO'];

export type ResUserDTO = components['schemas']['ResUserDTO'];
export type ReqCreateUserDTO = components['schemas']['ReqCreateUserDTO'];
export type ReqUpdateUserDTO = components['schemas']['ReqUpdateUserDTO'];
export type ResRoleDTO = components['schemas']['ResRoleDTO'];

export type UserUpdatePayload = Omit<ReqUpdateUserDTO, 'id'>;

export type StaffRoleName = 'MANAGER' | 'TEACHER' | 'TA' | 'ADMIN';

export type StaffRoleOption = {
  id: number;
  name: StaffRoleName;
  description?: string;
};

export type TuitionStatus = 'PAID' | 'UNPAID' | 'PARTIAL';

export type ResPeriodDTO = components['schemas']['ResPeriodDTO'];
export type ReqCreatePeriodDTO = components['schemas']['ReqCreatePeriodDTO'];
export type ReqUpdatePeriodDTO = components['schemas']['ReqUpdatePeriodDTO'];

export type ResPeriodSettingDTO = components['schemas']['ResPeriodSettingDTO'];
export type ResPeriodSettingLessonTypeDTO = components['schemas']['ResPeriodSettingLessonTypeDTO'];
export type ReqCreatePeriodSettingDTO = components['schemas']['ReqCreatePeriodSettingDTO'];
export type ReqUpdatePeriodSettingDTO = components['schemas']['ReqUpdatePeriodSettingDTO'];
export type ReqPeriodSettingLessonTypeItemDTO = components['schemas']['ReqPeriodSettingLessonTypeItemDTO'];
