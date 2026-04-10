import HomeHero from '../components/HomeHero';
import TeacherSection from '../components/TeacherSection';
import FeaturedCourses from '../components/FeaturedCourses';
import ConsultationForm from '../components/ConsultationForm';

interface HomePageProps {
  onCourseClick: (courseId: string) => void;
}

export default function HomePage({ onCourseClick }: HomePageProps) {
  return (
    <>
      <HomeHero />
      <TeacherSection />
      <FeaturedCourses onCourseClick={onCourseClick} />
      <ConsultationForm />
    </>
  );
}
