/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import CoursesPage from './pages/CoursesPage';
import CourseDetailPage from './pages/CourseDetailPage';
import SchedulePage from './pages/SchedulePage';
import ExamPage from './pages/ExamPage';
import AdminPortal from './pages/admin/AdminPortal';
import LoginModal from './components/LoginModal';
import { courseDetails } from './data/courseDetails';

export default function App() {
  const [currentView, setCurrentView] = useState(() => {
    if (window.location.pathname === '/admin-portal') return 'admin-portal';
    return 'home';
  });
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname === '/admin-portal') {
        setCurrentView('admin-portal');
      } else {
        setCurrentView('home');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleCourseClick = (courseId: string) => {
    setSelectedCourseId(courseId);
    setCurrentView('course-detail');
    window.scrollTo(0, 0);
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
    setIsLoginModalOpen(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentView('home');
  };

  const handleNavigate = (view: string) => {
    if (view === 'exam' && !isLoggedIn) {
      setIsLoginModalOpen(true);
      return;
    }
    if (view === 'admin-portal') {
      window.history.pushState({}, '', '/admin-portal');
    } else if (currentView === 'admin-portal') {
      window.history.pushState({}, '', '/');
    }
    setCurrentView(view);
  };

  if (currentView === 'admin-portal') {
    return <AdminPortal />;
  }

  const renderView = () => {
    if (currentView === 'course-detail' && selectedCourseId && courseDetails[selectedCourseId]) {
      return (
        <CourseDetailPage 
          course={courseDetails[selectedCourseId]} 
          onBack={() => setCurrentView('courses')} 
        />
      );
    }

    switch (currentView) {
      case 'home':
        return <HomePage onCourseClick={handleCourseClick} />;
      case 'courses':
        return <CoursesPage onCourseClick={handleCourseClick} />;
      case 'schedule':
        return <SchedulePage />;
      case 'exam':
        if (!isLoggedIn) {
          return (
            <div className="py-40 text-center px-4">
              <div className="max-w-md mx-auto bg-white p-10 rounded-3xl border border-slate-200 shadow-sm">
                <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-4">Yêu cầu đăng nhập</h2>
                <p className="text-slate-500 mb-8 font-medium">Vui lòng đăng nhập để truy cập vào phòng thi và bắt đầu làm bài.</p>
                <button 
                  onClick={() => setIsLoginModalOpen(true)}
                  className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                  Đăng nhập ngay
                </button>
              </div>
            </div>
          );
        }
        return <ExamPage />;
      default:
        return <HomePage onCourseClick={handleCourseClick} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar 
        currentView={currentView} 
        onNavigate={handleNavigate} 
        isLoggedIn={isLoggedIn}
        onLoginClick={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
      />
      <main className="flex-grow">
        {renderView()}
      </main>
      <Footer />

      <LoginModal 
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={handleLogin}
      />
    </div>
  );
}
