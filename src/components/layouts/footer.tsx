import { GraduationCap, Facebook, Youtube, Globe } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#0f172a] text-white pt-16 pb-8 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-deep rounded-academic-sm flex items-center justify-center text-white">
                <GraduationCap size={20} />
              </div>
              <span className="font-bold text-xl tracking-tight">BHP Math</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              Nền tảng học tập trực tuyến hàng đầu Việt Nam, cung cấp lộ trình học tập tối ưu cho học sinh THPT chuẩn bị cho các kỳ thi quan trọng.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-blue-800 flex items-center justify-center hover:bg-indigo-deep transition-colors">
                <Facebook size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-blue-800 flex items-center justify-center hover:bg-indigo-deep transition-colors">
                <Youtube size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-blue-800 flex items-center justify-center hover:bg-indigo-deep transition-colors">
                <Globe size={18} />
              </a>
            </div>
          </div>

          {/* Links Columns */}
          <div>
            <h4 className="font-bold text-lg mb-6">Khám phá</h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li><a href="#" className="hover:text-white transition-colors">Tất cả khóa học</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Thi thử online</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Tài liệu miễn phí</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Hướng dẫn học tập</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-6">Hỗ trợ</h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li><a href="#" className="hover:text-white transition-colors">Trung tâm trợ giúp</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Điều khoản dịch vụ</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Chính sách bảo mật</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Liên hệ hợp tác</a></li>
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h4 className="font-bold text-lg mb-6">Liên hệ</h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li className="flex items-start gap-3">
                <span className="text-indigo-deep">📍</span>
                123 Đường ABC, Quận Cầu Giấy, Hà Nội
              </li>
              <li className="flex items-center gap-3">
                <span className="text-indigo-deep">📧</span>
                support@edtechpro.edu.vn
              </li>
              <li className="flex items-center gap-3">
                <span className="text-indigo-deep">📞</span>
                1900 123 456
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 text-center text-xs text-slate-500">
          © 2024 BHP Math. All rights reserved. Designed for excellence.
        </div>
      </div>
    </footer>
  );
}
