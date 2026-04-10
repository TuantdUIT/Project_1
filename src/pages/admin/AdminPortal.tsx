import React, { useState } from 'react';
import { 
  GraduationCap, LayoutDashboard, Users, FileText, BookOpen, Database, Calendar, 
  DollarSign, Shield, Search, Bell, Settings, Plus, Filter, MoreVertical,
  ChevronLeft, ChevronRight, Clock
} from 'lucide-react';
import StudentManagement from './StudentManagement';

function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === '123456') {
      onLogin();
    } else {
      setError('Tên đăng nhập hoặc mật khẩu không chính xác');
    }
  };

  return (
    <div className="min-h-screen bg-surface-container-low flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-academic-lg max-w-md w-full border border-slate-200">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-4">
            <GraduationCap size={40} />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Admin Portal</h1>
          <p className="text-slate-500 font-medium">Đăng nhập để quản lý hệ thống</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-bold mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Tên đăng nhập</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="Nhập tên đăng nhập"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="Nhập mật khẩu"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 mt-4"
          >
            Đăng nhập
          </button>
        </form>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const [currentView, setCurrentView] = useState('overview');

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
            <GraduationCap size={24} />
          </div>
          <div>
            <h1 className="font-bold text-lg text-slate-900 leading-tight">EdTech Pro</h1>
            <p className="text-xs text-slate-500">Chủ cơ sở</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          <button 
            onClick={() => setCurrentView('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${currentView === 'overview' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <LayoutDashboard size={20} />
            Tổng quan
          </button>
          <button 
            onClick={() => setCurrentView('students')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${currentView === 'students' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Users size={20} />
            Quản lý Học sinh
          </button>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-xl font-medium transition-colors">
            <FileText size={20} />
            Bài tập & Kiểm tra
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-xl font-medium transition-colors">
            <BookOpen size={20} />
            Kho Bài giảng
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-xl font-medium transition-colors">
            <Database size={20} />
            Ngân hàng câu hỏi
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-xl font-medium transition-colors">
            <Calendar size={20} />
            Thời khóa biểu
          </a>

          <div className="pt-6 pb-2">
            <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Quản lý</p>
          </div>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-xl font-medium transition-colors">
            <DollarSign size={20} />
            Tài chính & Lương
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-xl font-medium transition-colors">
            <Shield size={20} />
            Phân quyền
          </a>
        </nav>

        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors">
            <img src="https://picsum.photos/seed/robert/100/100" alt="Dr. Robert Fox" className="w-10 h-10 rounded-full" />
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-900">Dr. Robert Fox</p>
              <p className="text-xs text-slate-500">Chủ cơ sở</p>
            </div>
            <MoreVertical size={16} className="text-slate-400" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Topbar */}
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
          <div className="relative w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Tìm kiếm học sinh, lớp học, hoặc hồ sơ..." 
              className="w-full bg-slate-50 border-none rounded-2xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <button className="relative text-slate-400 hover:text-slate-600">
                <Bell size={20} />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
              <button className="text-slate-400 hover:text-slate-600">
                <Settings size={20} />
              </button>
            </div>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900">Cổng thông tin Giáo viên</p>
                <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Đang hoạt động</p>
              </div>
              <img src="https://picsum.photos/seed/teacher/100/100" alt="Teacher" className="w-10 h-10 rounded-full border-2 border-green-500 p-0.5" />
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {currentView === 'overview' ? (
            <div className="p-8">
              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                  <Users size={24} />
                </div>
                <span className="bg-green-50 text-green-600 text-[10px] font-bold px-2 py-1 rounded-lg">+12%</span>
              </div>
              <p className="text-slate-500 text-sm font-medium mb-1">Tổng học sinh</p>
              <h3 className="text-3xl font-black text-slate-900">1.250</h3>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
                  <DollarSign size={24} />
                </div>
                <span className="bg-green-50 text-green-600 text-[10px] font-bold px-2 py-1 rounded-lg">+8.4%</span>
              </div>
              <p className="text-slate-500 text-sm font-medium mb-1">Doanh thu tháng</p>
              <h3 className="text-3xl font-black text-slate-900">1.145.000.000 VNĐ</h3>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center">
                  <Calendar size={24} />
                </div>
                <span className="text-orange-600 text-[10px] font-bold">Bận</span>
              </div>
              <p className="text-slate-500 text-sm font-medium mb-1">Tổng số lớp hôm nay</p>
              <h3 className="text-3xl font-black text-slate-900">12</h3>
            </div>
          </div>

          {/* Schedule */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm mb-8">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold text-slate-900">Lịch trình chi tiết</h2>
                <div className="flex items-center gap-2 text-slate-600 font-medium bg-slate-50 px-4 py-2 rounded-xl text-sm">
                  <ChevronLeft size={16} className="cursor-pointer hover:text-slate-900" />
                  <Calendar size={16} />
                  <span>Hôm nay, 25 Tháng 11</span>
                  <ChevronRight size={16} className="cursor-pointer hover:text-slate-900" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl font-medium text-slate-700 hover:bg-slate-50 transition-colors text-sm">
                  <Filter size={16} />
                  Bộ lọc
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-md shadow-blue-100 text-sm">
                  <Plus size={16} />
                  Thêm sự kiện
                </button>
              </div>
            </div>
            <div className="p-6 relative">
              {/* Timeline grid */}
              <div className="absolute left-24 right-6 top-6 bottom-6 flex flex-col justify-between pointer-events-none">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="border-t border-slate-100 w-full h-12"></div>
                ))}
              </div>
              
              <div className="relative z-10">
                {/* 07 AM */}
                <div className="flex items-start h-12">
                  <div className="w-16 text-right pr-4 text-[10px] font-bold text-slate-400 mt-[-6px]">07 AM</div>
                </div>
                {/* 08 AM */}
                <div className="flex items-start h-12 relative">
                  <div className="w-16 text-right pr-4 text-[10px] font-bold text-slate-400 mt-[-6px]">08 AM</div>
                  {/* Event 1 */}
                  <div className="absolute left-16 right-0 top-0 h-20 bg-blue-50 border-l-4 border-blue-600 rounded-r-xl p-4 flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-900 mb-1 text-sm">Toán 12 - Nâng cao</h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock size={12} /> 08:00 AM - 09:30 AM
                      </p>
                      <span className="inline-block mt-2 text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded">Giáo viên: Robert Fox</span>
                    </div>
                    <div className="flex -space-x-2">
                      <img src="https://picsum.photos/seed/s1/32/32" className="w-6 h-6 rounded-full border-2 border-white" />
                      <img src="https://picsum.photos/seed/s2/32/32" className="w-6 h-6 rounded-full border-2 border-white" />
                      <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 text-[8px] font-bold flex items-center justify-center text-slate-600">+22</div>
                    </div>
                  </div>
                </div>
                {/* 09 AM */}
                <div className="flex items-start h-12">
                  <div className="w-16 text-right pr-4 text-[10px] font-bold text-slate-400 mt-[-6px]">09 AM</div>
                </div>
                {/* 10 AM */}
                <div className="flex items-start h-12 relative">
                  <div className="w-16 text-right pr-4 text-[10px] font-bold text-slate-400 mt-[-6px]">10 AM</div>
                  {/* Current time line */}
                  <div className="absolute left-14 right-0 top-0 flex items-center z-20">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <div className="h-px bg-red-500 flex-1"></div>
                  </div>
                  {/* Event 2 */}
                  <div className="absolute left-16 right-0 top-0 h-16 bg-orange-50 border-l-4 border-orange-500 rounded-r-xl p-4 flex justify-between items-start mt-2">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm mb-1">Họp giáo viên định kỳ</h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock size={12} /> 10:00 AM - 11:00 AM
                      </p>
                    </div>
                    <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-xs font-bold">i</div>
                  </div>
                </div>
                {/* 11 AM - 06 PM */}
                {[11, 12, 1, 2, 3, 4, 5, 6].map((hour) => (
                  <div key={hour} className="flex items-start h-12 relative">
                    <div className="w-16 text-right pr-4 text-[10px] font-bold text-slate-400 mt-[-6px]">
                      {hour < 10 ? `0${hour}` : hour} {hour >= 11 && hour !== 12 ? 'AM' : 'PM'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="grid grid-cols-2 gap-6">
            {/* Chart */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold text-slate-900">Thống kê 3 bài<br/>kiểm tra gần nhất</h2>
                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-lg">Lớp 12</button>
                  <button className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg">Lớp 11</button>
                  <button className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg">Lớp 10</button>
                </div>
              </div>
              <div className="h-64 flex items-end gap-4 px-4">
                {/* Y-axis */}
                <div className="flex flex-col justify-between h-full text-xs font-bold text-slate-400 pb-6">
                  <span>50</span>
                  <span>40</span>
                  <span>30</span>
                  <span>20</span>
                  <span>10</span>
                  <span>0</span>
                </div>
                {/* Bars */}
                <div className="flex-1 flex items-end justify-around h-full border-b border-slate-100 pb-2 relative">
                  <div className="w-12 bg-[#D0D7F5] rounded-t-sm" style={{ height: '20%' }}></div>
                  <div className="w-12 bg-[#A5B4FC] rounded-t-sm" style={{ height: '35%' }}></div>
                  <div className="w-12 bg-[#3B82F6] rounded-t-sm" style={{ height: '85%' }}></div>
                  <div className="w-12 bg-[#4F46E5] rounded-t-sm" style={{ height: '75%' }}></div>
                  <div className="w-12 bg-[#818CF8] rounded-t-sm" style={{ height: '45%' }}></div>
                  {/* X-axis labels */}
                  <div className="absolute -bottom-6 left-0 right-0 flex justify-around text-xs font-bold text-slate-400">
                    <span>0-2</span>
                    <span>2-4</span>
                    <span>4-6</span>
                    <span>6-8</span>
                    <span>8-10</span>
                    <span>10</span>
                  </div>
                </div>
              </div>
            </div>

            {/* TA Performance */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900">Hiệu suất trợ giảng</h2>
                <button className="text-blue-600 font-bold text-sm hover:underline">Xem tất cả</button>
              </div>
              
              <table className="w-full text-left">
                <thead>
                  <tr>
                    <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Họ và tên</th>
                    <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Số giờ làm</th>
                    <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Cấp bậc</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    { name: 'Nguyễn Minh Tú', hours: 156, rank: 'VÀNG', color: 'bg-yellow-100 text-yellow-700' },
                    { name: 'Trần Thu Hà', hours: 142, rank: 'BẠC', color: 'bg-slate-100 text-slate-600' },
                    { name: 'Lê Hoàng Nam', hours: 128, rank: 'ĐỒNG', color: 'bg-orange-100 text-orange-700' },
                    { name: 'Phạm Đức Anh', hours: 115, rank: 'ĐỒNG', color: 'bg-orange-100 text-orange-700' },
                    { name: 'Vũ Thùy Linh', hours: 102, rank: 'ĐỒNG', color: 'bg-orange-100 text-orange-700' },
                  ].map((ta, i) => (
                    <tr key={i}>
                      <td className="py-3 flex items-center gap-3">
                        <img src={`https://picsum.photos/seed/ta${i}/32/32`} className="w-8 h-8 rounded-full" />
                        <span className="font-bold text-slate-900 text-sm">{ta.name}</span>
                      </td>
                      <td className="py-3 text-center font-medium text-slate-600 text-sm">{ta.hours} giờ</td>
                      <td className="py-3 text-right">
                        <span className={`inline-block px-2 py-1 rounded text-[10px] font-black ${ta.color}`}>
                          {ta.rank}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
            </div>
          ) : currentView === 'students' ? (
            <StudentManagement />
          ) : null}
        </div>
      </main>
    </div>
  );
}

export default function AdminPortal() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  if (!isLoggedIn) {
    return <AdminLogin onLogin={() => setIsLoggedIn(true)} />;
  }

  return <AdminDashboard />;
}
