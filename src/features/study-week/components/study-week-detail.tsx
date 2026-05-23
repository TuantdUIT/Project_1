import { useNavigate } from 'react-router';
import { useLessonsByWeekAndGrade } from '@/features/study-week/hooks/use-lessons-by-week-and-grade';
import {
  STUDY_WEEK_GRADE_LABEL,
  isStudyWeekGradeId,
} from '@/features/study-week/lib/constants';
import GradeNavButtons from './grade-nav-buttons';
import LessonRow from './lesson-row';

export default function StudyWeekDetail({
  weekUuid,
  gradeId,
}: {
  weekUuid: string;
  gradeId: number;
}) {
  const navigate = useNavigate();
  const resolvedGradeId = isStudyWeekGradeId(gradeId) ? gradeId : 1;
  const lessonsQuery = useLessonsByWeekAndGrade(weekUuid, resolvedGradeId);
  const gradeLabel = STUDY_WEEK_GRADE_LABEL[resolvedGradeId];

  return (
    <div className="space-y-4">
      <GradeNavButtons weekUuid={weekUuid} />

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[12px] font-black uppercase tracking-[0.08em] text-slate-500">
            <tr>
              <th className="px-5 py-3">Ngày</th>
              <th className="px-5 py-3">Giờ</th>
              <th className="px-5 py-3">Loại buổi</th>
              <th className="px-5 py-3">Thời lượng</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lessonsQuery.lessons.map((lesson) => (
              <LessonRow
                key={lesson.lesson_uuid}
                lesson={lesson}
                weekUuid={weekUuid}
                gradeId={resolvedGradeId}
                onOpen={navigate}
              />
            ))}
          </tbody>
        </table>

        {lessonsQuery.isLoading ? (
          <p className="px-5 py-6 text-center text-[14px] font-semibold text-slate-500">
            Đang tải buổi học...
          </p>
        ) : null}

        {lessonsQuery.isError ? (
          <p className="px-5 py-6 text-center text-[14px] font-semibold text-rose-600">
            Không tải được danh sách buổi học.
          </p>
        ) : null}

        {!lessonsQuery.isLoading && !lessonsQuery.isError && !lessonsQuery.lessons.length ? (
          <p className="px-5 py-6 text-center text-[14px] font-semibold text-slate-500">
            Khối {gradeLabel} chưa có buổi học nào trong tuần này.
          </p>
        ) : null}
      </div>
    </div>
  );
}
