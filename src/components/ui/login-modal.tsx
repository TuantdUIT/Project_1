import { useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { LoginForm } from '@/features/auth';
import { useLoginModal } from '@/lib/auth/login-modal-context';

export default function LoginModal() {
  const navigate = useNavigate();
  const { isOpen, close, consumeRedirectTo } = useLoginModal();

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
                  BHP Math
                </h2>
                <button
                  onClick={handleClose}
                  className="rounded-full p-2 transition-colors hover:bg-gray-100"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              <LoginForm onSuccess={handleSuccess} />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
