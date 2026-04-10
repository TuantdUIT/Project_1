import { useState } from 'react';
import { motion } from 'motion/react';

const categories = ['2k8', '2k9', '2k10', 'ĐGNL'];

const featuredCourses = [
  {
    id: 'F',
    type: 'F',
    title: 'Khóa học Nền tảng (Foundation)',
    subtitle: 'NẮM VỮNG LÍ THUYẾT',
    description: 'Xây dựng gốc kiến thức Toán học vững chắc, bám sát chương trình GDPT mới.',
    color: '#f97316',
    tags: ['TOÁN 12', 'NỀN TẢNG']
  },
  {
    id: 'A',
    type: 'A',
    title: 'Khóa học Nâng cao (Advanced)',
    subtitle: 'LUYỆN THI CHINH PHỤC',
    description: 'Bứt phá các dạng toán khó, chinh phục điểm số 9+ trong các kỳ thi.',
    color: '#1152D4',
    tags: ['TOÁN 12', 'NÂNG CAO']
  },
  {
    id: 'S',
    type: 'S',
    title: 'Khóa học Chiến thuật (Strategy)',
    subtitle: 'LUYỆN ĐỀ ĐỈNH CAO',
    description: 'Kỹ năng thực chiến giải đề, tối ưu hóa thời gian và phương pháp làm bài.',
    color: '#ea580c',
    tags: ['TOÁN 12', 'CHIẾN THUẬT']
  }
];

interface FeaturedCoursesProps {
  onCourseClick: (courseId: string) => void;
}

export default function FeaturedCourses({ onCourseClick }: FeaturedCoursesProps) {
  const [activeTab, setActiveTab] = useState('2k8');

  const getTabConfig = (tab: string) => {
    switch (tab) {
      case '2k9':
        return { color: '#f97316', tag: 'TOÁN 11', badge: '2k9' };
      case '2k10':
        return { color: '#22c55e', tag: 'TOÁN 10', badge: '2k10' };
      default:
        return { color: '#38bdf8', tag: 'TOÁN 12', badge: '2k8' };
    }
  };

  const config = getTabConfig(activeTab);

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold text-on-surface mb-6">Các khóa học tiêu biểu</h2>
        
        <div className="flex justify-center gap-3 mb-12">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`px-6 py-1.5 rounded-full text-sm font-bold transition-all ${
                activeTab === cat
                  ? 'bg-indigo-deep text-white shadow-academic-lg'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-dim'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {featuredCourses.map((course, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ y: -10 }}
              className="card-surface flex flex-col h-full text-left"
            >
              <div 
                className="relative aspect-[4/3] flex flex-col items-center justify-center text-center p-6 text-white"
                style={{ backgroundColor: config.color }}
              >
                <div className="text-xs font-bold opacity-80 mb-1">{config.badge}</div>
                <div className="text-lg font-extrabold mb-1">{course.subtitle}</div>
                <div className="text-9xl font-black leading-none my-2">{course.type}</div>
                <div className="text-xs font-bold tracking-widest uppercase">NỀN TẢNG (FOUNDATION)</div>
              </div>
              
              <div className="p-6 flex flex-col flex-grow">
                <div className="flex gap-2 mb-3">
                  <span className="px-2 py-0.5 bg-secondary text-indigo-deep text-[10px] font-bold rounded uppercase">
                    {config.tag}
                  </span>
                  {course.tags.filter(t => !t.startsWith('TOÁN')).map(tag => (
                    <span key={tag} className="px-2 py-0.5 bg-secondary text-indigo-deep text-[10px] font-bold rounded uppercase">
                      {tag}
                    </span>
                  ))}
                </div>
                <h3 className="font-bold text-lg text-on-surface mb-2">{course.title.replace('12', activeTab === '2k9' ? '11' : activeTab === '2k10' ? '10' : '12')}</h3>
                <p className="text-sm text-on-surface-variant mb-6 flex-grow">
                  {course.description}
                </p>
                <button 
                  onClick={() => onCourseClick(`${activeTab}-${course.id}`)}
                  className="w-full py-2.5 border border-indigo-deep/20 text-indigo-deep font-bold text-sm rounded-academic hover:bg-indigo-50 transition-colors"
                >
                  Xem chi tiết
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
