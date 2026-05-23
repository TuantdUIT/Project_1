import { useState } from 'react';
import { NavLink } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { Bell, GraduationCap, LogOut, User } from 'lucide-react';
import { paths } from '@/config/paths';
import { useAuth } from '@/lib/auth/auth-context';
import { useLoginModal } from '@/lib/auth/login-modal-context';

const navItems = [
  { label: 'Khóa học', to: paths.courses },
  { label: 'Phòng thi', to: paths.exam },
  { label: 'Thời khóa biểu', to: paths.schedule },
];

/**
 * Ý nghĩa: Render thanh điều hướng chính, tự đọc trạng thái đăng nhập và mở modal login khi cần.
 * Hàm sử dụng hàm này làm đầu vào: AppLayout render Navbar ở đầu mọi route public/user route.
 */
export default function Navbar() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, role, isAuthenticated, logout } = useAuth();
  const { open } = useLoginModal();

  /**
   * Ý nghĩa: Tạo class active/inactive cho NavLink dựa trên route hiện tại.
   * Hàm sử dụng hàm này làm đầu vào: các NavLink trong Navbar truyền hàm này vào prop className để highlight menu đang active.
   */
  function getNavLinkClass({ isActive }: { isActive: boolean }) {
    return `flex h-full items-center border-b-2 px-2 text-sm font-bold transition-all ${
      isActive
        ? 'border-indigo-deep text-indigo-deep'
        : 'border-transparent text-on-surface-variant hover:text-indigo-deep'
    }`;
  }

  /**
   * Ý nghĩa: Đăng xuất user và đóng dropdown hồ sơ.
   * Hàm sử dụng hàm này làm đầu vào: nút Đăng xuất trong menu profile gọi hàm này khi user click.
   */
  async function handleLogout() {
    await logout();
    setIsProfileOpen(false);
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-outline-variant bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <NavLink
            to={paths.home}
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-deep text-white">
              <GraduationCap size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight text-indigo-deep">
              BHP Math
            </span>
          </NavLink>

          <div className="hidden h-full items-center gap-8 md:flex">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={getNavLinkClass}>
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="flex items-center gap-6">
            {isAuthenticated ? (
              <>
                <button className="relative text-on-surface-variant transition-colors hover:text-indigo-deep">
                  <Bell size={20} />
                  <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full border-2 border-white bg-red-500" />
                </button>
                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen((current) => !current)}
                    className="h-10 w-10 overflow-hidden rounded-full border-2 border-outline-variant transition-all hover:border-indigo-deep focus:outline-none"
                  >
                    <img
                      src="https://picsum.photos/seed/avatar/100/100"
                      alt="User Avatar"
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </button>

                  <AnimatePresence>
                    {isProfileOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setIsProfileOpen(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute right-0 z-50 mt-2 w-52 rounded-xl border border-outline-variant bg-white py-2 shadow-xl"
                        >
                          <div className="mb-1 border-b border-outline-variant px-4 py-2">
                            <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                              Tài khoản
                            </p>
                            <p className="truncate text-sm font-bold text-indigo-deep">
                              {user?.fullName ?? user?.email}
                            </p>
                          </div>
                          <button className="flex w-full items-center gap-3 px-4 py-2 text-sm text-on-surface transition-colors hover:bg-surface-container-low">
                            <User size={18} className="text-on-surface-variant" />
                            Hồ sơ của tôi
                          </button>
                          {role?.roleName === 'MANAGER' && (
                            <NavLink
                              to={paths.adminPortal}
                              onClick={() => setIsProfileOpen(false)}
                              className="flex w-full items-center gap-3 px-4 py-2 text-sm font-bold text-blue-600 transition-colors hover:bg-blue-50"
                            >
                              <GraduationCap size={18} />
                              Admin Portal
                            </NavLink>
                          )}
                          <button
                            onClick={handleLogout}
                            className="flex w-full items-center gap-3 px-4 py-2 text-sm font-bold text-red-600 transition-colors hover:bg-red-50"
                          >
                            <LogOut size={18} />
                            Đăng xuất
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <button
                  onClick={() => open()}
                  className="text-sm font-bold text-on-surface transition-colors hover:text-indigo-deep"
                >
                  Đăng nhập
                </button>
                <button className="btn-primary px-6 py-2 text-sm">
                  Đăng ký
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
