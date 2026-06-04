import { useCallback, useEffect, useRef } from 'react';
import type { ReqProctoringEvent } from '../types';

const BATCH_SIZE       = 10;
const FLUSH_INTERVAL_MS = 5000;
const STORAGE_KEY      = 'proctoring_queue';

export function useEventBuffer(
  onFlush: (events: ReqProctoringEvent[]) => Promise<void>,
  enabled: boolean,
) {
  const queueRef   = useRef<ReqProctoringEvent[]>([]);
  const onFlushRef = useRef(onFlush);

  useEffect(() => { onFlushRef.current = onFlush; }, [onFlush]);

  const flush = useCallback(async () => {
    if (queueRef.current.length === 0) return;
    const batch = queueRef.current.splice(0);
    localStorage.removeItem(STORAGE_KEY);
    try {
      await onFlushRef.current(batch);
    } catch {
      queueRef.current.unshift(...batch);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queueRef.current));
    }
  }, []);

  const push = useCallback((event: ReqProctoringEvent) => {
    queueRef.current.push(event);
    if (queueRef.current.length >= BATCH_SIZE) flush();
  }, [flush]);

  // Interval flush
  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => {
      if (queueRef.current.length > 0) flush();
    }, FLUSH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [enabled, flush]);

  // Restore saved queue từ localStorage khi có mạng lại
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    try {
      const events = JSON.parse(stored) as ReqProctoringEvent[];
      queueRef.current.push(...events);
      localStorage.removeItem(STORAGE_KEY);
      flush();
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Retry khi có mạng lại
  useEffect(() => {
    window.addEventListener('online', flush);
    return () => window.removeEventListener('online', flush);
  }, [flush]);

  return { push, flushNow: flush };
}
