import { Phone, Mail } from 'lucide-react';

export default function ConsultationForm() {
  return (
    <section className="py-20 bg-surface-container-low">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl shadow-academic-lg overflow-hidden flex flex-col lg:flex-row">
          {/* Left Side */}
          <div className="lg:w-2/5 bg-indigo-deep p-12 text-white flex flex-col justify-center">
            <h2 className="text-3xl font-black mb-6 leading-tight">
              Nhận tư vấn lộ trình học tập miễn phí
            </h2>
            <p className="text-white/80 mb-10 leading-relaxed">
              Để lại thông tin, các chuyên gia tư vấn giáo dục của chúng tôi sẽ liên hệ với bạn trong vòng 24 giờ.
            </p>
            
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <Phone size={20} />
                </div>
                <div>
                  <div className="text-xs opacity-60 font-bold uppercase tracking-wider">Hotline</div>
                  <div className="font-bold">1900 123 456</div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <Mail size={20} />
                </div>
                <div>
                  <div className="text-xs opacity-60 font-bold uppercase tracking-wider">Email</div>
                  <div className="font-bold">contact@edtechpro.vn</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="lg:w-3/5 p-12">
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase">Họ và tên</label>
                  <input 
                    type="text" 
                    placeholder="Nhập họ và tên"
                    className="w-full px-4 py-3 rounded-academic border border-on-surface/10 focus:border-indigo-deep focus:ring-1 focus:ring-indigo-deep outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase">Lớp</label>
                  <select className="w-full px-4 py-3 rounded-academic border border-on-surface/10 focus:border-indigo-deep focus:ring-1 focus:ring-indigo-deep outline-none transition-all bg-white">
                    <option>Lớp 10</option>
                    <option>Lớp 11</option>
                    <option>Lớp 12</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase">Trường học</label>
                  <input 
                    type="text" 
                    placeholder="Tên trường của bạn"
                    className="w-full px-4 py-3 rounded-academic border border-on-surface/10 focus:border-indigo-deep focus:ring-1 focus:ring-indigo-deep outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase">Tỉnh/Thành phố</label>
                  <input 
                    type="text" 
                    placeholder="Nơi bạn đang sống"
                    className="w-full px-4 py-3 rounded-academic border border-on-surface/10 focus:border-indigo-deep focus:ring-1 focus:ring-indigo-deep outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface-variant uppercase">Lời nhắn (không bắt buộc)</label>
                <textarea 
                  rows={4}
                  placeholder="Bạn cần tư vấn thêm điều gì?"
                  className="w-full px-4 py-3 rounded-academic border border-on-surface/10 focus:border-indigo-deep focus:ring-1 focus:ring-indigo-deep outline-none transition-all resize-none"
                />
              </div>

              <button type="submit" className="w-full btn-primary py-4 text-lg font-bold">
                Gửi thông tin ngay
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
