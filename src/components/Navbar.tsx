import { useState } from 'react';
import { GraduationCap, Bell, LogOut, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  isLoggedIn: boolean;
  onLoginClick: () => void;
  onLogout: () => void;
}

export default function Navbar({ currentView, onNavigate, isLoggedIn, onLoginClick, onLogout }: NavbarProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <nav className="bg-white w-full border-b border-outline-variant sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <button 
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 bg-indigo-deep rounded-lg flex items-center justify-center text-white">
              <GraduationCap size={20} />
            </div>
            <span className="font-bold text-xl tracking-tight text-indigo-deep">EdTech Pro</span>
          </button>
          
          <div className="hidden md:flex items-center gap-8 h-full">
            <button 
              onClick={() => onNavigate('courses')}
              className={`text-sm font-bold transition-all h-full px-2 border-b-2 flex items-center ${
                currentView === 'courses' ? 'text-indigo-deep border-indigo-deep' : 'text-on-surface-variant border-transparent hover:text-indigo-deep'
              }`}
            >
              Khóa học
            </button>
            <button 
              onClick={() => onNavigate('exam')}
              className={`text-sm font-bold transition-all h-full px-2 border-b-2 flex items-center ${
                currentView === 'exam' ? 'text-indigo-deep border-indigo-deep' : 'text-on-surface-variant border-transparent hover:text-indigo-deep'
              }`}
            >
              Phòng thi
            </button>
            <button 
              onClick={() => onNavigate('schedule')}
              className={`text-sm font-bold transition-all h-full px-2 border-b-2 flex items-center ${
                currentView === 'schedule' ? 'text-indigo-deep border-indigo-deep' : 'text-on-surface-variant border-transparent hover:text-indigo-deep'
              }`}
            >
              Thời khóa biểu
            </button>
          </div>
          
          <div className="flex items-center gap-6">
            {isLoggedIn ? (
              <>
                <button className="text-on-surface-variant hover:text-indigo-deep transition-colors relative">
                  <Bell size={20} />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                </button>
                <div className="relative">
                  <button 
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="w-10 h-10 rounded-full overflow-hidden border-2 border-outline-variant hover:border-indigo-deep transition-all focus:outline-none"
                  >
                    <img 
                      src="https://picsum.photos/seed/avatar/100/100" 
                      alt="User Avatar" 
                      className="w-full h-full object-cover"
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
                          className="absolute right-0 mt-2 w-48 bg-white border border-outline-variant rounded-xl shadow-xl z-50 py-2"
                        >
                          <div className="px-4 py-2 border-b border-outline-variant mb-1">
                            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Tài khoản</p>
                            <p className="text-sm font-bold text-indigo-deep truncate">edtech_user</p>
                          </div>
                          <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-on-surface hover:bg-surface-container-low transition-colors">
                            <User size={18} className="text-on-surface-variant" />
                            Hồ sơ của tôi
                          </button>
                          <button 
                            onClick={() => {
                              onLogout();
                              setIsProfileOpen(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors font-bold"
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
                  onClick={onLoginClick}
                  className="text-sm font-bold text-on-surface hover:text-indigo-deep transition-colors"
                >
                  Đăng nhập
                </button>
                <button className="btn-primary py-2 px-6 text-sm">
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
