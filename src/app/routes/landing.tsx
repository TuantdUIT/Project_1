import { useNavigate } from 'react-router';
import ConsultationForm from '@/features/landing/components/consultation-form';
import HomeHero from '@/features/landing/components/home-hero';
import TeacherSection from '@/features/landing/components/teacher-section';
import FeaturedCourses from '@/features/curriculum/components/featured-courses';
import { paths } from '@/config/paths';

/**
 * Ý nghĩa: Render trang chủ public và điều hướng sang chi tiết khóa học khi user chọn khóa.
 * Hàm sử dụng hàm này làm đầu vào: router lazy-load component này cho path / để hiển thị landing page.
 */
export default function LandingRoute() {
  const navigate = useNavigate();

  /**
   * Ý nghĩa: Nhận courseId từ FeaturedCourses rồi chuyển thành URL /courses/:id.
   * Hàm sử dụng hàm này làm đầu vào: FeaturedCourses nhận hàm này qua prop onCourseClick để xử lý click vào khóa học.
   */
  function handleCourseClick(gradeId: number, lessonTypeId: string) {
    navigate(paths.courseDetail(gradeId, lessonTypeId));
    window.scrollTo(0, 0);
  }

  return (
    <>
      <HomeHero />
      <TeacherSection />
      <FeaturedCourses onCourseClick={handleCourseClick} />
      <ConsultationForm />
    </>
  );
}
