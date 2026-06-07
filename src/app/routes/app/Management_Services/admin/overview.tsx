import StatsCards from '@/features/Management_Services/admin/components/stats-cards';
import { useStudentsQuery } from '@/features/Management_Services/admin';
import { useGradesQuery, useLessonTypesQuery } from '@/features/Management_Services/curriculum';

export default function AdminOverviewRoute() {
  const currentYear = new Date().getFullYear();
  const waitingStudentsQuery = useStudentsQuery({
    studentStatus: 'WAITING',
    schoolYear: currentYear,
    page: 1,
    size: 1,
  });
  const gradesQuery = useGradesQuery();
  const lessonTypesQuery = useLessonTypesQuery();

  return (
    <div className="space-y-6">
      <StatsCards
        totalStudents={gradesQuery.data?.totalActiveStudents ?? 0}
        waitingStudents={waitingStudentsQuery.data?.meta.totalItems ?? 0}
        totalGrades={gradesQuery.data?.grades?.length ?? 0}
        totalLessonTypes={lessonTypesQuery.data?.length ?? 0}
      />
     
    </div>
  );
}
