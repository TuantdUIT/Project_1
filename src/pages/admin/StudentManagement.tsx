import React from 'react';
import { Search, Download, Plus, Filter, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

const students = [
  { id: 'HS00124', name: 'Nguyễn Văn An', class: 'Lớp 2k8 - A1', progress: 85, status: 'ĐANG HỌC', statusColor: 'bg-green-50 text-green-600', avatar: 'https://picsum.photos/seed/an/40/40' },
  { id: 'HS00125', name: 'Lê Thị Mai', class: 'Lớp 2k9 - B2', progress: 42, status: 'CHỜ DUYỆT', statusColor: 'bg-yellow-50 text-yellow-600', avatar: 'https://picsum.photos/seed/mai/40/40' },
  { id: 'HS00126', name: 'Trần Minh Quân', class: 'Lớp 2k10 - C1', progress: 12, status: 'NGHỈ HỌC', statusColor: 'bg-red-50 text-red-600', avatar: 'https://picsum.photos/seed/quan/40/40' },
  { id: 'HS00127', name: 'Phạm Thùy Linh', class: 'Lớp 2k8 - A2', progress: 98, status: 'ĐANG HỌC', statusColor: 'bg-green-50 text-green-600', avatar: 'https://picsum.photos/seed/linh/40/40' },
  { id: 'HS00128', name: 'Hoàng Anh Đức', class: 'Lớp 2k9 - B3', progress: 65, status: 'ĐANG HỌC', statusColor: 'bg-green-50 text-green-600', avatar: 'https://picsum.photos/seed/duc/40/40' },
];

export default function StudentManagement() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">Quản lý học sinh</h1>
          <p className="text-slate-500 font-medium">Theo dõi danh sách, tiến độ học tập và tình trạng của toàn bộ học sinh.</p>
        </div>
        <div className="flex gap-4">
          <button className="flex items-center gap-2 px-6 py-3 bg-[#22C55E] text-white rounded-xl font-bold hover:bg-green-600 transition-colors shadow-sm">
            <Download size={20} />
            Xuất Excel
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-100">
            <Plus size={20} />
            Thêm học sinh mới
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Tìm tên học sinh..." 
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <select className="bg-slate-50 border border-slate-200 rounded-xl px-6 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 appearance-none min-w-[140px]">
          <option>Tất cả lớp</option>
        </select>
        <select className="bg-slate-50 border border-slate-200 rounded-xl px-6 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 appearance-none min-w-[140px]">
          <option>Trạng thái</option>
        </select>
        <button className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors shrink-0">
          <Filter size={20} />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="py-5 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Học sinh</th>
              <th className="py-5 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Lớp</th>
              <th className="py-5 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Tiến độ đạt được</th>
              <th className="py-5 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Trạng thái</th>
              <th className="py-5 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map((student, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-4 px-6 flex items-center gap-4">
                  <img src={student.avatar} alt={student.name} className="w-12 h-12 rounded-full object-cover" />
                  <div>
                    <h4 className="font-bold text-slate-900">{student.name}</h4>
                    <p className="text-xs font-medium text-slate-500">ID: {student.id}</p>
                  </div>
                </td>
                <td className="py-4 px-6 font-medium text-slate-700">{student.class}</td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${student.progress > 50 ? 'bg-blue-600' : student.progress > 20 ? 'bg-yellow-400' : 'bg-slate-300'}`} 
                        style={{ width: `${student.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-bold text-slate-700 w-10">{student.progress}%</span>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black ${student.statusColor}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                    {student.status}
                  </span>
                </td>
                <td className="py-4 px-6 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit2 size={18} />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Pagination */}
        <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <p className="text-sm font-medium text-slate-500">
            Hiển thị từ <span className="font-bold text-slate-900">1</span> đến <span className="font-bold text-slate-900">5</span> trong tổng số <span className="font-bold text-slate-900">1,248</span> học sinh
          </p>
          <div className="flex items-center gap-1">
            <button className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 disabled:opacity-50">
              <ChevronLeft size={18} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm">1</button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-200 font-bold text-sm transition-colors">2</button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-200 font-bold text-sm transition-colors">3</button>
            <span className="w-8 h-8 flex items-center justify-center text-slate-400">...</span>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-200 font-bold text-sm transition-colors">25</button>
            <button className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
