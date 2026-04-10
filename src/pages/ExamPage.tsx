import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Flag, 
  CheckCircle2, 
  User as UserIcon,
  AlertCircle,
  Sigma,
  Calculator,
  BarChart3,
  Compass
} from 'lucide-react';

interface Exam {
  id: string;
  title: string;
  status: 'ready' | 'locked';
  icon: React.ReactNode;
  color: string;
  duration: number; // in minutes
}

const exams: Exam[] = [
  {
    id: '1',
    title: 'Toán học 12 - Nâng cao A',
    status: 'ready',
    icon: <Sigma className="text-blue-600" />,
    color: 'bg-blue-50',
    duration: 45
  },
  {
    id: '2',
    title: 'Toán học 11 - Chiến thuật S',
    status: 'ready',
    icon: <Calculator className="text-green-600" />,
    color: 'bg-green-50',
    duration: 45
  },
  {
    id: '3',
    title: 'Toán học 10 - Nền tảng F',
    status: 'ready',
    icon: <BarChart3 className="text-orange-600" />,
    color: 'bg-orange-50',
    duration: 45
  },
  {
    id: '4',
    title: 'Toán học 12 - Chiến thuật S',
    status: 'locked',
    icon: <Compass className="text-purple-600" />,
    color: 'bg-purple-50',
    duration: 45
  }
];

