import { useCallback, useEffect, useRef } from 'react';
import { saveAnswer } from '../api/exams';
import type { ReqStudentAnswer } from '../types';

const DEBOUNCE_MS = 1000;

/**
 * Autosave đáp án xuống DB (`POST .../answers` → bảng `student_answer`) trong lúc làm bài.
 *
 * - `schedule(body)`: đặt lịch lưu 1 câu, debounce theo `questionUuid` (gộp các lần đổi liên tiếp).
 * - `flushAll()`: hủy debounce, lưu ngay mọi câu đang chờ, đợi mọi request xong (gọi trước khi submit).
 *
 * Cờ `is_final_answer` do backend xử lý ở bước submit — hook này chỉ insert các dòng đáp án thường.
 * Request lỗi được giữ lại trong hàng đợi để retry ở lần đổi sau, khi có mạng lại, hoặc lúc `flushAll`.
 */
export function useAttemptAutosave(attemptUuid: string | null) {
  const pendingRef  = useRef<Map<string, ReqStudentAnswer>>(new Map());                 // questionUuid → body chưa lưu xong
  const timersRef   = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const inflightRef = useRef<Set<Promise<void>>>(new Set());
  const attemptRef  = useRef(attemptUuid);

  useEffect(() => { attemptRef.current = attemptUuid; }, [attemptUuid]);

  const save = useCallback(async (questionUuid: string) => {
    const attempt = attemptRef.current;
    const body = pendingRef.current.get(questionUuid);
    if (!attempt || !body) return;

    const p = (async () => {
      try {
        await saveAnswer(attempt, body);
        // chỉ xóa khỏi pending nếu giá trị chưa bị một lần đổi mới hơn ghi đè
        if (pendingRef.current.get(questionUuid) === body) {
          pendingRef.current.delete(questionUuid);
        }
      } catch {
        // giữ lại trong pending để retry (lần đổi sau / online / flushAll)
      }
    })();

    inflightRef.current.add(p);
    try {
      await p;
    } finally {
      inflightRef.current.delete(p);
    }
  }, []);

  const schedule = useCallback((body: ReqStudentAnswer) => {
    const key = body.questionUuid;
    pendingRef.current.set(key, body);
    const existing = timersRef.current.get(key);
    if (existing) clearTimeout(existing);
    timersRef.current.set(key, setTimeout(() => {
      timersRef.current.delete(key);
      save(key);
    }, DEBOUNCE_MS));
  }, [save]);

  const flushAll = useCallback(async () => {
    for (const t of timersRef.current.values()) clearTimeout(t);
    timersRef.current.clear();
    await Promise.all([...pendingRef.current.keys()].map(save));
    await Promise.all([...inflightRef.current]);
  }, [save]);

  // Đổi sang attempt khác → bỏ mọi pending/timer của attempt cũ (tránh lưu nhầm)
  useEffect(() => {
    for (const t of timersRef.current.values()) clearTimeout(t);
    timersRef.current.clear();
    pendingRef.current.clear();
  }, [attemptUuid]);

  // Retry khi có mạng lại
  useEffect(() => {
    const onOnline = () => { flushAll(); };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [flushAll]);

  // Cleanup timer khi unmount
  useEffect(() => () => {
    for (const t of timersRef.current.values()) clearTimeout(t);
    timersRef.current.clear();
  }, []);

  return { schedule, flushAll };
}
