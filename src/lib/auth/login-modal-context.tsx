import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

type LoginModalContextValue = {
  isOpen: boolean;
  redirectTo: string | null;
  open: (redirectTo?: string) => void;
  close: () => void;
  consumeRedirectTo: () => string | null;
};

const LoginModalContext = createContext<LoginModalContextValue | null>(null);

/**
 * Ý nghĩa: Quản lý trạng thái mở/đóng LoginModal và route cần quay lại sau khi đăng nhập.
 * Hàm sử dụng hàm này làm đầu vào: AppProvider bọc provider này quanh router để Navbar, LoginModal và ProtectedRoute cùng dùng một modal.
 */
export function LoginModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  /**
   * Ý nghĩa: Mở modal đăng nhập và tùy chọn lưu route đích sau khi đăng nhập thành công.
   * Hàm sử dụng hàm này làm đầu vào: Navbar gọi khi bấm Đăng nhập; ProtectedRoute gọi khi user truy cập route cần auth.
   */
  const open = useCallback((nextRedirectTo?: string) => {
    setRedirectTo(nextRedirectTo ?? null);
    setIsOpen(true);
  }, []);

  /**
   * Ý nghĩa: Đóng modal đăng nhập mà không thay đổi trạng thái auth.
   * Hàm sử dụng hàm này làm đầu vào: LoginModal gọi khi bấm nút đóng hoặc click backdrop.
   */
  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  /**
   * Ý nghĩa: Lấy route đích đã lưu rồi xóa khỏi context để tránh điều hướng lặp sau lần login kế tiếp.
   * Hàm sử dụng hàm này làm đầu vào: LoginModal gọi sau khi login thành công để điều hướng user tới route ban đầu.
   */
  const consumeRedirectTo = useCallback(() => {
    const currentRedirectTo = redirectTo;
    setRedirectTo(null);
    return currentRedirectTo;
  }, [redirectTo]);

  const value = useMemo<LoginModalContextValue>(
    () => ({
      isOpen,
      redirectTo,
      open,
      close,
      consumeRedirectTo,
    }),
    [close, consumeRedirectTo, isOpen, open, redirectTo],
  );

  return (
    <LoginModalContext.Provider value={value}>
      {children}
    </LoginModalContext.Provider>
  );
}

/**
 * Ý nghĩa: Hook truy cập LoginModalContext để mở, đóng hoặc đọc route đích của modal đăng nhập.
 * Hàm sử dụng hàm này làm đầu vào: Navbar, LoginModal và ProtectedRoute dùng hook này để tránh truyền props modal qua nhiều lớp.
 */
export function useLoginModal() {
  const context = useContext(LoginModalContext);

  if (!context) {
    throw new Error('useLoginModal must be used inside LoginModalProvider');
  }

  return context;
}
