import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle, 
  Users, 
  MessageCircle, 
  Clock, 
  Star,
  ArrowLeft,
  Share2,
  Copy,
  Download
} from 'lucide-react';
import { CourseDetail } from '../data/courseDetails';

interface CourseDetailPageProps {
  course: CourseDetail;
  onBack: () => void;
}

export default function CourseDetailPage({ course, onBack }: CourseDetailPageProps) {
  const [expandedWeeks, setExpandedWeeks] = useState<number[]>([0]);

  const toggleWeek = (index: number) => {
    setExpandedWeeks(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  return (
    <div className="bg-surface-container-lowest min-h-screen pb-20">
      {/* Header / Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <button 
          onClick={onBack}
          className="flex items-center text-on-surface-variant hover:text-indigo-deep transition-colors mb-6"
        >
          <ArrowLeft size={20} className="mr-2" />
          <span className="font-medium">Quay lại danh sách khóa học</span>
        </button>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Main Content */}
          <div className="flex-grow lg:w-2/3">
            <div className="flex items-center gap-4 mb-4">
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded uppercase tracking-wider">
                Đang hoạt động
              </span>
              <div className="flex items-center text-on-surface-variant text-sm">
                <Star size={16} className="text-yellow-400 fill-current mr-1" />
                <span className="font-bold text-on-surface">4.9</span>
                <span className="ml-1">(120 đánh giá)</span>
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-black text-on-surface mb-6 tracking-tight">
              {course.title}
            </h1>
            
            <p className="text-lg text-on-surface-variant mb-12 leading-relaxed max-w-3xl">
              {course.description}
            </p>

            <div className="mb-12">
              <h2 className="text-2xl font-bold text-on-surface mb-8 flex items-center">
                <FileText className="mr-3 text-indigo-deep" />
                Nội dung bài học theo tuần
              </h2>

              <div className="space-y-4">
                {course.curriculum.map((week, idx) => (
                  <div key={idx} className="bg-white rounded-xl border border-outline-variant overflow-hidden shadow-sm">
                    <button 
                      onClick={() => toggleWeek(idx)}
                      className="w-full px-6 py-5 flex items-center justify-between hover:bg-surface-container-low transition-colors"
                    >
                      <div className="flex items-center text-left">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-deep flex items-center justify-center font-bold mr-4 shrink-0">
                          {String(idx + 1).padStart(2, '0')}
                        </div>
                        <div>
                          <h3 className="font-bold text-on-surface">{week.title}</h3>
                          {week.lessons.length > 0 && (
                            <div className="flex items-center gap-3 mt-1 text-xs text-on-surface-variant font-medium">
                              <span className="flex items-center"><Play size={12} className="mr-1" /> {week.lessons.filter(l => l.type === 'video').length} BÀI GIẢNG</span>
                              <span className="flex items-center"><FileText size={12} className="mr-1" /> {week.lessons.filter(l => l.type === 'document').length} TÀI LIỆU</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {expandedWeeks.includes(idx) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>

                    <AnimatePresence>
                      {expandedWeeks.includes(idx) && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-outline-variant"
                        >
                          <div className="px-6 py-4 space-y-3">
                            {week.lessons.length > 0 ? (
                              week.lessons.map((lesson, lIdx) => (
                                <div key={lIdx} className="flex items-center justify-between py-2 group">
                                  <div className="flex items-center">
                                    <div className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center mr-3 group-hover:bg-indigo-50 transition-colors">
                                      {lesson.type === 'video' ? <Play size={14} className="text-on-surface-variant group-hover:text-indigo-deep" /> : <FileText size={14} className="text-on-surface-variant group-hover:text-indigo-deep" />}
                                    </div>
                                    <span className="text-sm font-medium text-on-surface group-hover:text-indigo-deep transition-colors">{lesson.title}</span>
                                    {lesson.title.includes('BẮT BUỘC') && (
                                      <span className="ml-3 px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded uppercase">Bắt buộc</span>
                                    )}
                                  </div>
                                  <div className="flex items-center text-xs font-bold text-on-surface-variant">
                                    {lesson.duration && <span className="mr-4">{lesson.duration}</span>}
                                    {lesson.type === 'document' ? <span className="text-indigo-deep">PDF</span> : null}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-on-surface-variant italic py-4">Nội dung đang được cập nhật...</p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-1/3">
            <div className="sticky top-24 space-y-6">
              <div className="bg-white rounded-2xl border border-outline-variant shadow-academic-lg overflow-hidden">
                {/* Course Thumbnail Card */}
                <div 
                  className="aspect-[4/3] flex flex-col items-center justify-center text-center p-8 text-white relative"
                  style={{ backgroundColor: course.color }}
                >
                  {/* Floating Action Buttons */}
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center hover:bg-black/40 transition-colors">
                      <Share2 size={18} />
                    </button>
                    <button className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center hover:bg-black/40 transition-colors">
                      <Copy size={18} />
                    </button>
                    <button className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center hover:bg-black/40 transition-colors">
                      <Download size={18} />
                    </button>
                  </div>

                  <div className="text-sm font-bold opacity-80 mb-2">{course.badge}</div>
                  <div className="text-xl font-extrabold mb-2 uppercase tracking-wider">{course.type === 'F' ? 'NẮM VỮNG LÍ THUYẾT' : course.type === 'A' ? 'LUYỆN THI CHINH PHỤC' : 'LUYỆN ĐỀ ĐỈNH CAO'}</div>
                  <div className="text-[140px] font-black leading-none my-4">{course.type}</div>
                  <div className="text-sm font-bold tracking-widest uppercase">
                    {course.type === 'F' ? 'NỀN TẢNG (FOUNDATION)' : course.type === 'A' ? 'NÂNG CAO (ADVANCED)' : 'CHIẾN THUẬT (STRATEGY)'}
                  </div>
                  <div className="mt-4 text-xs font-bold opacity-80 uppercase tracking-widest">TOÁN HỌC - CHUYÊN SÂU TRỌNG TÂM</div>
                </div>

                <div className="p-8">
                  <div className="flex items-baseline gap-3 mb-8">
                    <span className="text-3xl font-black text-on-surface">{course.price}</span>
                    <span className="text-on-surface-variant line-through text-sm">{course.originalPrice}</span>
                    <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded">
                      {course.discount}
                    </span>
                  </div>

                  <div className="space-y-3 mb-8">
                    <button className="w-full py-4 bg-indigo-deep text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
                      Đăng ký học ngay
                    </button>
                    <button className="w-full py-4 border-2 border-indigo-deep text-indigo-deep font-bold rounded-xl hover:bg-indigo-50 transition-all">
                      Liên hệ tư vấn
                    </button>
                  </div>

                  <div className="space-y-8">
                    <div>
                      <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4">Nội dung kiến thức</h4>
                      <ul className="space-y-4">
                        {course.objectives.map((obj, i) => (
                          <li key={i} className="flex gap-3">
                            <CheckCircle size={18} className="text-indigo-deep shrink-0 mt-0.5" />
                            <p className="text-sm text-on-surface-variant leading-relaxed">
                              <span className="font-bold text-on-surface">{i === 0 ? 'Mục tiêu: ' : 'Chương trình: '}</span>
                              {obj}
                            </p>
                          </li>
                        ))}
                        <li className="flex gap-3">
                          <Users size={18} className="text-indigo-deep shrink-0 mt-0.5" />
                          <p className="text-sm text-on-surface-variant leading-relaxed">
                            <span className="font-bold text-on-surface">Số lượng: </span>
                            {course.quantity}
                          </p>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4">Hình thức học</h4>
                      <ul className="space-y-4">
                        <li className="flex gap-3">
                          <Users size={18} className="text-indigo-deep shrink-0 mt-0.5" />
                          <p className="text-sm text-on-surface-variant leading-relaxed">
                            <span className="font-bold text-on-surface">Học trực tiếp tại trung tâm: </span>
                            Tương tác trực tiếp với giáo viên.
                          </p>
                        </li>
                        <li className="flex gap-3">
                          <Clock size={18} className="text-indigo-deep shrink-0 mt-0.5" />
                          <p className="text-sm text-on-surface-variant leading-relaxed">
                            <span className="font-bold text-on-surface">Luyện tập: </span>
                            Hệ thống bài tập tự luyện theo từng video bài giảng (File PDF và làm bài trên Web).
                          </p>
                        </li>
                        <li className="flex gap-3">
                          <MessageCircle size={18} className="text-indigo-deep shrink-0 mt-0.5" />
                          <p className="text-sm text-on-surface-variant leading-relaxed">
                            <span className="font-bold text-on-surface">Hỗ trợ: </span>
                            Đội ngũ trợ giảng trực chiến tại nhóm Zalo, giải đáp thắc mắc ngay khi gặp khó khăn.
                          </p>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Instructor Card */}
              <div className="bg-white rounded-2xl border border-outline-variant p-6 flex items-center gap-4 shadow-sm">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-indigo-50">
                  <img src={course.instructor.image} alt={course.instructor.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-indigo-deep uppercase tracking-widest mb-0.5">{course.instructor.title}</div>
                  <div className="font-bold text-on-surface">{course.instructor.name}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
