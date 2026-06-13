import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { ForgotPasswordForm, LoginForm } from '@/features/auth';
import { useLoginModal } from '@/lib/auth/login-modal-context';

type ModalView = 'login' | 'forgot';

export default function LoginModal() {
  const navigate = useNavigate();
  const { isOpen, close, consumeRedirectTo } = useLoginModal();
  const [view, setView] = useState<ModalView>('login');

  // Mỗi lần mở lại modal, luôn quay về màn đăng nhập.
  useEffect(() => {
    if (isOpen) {
      setView('login');
    }
  }, [isOpen]);

  function handleSuccess() {
    close();

    const redirectTo = consumeRedirectTo();

    if (redirectTo) {
      navigate(redirectTo);
    }
  }

  function handleClose() {
    close();
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="p-8">
              <div className="mb-8 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-indigo-deep">
                  {view === 'login' ? 'BHP Math' : 'Quên mật khẩu'}
                </h2>
                <button
                  onClick={handleClose}
                  className="rounded-full p-2 transition-colors hover:bg-gray-100"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              {view === 'login' ? (
                <>
                  <LoginForm onSuccess={handleSuccess} />

                  <button
                    type="button"
                    onClick={() => setView('forgot')}
                    className="mt-4 w-full rounded-xl border border-gray-200 bg-white py-4 text-lg font-bold text-gray-600 transition-all hover:border-indigo-deep hover:text-indigo-deep"
                  >
                    Quên mật khẩu
                  </button>
                </>
              ) : (
                <ForgotPasswordForm onBack={() => setView('login')} />
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
