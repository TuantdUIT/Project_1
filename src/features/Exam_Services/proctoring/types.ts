import type { components } from '@/types/openapi_ES';

export type ReqProctoringEventBatch = components['schemas']['ReqProctoringEventBatchDTO'];
export type ReqProctoringEvent = components['schemas']['ReqProctoringEventDTO'];
export type ResProctoringEventBatch = components['schemas']['ResProctoringEventBatchDTO'];
export type ResProctoringEvent = components['schemas']['ResProctoringEventDTO'];
export type ProctoringEventType = NonNullable<ReqProctoringEvent['eventType']>;
