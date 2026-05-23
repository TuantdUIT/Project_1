import { Navigate, useParams } from 'react-router';
import { paths } from '@/config/paths';
import StudyWeekList from '@/features/study-week/components/study-week-list';
import {
  DEFAULT_STUDY_WEEK_GRADE_ID,
  isStudyWeekGradeId,
} from '@/features/study-week/lib/constants';

export default function AdminStudyWeekByGradeRoute() {
  const { weekUuid = '', gradeId = '' } = useParams();
  const numericGradeId = Number(gradeId);

  if (!isStudyWeekGradeId(numericGradeId)) {
    return <Navigate to={paths.adminPortalStudyWeekByGrade(weekUuid, DEFAULT_STUDY_WEEK_GRADE_ID)} replace />;
  }

  return <StudyWeekList />;
}

