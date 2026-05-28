import { Navigate, useParams } from 'react-router';
import { paths } from '@/config/paths';
import TimetableView from '@/features/Management_Services/timetable-template/components/timetable-view';
import { isPrimaryGradeId } from '@/features/Management_Services/timetable-template/lib/supplement-grades';

export default function AdminTimetableByGradeRoute() {
  const { gradeId } = useParams();
  const parsed = Number(gradeId);

  if (!Number.isFinite(parsed) || !isPrimaryGradeId(parsed)) {
    return <Navigate to={paths.adminPortalTimetableAll} replace />;
  }

  return <TimetableView primaryGradeId={parsed} />;
}
