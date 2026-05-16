import StatsCards from '@/features/admin/components/stats-cards';
import { useStudentsQuery } from '@/features/admin';
import { useGradesQuery, useLessonTypesQuery } from '@/features/curriculum';

export default function AdminOverviewRoute() {
  const currentYear = new Date().getFullYear();
  const activeStudentsQuery = useStudentsQuery({
    studentStatus: 'ACTIVE',
    schoolYear: currentYear,
    page: 1,
    size: 1,
  });
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
        totalStudents={activeStudentsQuery.data?.meta.totalItems ?? 0}
        waitingStudents={waitingStudentsQuery.data?.meta.totalItems ?? 0}
        totalGrades={gradesQuery.data?.length ?? 0}
        totalLessonTypes={lessonTypesQuery.data?.length ?? 0}
      />
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-slate-500 shadow-[0_16px_36px_rgba(15,23,42,0.24)]">
        Các biểu đồ doanh thu, hiệu suất trợ giảng và timeline lịch dạy được chuyển sang P1.5 khi BE có endpoint phù hợp.
      </div>
    </div>
  );
}
