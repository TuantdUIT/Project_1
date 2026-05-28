import { useNavigate } from 'react-router';
import { useLessonPersonnelByGrade } from '@/features/Management_Services/study-week/hooks/use-lesson-personnel-by-grade';
import { useLessonsByWeekAndGrade } from '@/features/Management_Services/study-week/hooks/use-lessons-by-week-and-grade';
import {
  STUDY_WEEK_GRADE_LABEL,
  isStudyWeekGradeId,
} from '@/features/Management_Services/study-week/lib/constants';
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
  const personnelQuery = useLessonPersonnelByGrade(lessonsQuery.lessons, resolvedGradeId);
  const gradeLabel = STUDY_WEEK_GRADE_LABEL[resolvedGradeId];

  return (
    <div className="space-y-4">
      <GradeNavButtons weekUuid={weekUuid} />

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[12px] font-black uppercase tracking-[0.08em] text-slate-500">
            <tr>
              <th className="px-5 py-3">Thu</th>
              <th className="px-5 py-3">Ngay</th>
              <th className="px-5 py-3">Gio</th>
              <th className="px-5 py-3">Loai buoi</th>
              <th className="px-5 py-3">Nhan su</th>
              <th className="px-5 py-3">Thoi gian ket thuc</th>
              <th className="px-5 py-3">Trang thai</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lessonsQuery.lessons.map((lesson) => (
              <LessonRow
                key={lesson.lesson_uuid}
                lesson={lesson}
                weekUuid={weekUuid}
                gradeId={resolvedGradeId}
                personnel={
                  lesson.lesson_uuid
                    ? personnelQuery.personnelByLessonUuid.get(lesson.lesson_uuid) ?? []
                    : []
                }
                isPersonnelLoading={personnelQuery.isLoading}
                isPersonnelError={personnelQuery.isError}
                onOpen={navigate}
              />
            ))}
          </tbody>
        </table>

        {lessonsQuery.isLoading ? (
          <p className="px-5 py-6 text-center text-[14px] font-semibold text-slate-500">
            Dang tai buoi hoc...
          </p>
        ) : null}

        {lessonsQuery.isError ? (
          <p className="px-5 py-6 text-center text-[14px] font-semibold text-rose-600">
            Khong tai duoc danh sach buoi hoc.
          </p>
        ) : null}

        {!lessonsQuery.isLoading && !lessonsQuery.isError && !lessonsQuery.lessons.length ? (
          <p className="px-5 py-6 text-center text-[14px] font-semibold text-slate-500">
            Khoi {gradeLabel} chua co buoi hoc nao trong tuan nay.
          </p>
        ) : null}
      </div>
    </div>
  );
}