export default function ExamPage() {
  const [view, setView] = useState<'wait' | 'room'>('wait');
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(1);

  // Timer logic
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (view === 'room' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [view, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startExam = (exam: Exam) => {
    if (exam.status === 'locked') return;
    setSelectedExam(exam);
    setTimeLeft(exam.duration * 60);
    setView('room');
  };

  if (view === 'wait') {
    return (
      <div className="bg-slate-50 min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          {/* Greeting Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-12 border border-slate-200 shadow-sm mb-12"
          >
            <h1 className="text-5xl font-black text-slate-900 mb-4 tracking-tight">
              Hi Tuấn Trần Dương,
            </h1>
            <p className="text-slate-500 text-xl font-medium">
              Continue learning with passion tonight!
            </p>
          </motion.div>

          {/* Exam List Section */}
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black text-slate-900">Bài thi của bạn</h2>
            <button className="text-indigo-600 font-bold hover:underline">Xem tất cả</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {exams.map((exam) => (
              <motion.div
                key={exam.id}
                whileHover={{ y: -5 }}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col h-full"
              >
                <div className={`w-12 h-12 ${exam.color} rounded-xl flex items-center justify-center mb-6`}>
                  {exam.icon}
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-auto leading-tight">
                  {exam.title}
                </h3>
                <div className="mt-8">
                  <button
                    onClick={() => startExam(exam)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold ${
                      exam.status === 'ready' 
                        ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' 
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {exam.status === 'ready' ? 'Sẵn sàng' : 'Chưa mở'}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col">
      {/* Exam Room Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <FileText className="text-indigo-600" size={24} />
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
              Kỳ thi cuối kỳ - Môn {selectedExam?.title}
            </h2>
          </div>
          <div className="bg-indigo-600 text-white px-6 py-2 rounded-xl flex items-center gap-3 shadow-lg shadow-indigo-200">
            <Clock size={20} />
            <span className="text-2xl font-black tabular-nums">
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>
      </header>

      <div className="flex-grow flex max-w-[1600px] mx-auto w-full p-6 gap-6">
        {/* Sidebar */}
        <aside className="w-80 flex-shrink-0 flex flex-col gap-6">
          {/* User Info */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <UserIcon size={24} />
              </div>
              <div>
                <h4 className="font-black text-slate-900">Nguyễn Văn A</h4>
                <p className="text-xs font-bold text-slate-400">SBD: 123456</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Danh sách câu hỏi</span>
                <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-2 py-0.5 rounded uppercase">8/22 Hoàn thành</span>
              </div>

              {/* Question Grid Part I */}
              <div>
                <p className="text-[10px] font-black text-slate-900 mb-3 flex items-center gap-2">
                  <FileText size={12} /> PHẦN I: TRẮC NGHIỆM
                </p>
                <div className="grid grid-cols-6 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                    <button
                      key={num}
                      onClick={() => setCurrentQuestion(num)}
                      className={`h-10 rounded-lg text-sm font-black transition-all ${
                        currentQuestion === num 
                          ? 'bg-blue-600 text-white shadow-md' 
                          : num <= 8 ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Grid Part II */}
              <div>
                <p className="text-[10px] font-black text-slate-900 mb-3 flex items-center gap-2">
                  <CheckCircle2 size={12} /> PHẦN II: ĐÚNG/SAI
                </p>
                <div className="grid grid-cols-6 gap-2">
                  {[13, 14, 15, 16].map((num) => (
                    <button
                      key={num}
                      onClick={() => setCurrentQuestion(num)}
                      className={`h-10 rounded-lg text-sm font-black transition-all ${
                        currentQuestion === num 
                          ? 'bg-blue-600 text-white shadow-md' 
                          : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Grid Part III */}
              <div>
                <p className="text-[10px] font-black text-slate-900 mb-3 flex items-center gap-2">
                  <AlertCircle size={12} /> PHẦN III: TRẢ LỜI NGẮN
                </p>
                <div className="grid grid-cols-6 gap-2">
                  {[17, 18, 19, 20, 21, 22].map((num) => (
                    <button
                      key={num}
                      onClick={() => setCurrentQuestion(num)}
                      className={`h-10 rounded-lg text-sm font-black transition-all ${
                        currentQuestion === num 
                          ? 'bg-blue-600 text-white shadow-md' 
                          : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button className="w-full bg-blue-600 text-white py-4 rounded-xl font-black mt-8 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2">
              <ChevronRight size={18} className="rotate-180" />
              Nộp bài thi
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-grow flex flex-col gap-6 overflow-y-auto max-h-[calc(100vh-120px)] pr-2">
          {/* Question 1 (Multiple Choice) */}
          <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm relative">
            <div className="flex justify-between items-start mb-8">
              <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-3 py-1 rounded uppercase tracking-wider">
                Câu hỏi 1 • Phần I
              </span>
              <button className="text-slate-400 hover:text-indigo-600 transition-colors">
                <Flag size={20} />
              </button>
            </div>
            
            <h3 className="text-xl font-bold text-slate-900 mb-10 leading-relaxed">
              Trong các hàm số sau đây, hàm số nào là hàm số bậc hai có đồ thị đi qua gốc tọa độ?
            </h3>

            <div className="space-y-4">
              {[
                { id: 'A', text: 'y = x² + 2x + 1' },
                { id: 'B', text: 'y = -2x²', selected: true },
                { id: 'C', text: 'y = 3x - 1' },
                { id: 'D', text: 'y = x³' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left ${
                    opt.selected 
                      ? 'border-blue-600 bg-blue-50/30' 
                      : 'border-slate-100 hover:border-blue-200'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    opt.selected ? 'border-blue-600 bg-blue-600' : 'border-slate-200'
                  }`}>
                    {opt.selected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <span className={`font-bold ${opt.selected ? 'text-blue-700' : 'text-slate-600'}`}>
                    {opt.id}. {opt.text}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Question 13 (True/False) */}
          <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-8">
              <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-3 py-1 rounded uppercase tracking-wider">
                Câu hỏi 13 • Phần II
              </span>
            </div>
            
            <h3 className="text-xl font-bold text-slate-900 mb-10 leading-relaxed">
              Cho biểu thức P = log₂(x² - 4). Các khẳng định sau đây Đúng hay Sai?
            </h3>

            <div className="overflow-hidden rounded-2xl border border-slate-100">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ý</th>
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nội dung khẳng định</th>
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Đúng</th>
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Sai</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    { id: 'a', text: 'Biểu thức P xác định khi và chỉ khi x > 2.' },
                    { id: 'b', text: 'Tại x = 3, giá trị của biểu thức P là log₂5.', correct: true },
                    { id: 'c', text: "Đạo hàm của P là P' = 2x / (x² - 4)." },
                    { id: 'd', text: 'Tập xác định của hàm số là (-∞; -2) ∪ (2; +∞).', correct: true }
                  ].map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-black text-slate-900">{row.id}</td>
                      <td className="p-4 text-sm font-bold text-slate-600">{row.text}</td>
                      <td className="p-4 text-center">
                        <button className={`w-6 h-6 rounded-full border-2 mx-auto flex items-center justify-center ${
                          row.correct ? 'border-blue-600 bg-blue-600' : 'border-slate-200'
                        }`}>
                          {row.correct && <div className="w-2 h-2 rounded-full bg-white" />}
                        </button>
                      </td>
                      <td className="p-4 text-center">
                        <button className="w-6 h-6 rounded-full border-2 border-slate-200 mx-auto" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Question 17 (Short Answer) */}
          <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-8">
              <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-3 py-1 rounded uppercase tracking-wider">
                Câu hỏi 17 • Phần III
              </span>
            </div>
            
            <h3 className="text-xl font-bold text-slate-900 mb-10 leading-relaxed">
              Tìm giá trị cực đại của hàm số y = -x³ + 3x + 1. Nhập kết quả dưới dạng số nguyên hoặc số thập phân.
            </h3>

            <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đáp án của bạn</p>
              <div className="relative max-w-md">
                <input 
                  type="text" 
                  defaultValue="3"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-black text-blue-600 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500">
                  <CheckCircle2 size={24} />
                </div>
              </div>
              <p className="text-[10px] font-bold text-slate-400">Hệ thống sẽ tự động lưu sau khi bạn nhập.</p>
            </div>
          </div>

          {/* Bottom Navigation */}
          <div className="flex justify-between items-center mt-4 mb-12">
            <button className="flex items-center gap-2 px-8 py-4 bg-white border border-slate-200 rounded-2xl font-black text-slate-900 hover:bg-slate-50 transition-all shadow-sm">
              <ChevronLeft size={20} />
              Câu trước
            </button>
            <div className="flex gap-4">
              <button className="px-8 py-4 bg-slate-100 rounded-2xl font-black text-slate-600 hover:bg-slate-200 transition-all">
                Đánh dấu để xem lại
              </button>
              <button className="flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                Câu tiếp theo
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
