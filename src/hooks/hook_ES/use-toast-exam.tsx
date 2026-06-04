import { useState, useCallback, useRef } from 'react';

type ToastType = 'success' | 'error';

export type Toast = {
  id: number;
  message: string;
  type: ToastType;
};

export function useToastExam() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const show = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++counter.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2000);
  }, []);

  return { toasts, show };
}
