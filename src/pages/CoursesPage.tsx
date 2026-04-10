import Hero from '../components/Hero';
import CourseSection from '../components/CourseSection';

const sections = [
  {
    title: 'Lớp 12',
    badgeText: '2k8',
    courses: [
      {
        type: 'F' as const,
        title: 'Toán học 12 - Nền tảng (Foundation)',
        subtitle: 'NẮM VỮNG LÍ THUYẾT',
        description: 'Nắm vững lý thuyết, chuyên sâu trọng tâm để đạt điểm cao trong các kỳ thi.',
        lessons: 45,
        students: '1.2k',
        color: '#38bdf8' // Blue
      },
      {
        type: 'A' as const,
        title: 'Toán học 12 - Nâng cao (Advanced)',
        subtitle: 'LUYỆN THI CHINH PHỤC',
        description: 'Luyện thi chinh phục, bứt phá dạng toán khó và rèn luyện tư duy logic.',
        lessons: 32,
        students: '850',
        color: '#38bdf8'  // Blue
      },
      {
        type: 'S' as const,
        title: 'Toán học 11 - Chiến thuật (Strategy)',
        subtitle: 'LUYỆN ĐỀ ĐỈNH CAO',
        description: 'Luyện đề đỉnh cao, thực chiến và tối ưu điểm số với các phương pháp giải nhanh.',
        lessons: 50,
        students: '2.1k',
        color: '#38bdf8' // Blue
      }
    ]
  },
  {
    title: 'Lớp 11',
    badgeText: '2k9',
    courses: [
      {
        type: 'F' as const,
        title: 'Toán học 11 - Nền tảng (Foundation)',
        subtitle: 'NẮM VỮNG LÍ THUYẾT',
        description: 'Nắm vững lý thuyết, chuyên sâu trọng tâm để đạt điểm cao trong các kỳ thi.',
        lessons: 45,
        students: '1.2k',
        color: '#f97316' // Orange
      },
      {
        type: 'A' as const,
        title: 'Toán học 11 - Nâng cao (Advanced)',
        subtitle: 'LUYỆN THI CHINH PHỤC',
        description: 'Luyện thi chinh phục, bứt phá dạng toán khó và rèn luyện tư duy logic.',
        lessons: 32,
        students: '850',
        color: '#f97316' // Orange
      },
      {
        type: 'S' as const,
        title: 'Toán học 11 - Chiến thuật (Strategy)',
        subtitle: 'LUYỆN ĐỀ ĐỈNH CAO',
        description: 'Luyện đề đỉnh cao, thực chiến và tối ưu điểm số với các phương pháp giải nhanh.',
        lessons: 50,
        students: '2.1k',
        color: '#f97316' // Orange
      }
    ]
  },
  {
    title: 'Lớp 10',
    badgeText: '2k10',
    courses: [
      {
        type: 'F' as const,
        title: 'Toán học 10 - Nền tảng (Foundation)',
        subtitle: 'NẮM VỮNG LÍ THUYẾT',
        description: 'Xây dựng nền tảng vững chắc môn Toán ngay từ năm đầu cấp ba.',
        lessons: 36,
        students: '1.1k',
        color: '#22c55e' // Green
      },
      {
        type: 'A' as const,
        title: 'Toán học 10 - Nâng cao (Advanced)',
        subtitle: 'LUYỆN THI CHINH PHỤC',
        description: 'Tiếp cận phương pháp học Ngữ văn mới, rèn luyện kỹ năng viết và đọc hiểu.',
        lessons: 30,
        students: '900',
        color: '#22c55e' // Green
      },
      {
        type: 'S' as const,
        title: 'Toán học 10 - Chiến thuật (Strategy)',
        subtitle: 'LUYỆN ĐỀ ĐỈNH CAO',
        description: 'Học Vật lý qua các hiện tượng thực tiễn và bài tập rèn luyện tư duy.',
        lessons: 34,
        students: '1.5k',
        color: '#22c55e'// Green
      }
    ]
  }
];

interface CoursesPageProps {
  onCourseClick: (courseId: string) => void;
}

export default function CoursesPage({ onCourseClick }: CoursesPageProps) {
  return (
    <>
      <Hero />
      {sections.map((section, idx) => (
        <CourseSection 
          key={idx} 
          title={section.title}
          badgeText={section.badgeText}
          courses={section.courses}
          onCourseClick={onCourseClick}
        />
      ))}
    </>
  );
}
