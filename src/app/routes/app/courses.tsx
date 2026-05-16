import { useNavigate } from 'react-router';
import FeaturedCourses from '@/features/curriculum/components/featured-courses';
import { paths } from '@/config/paths';

export default function CoursesRoute() {
  const navigate = useNavigate();

  function handleOpenDetail(gradeId: number, lessonTypeId: string) {
    navigate(paths.courseDetail(gradeId, lessonTypeId));
    window.scrollTo(0, 0);
  }

  return (
    <div className="bg-surface-container-low pb-12 pt-10">
      <header className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        <h1 className="mt-2 text-4xl font-black tracking-tight text-on-surface md:text-5xl">
          Khóa học
        </h1>
        <p className="mt-3 max-w-2xl text-base text-on-surface-variant">
          Chọn khối lớp để khám phá 4 tuyến khóa học: Foundation, Advance, Strategy và VDC.
        </p>
      </header>

      <FeaturedCourses onCourseClick={handleOpenDetail} />
    </div>
  );
}
