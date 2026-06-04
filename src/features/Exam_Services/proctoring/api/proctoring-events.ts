import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClientES } from '@/lib/api-client-es';
import type { ReqProctoringEventBatch, ResProctoringEventBatch, ResProctoringEvent } from '../types';

export function createProctoringEventsBatch(attemptUuid: string, body: ReqProctoringEventBatch) {
  return apiClientES.post<ResProctoringEventBatch>(
    `/api/v1/student/attempts/${attemptUuid}/proctoring-events/batch`,
    body,
  );
}

export function useCreateProctoringEventsMutation() {
  return useMutation({
    mutationFn: ({ attemptUuid, body }: { attemptUuid: string; body: ReqProctoringEventBatch }) =>
      createProctoringEventsBatch(attemptUuid, body),
  });
}

export function getProctoringEvents(attemptUuid: string) {
  return apiClientES.get<ResProctoringEvent[]>(
    `/api/v1/student/attempts/${attemptUuid}/proctoring-events`,
  );
}

export function sumViolations(events: ResProctoringEvent[]): number {
  return events.length;
}

export function useProctoringEventsQuery(attemptUuid: string | null) {
  return useQuery({
    queryKey: ['proctoring-events', attemptUuid],
    queryFn: () => getProctoringEvents(attemptUuid!),
    enabled: !!attemptUuid,
    select: (events) => ({
      events,
      violationCount: sumViolations(events),
    }),
  });
}
