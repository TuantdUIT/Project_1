import type { components } from '@/types/openapi_MS';

export type Attendance = components['schemas']['ResAttendanceDTO'];
export type ReqCreateAttendanceDTO = components['schemas']['ReqCreateAttendanceDTO'];
export type ReqUpdateAttendanceDTO = components['schemas']['ReqUpdateAttendanceDTO'];

export type RecordAttendance = components['schemas']['ResRecordAttendanceDTO'];
export type ReqCreateRecordAttendanceDTO = components['schemas']['ReqCreateRecordAttendanceDTO'];
export type ReqUpdateRecordAttendanceDTO = components['schemas']['ReqUpdateRecordAttendanceDTO'];
export type RecordAttendanceWeeklySummary = components['schemas']['ResRecordAttendanceWeeklySummaryDTO'];
