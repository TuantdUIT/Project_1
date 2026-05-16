import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { useAuth } from '@/lib/auth/auth-context';
import { useLoginModal } from '@/lib/auth/login-modal-context';

/**
 * Ý nghĩa: Chặn route yêu cầu đăng nhập và mở LoginModal nếu user chưa có session.
 * Hàm sử dụng hàm này làm đầu vào: router dùng ProtectedRoute làm element cha cho /schedule và /exam để bảo vệ các route này.
 */
export function ProtectedRoute() {
  const { user } = useAuth();
  const { open } = useLoginModal();
  const location = useLocation();

  useEffect(() => {
    if (!user) {
      open(location.pathname);
    }
  }, [location.pathname, open, user]);

  if (!user) {
    return null;
  }

  return <Outlet />;
}
