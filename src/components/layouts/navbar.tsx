import { useState } from 'react';
import { NavLink } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { Bell, GraduationCap, LogOut, Menu, User, X } from 'lucide-react';
import { paths } from '@/config/paths';
import { useAuth } from '@/lib/auth/auth-context';
import { useLoginModal } from '@/lib/auth/login-modal-context';
import { ADMIN_PORTAL_ROLES } from '@/lib/auth/permissions';

const navItems = [
  { label: 'Khóa học', to: paths.courses },
  { label: 'Phòng thi', to: paths.exam },
  { label: 'Thời khóa biểu', to: paths.schedule },
  { label: 'Tài liệu', to: paths.learningResources },
];

/**
 * Ý nghĩa: Render thanh điều hướng chính, tự đọc trạng thái đăng nhập và mở modal login khi cần.
 * Hàm sử dụng hàm này làm đầu vào: AppLayout render Navbar ở đầu mọi route public/user route.
 */
export default function Navbar() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, role, isAuthenticated, logout } = useAuth();
  const { open } = useLoginModal();
  // Hiển thị lối vào Admin Portal cho mọi vai trò được phép (MANAGER, TEACHER).
  const canAccessAdminPortal = role != null && ADMIN_PORTAL_ROLES.includes(role.roleName);

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
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Mở menu"
              className="-ml-1 rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-indigo-deep md:hidden"
            >
              <Menu size={24} />
            </button>

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
          </div>

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
                          {canAccessAdminPortal && (
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
                  className="rounded-lg bg-[#1870FF] px-4 py-2 text-sm font-bold text-white shadow-[0_10px_22px_rgba(24,112,255,0.26)] transition-colors hover:bg-[#0f62e6]"
                >
                  Đăng nhập
                </button>
               
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile drawer (trượt từ bên trái khi màn hình thu nhỏ) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[80%] flex-col bg-white shadow-xl"
            >
              <div className="flex h-16 items-center justify-between border-b border-outline-variant px-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-deep text-white">
                    <GraduationCap size={20} />
                  </div>
                  <span className="text-xl font-bold tracking-tight text-indigo-deep">
                    BHP Math
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-label="Đóng menu"
                  className="rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-indigo-deep"
                >
                  <X size={22} />
                </button>
              </div>

              <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `rounded-lg px-4 py-3 text-sm font-bold transition-colors ${
                        isActive
                          ? 'bg-indigo-deep/10 text-indigo-deep'
                          : 'text-on-surface-variant hover:bg-surface-container-low hover:text-indigo-deep'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}

                {canAccessAdminPortal && (
                  <NavLink
                    to={paths.adminPortal}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="mt-2 flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold text-blue-600 transition-colors hover:bg-blue-50"
                  >
                    <GraduationCap size={18} />
                    Admin Portal
                  </NavLink>
                )}
              </div>

              {!isAuthenticated && (
                <div className="flex flex-col gap-3 border-t border-outline-variant p-4">
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      open();
                    }}
                    className="rounded-lg px-4 py-3 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-low"
                  >
                    Đăng nhập
                  </button>
                 
                </div>
              )}

              {isAuthenticated && (
                <div className="border-t border-outline-variant p-4">
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold text-red-600 transition-colors hover:bg-red-50"
                  >
                    <LogOut size={18} />
                    Đăng xuất
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </nav>
  );
}
