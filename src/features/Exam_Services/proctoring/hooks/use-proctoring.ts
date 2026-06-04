import { useCallback, useRef } from 'react';
import { useCreateProctoringEventsMutation } from '../api/proctoring-events';
import type { ProctoringEventType, ReqProctoringEvent } from '../types';
import { useEventDetector } from './use-event-detector';
import { useEventBuffer } from './use-event-buffer';

interface UseProctoringOptions {
  attemptUuid: string | null;
  enabled: boolean;
  onViolationDetected?: (type: ProctoringEventType) => void;
}

export function useProctoring({ attemptUuid, enabled, onViolationDetected }: UseProctoringOptions) {
  const mutation         = useCreateProctoringEventsMutation();
  const onViolationRef   = useRef(onViolationDetected);
  const attemptUuidRef   = useRef(attemptUuid);

  onViolationRef.current = onViolationDetected;
  attemptUuidRef.current = attemptUuid;

  const handleFlush = useCallback(async (events: ReqProctoringEvent[]) => {
    if (!attemptUuidRef.current) return;
    await mutation.mutateAsync({
      attemptUuid: attemptUuidRef.current,
      body: { events },
    });
  }, [mutation]);

  const { push, flushNow } = useEventBuffer(handleFlush, enabled && !!attemptUuid);

  const handleViolation = useCallback((type: ProctoringEventType) => {
    push({ eventType: type, eventTime: new Date().toISOString() });
    onViolationRef.current?.(type);
  }, [push]);

  useEventDetector(handleViolation, enabled && !!attemptUuid);

  return { flushNow };
}
