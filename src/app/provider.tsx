import { useEffect, useState, type ReactNode } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/lib/auth/auth-context';
import { LoginModalProvider } from '@/lib/auth/login-modal-context';
import { queryClient } from '@/lib/react-query';
import type { ParsedApiError } from '@/utils/api-errors';

function ApiErrorToast() {
  const [error, setError] = useState<ParsedApiError | null>(null);

  useEffect(() => {
    function handleApiError(event: Event) {
      setError((event as CustomEvent<ParsedApiError>).detail);
    }

    window.addEventListener('api:error', handleApiError);

    return () => window.removeEventListener('api:error', handleApiError);
  }, []);

  useEffect(() => {
    if (!error) {
      return;
    }

    const timerId = window.setTimeout(() => setError(null), 4000);

    return () => window.clearTimeout(timerId);
  }, [error]);

  if (!error) {
    return null;
  }

  return (
    <div className="fixed right-4 top-20 z-[120] max-w-sm rounded-xl border border-red-200 bg-white p-4 shadow-2xl">
      <p className="text-sm font-bold text-red-600">{error.title}</p>
      <p className="mt-1 text-sm text-on-surface-variant">{error.message}</p>
    </div>
  );
}

/**
 * Ý nghĩa: Bọc toàn bộ app bằng các provider nền tảng như Helmet, React Query, Auth và LoginModal.
 * Hàm sử dụng hàm này làm đầu vào: App trong src/app/index.tsx dùng AppProvider để RouterProvider luôn có đủ context.
 */
export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <LoginModalProvider>
            {children}
            <ApiErrorToast />
          </LoginModalProvider>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}
