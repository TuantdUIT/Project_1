import { Link, Navigate, useParams } from 'react-router';
import { paths } from '@/config/paths';
import AttendancePanel from '@/features/attendance/components/attendance-panel';
import { useLessonQuery } from '@/features/study-week/api/lessons';
import {
  DEFAULT_STUDY_WEEK_GRADE_ID,
  isStudyWeekGradeId,
} from '@/features/study-week/lib/constants';
import { formatDate, formatLessonTime } from '@/features/study-week/lib/format-week';

const tabs = ['Điểm danh', 'Ghi nhận buổi học', 'Xử lý vi phạm'] as const;

export default function LessonDetail() {
  const { weekUuid = '', gradeId = '', lessonUuid = '' } = useParams();
  const numericGradeId = Number(gradeId);
  const lessonQuery = useLessonQuery(lessonUuid);

  if (!isStudyWeekGradeId(numericGradeId)) {
    return <Navigate to={paths.adminPortalStudyWeekByGrade(weekUuid, DEFAULT_STUDY_WEEK_GRADE_ID)} replace />;
  }

  if (lessonQuery.isLoading) {
    return <p className="rounded-2xl bg-white p-6 text-[14px] font-semibold text-slate-500">Đang tải buổi học...</p>;
  }

  if (lessonQuery.isError || !lessonQuery.data) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
        <p className="text-[14px] font-bold">Không tìm thấy buổi học.</p>
        <Link to={paths.adminPortalStudyWeekByGrade(weekUuid, numericGradeId)} className="mt-3 inline-block text-[13px] font-black underline">
          Quay lại tuần học
        </Link>
      </div>
    );
  }

  const lesson = lessonQuery.data;

  if (lesson.study_week?.week_uuid && lesson.study_week.week_uuid !== weekUuid) {
    return (
      <Navigate
        to={paths.adminPortalStudyWeekByGrade(lesson.study_week.week_uuid, lesson.grade?.id ?? numericGradeId)}
        replace
      />
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.10)]">
        <p className="text-[12px] font-black uppercase tracking-[0.22em] text-slate-400">Chi tiết buổi học</p>
        <h2 className="mt-3 text-[24px] font-black leading-tight text-slate-950">
          {lesson.lesson_type?.lesson_type_name ?? 'Buổi học'}
        </h2>
        <p className="mt-4 text-[16px] font-bold text-slate-500">
          {formatDate(lesson.lesson_date)} - {formatLessonTime(lesson.lesson_start_time)} - {lesson.grade?.name ?? '-'}
        </p>
      </section>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        {tabs.map((tab, index) => (
          <button
            key={tab}
            type="button"
            className={`rounded-xl border px-4 py-2 text-[13px] font-extrabold transition ${
              index === 0
                ? 'border-[#1870FF] bg-[#1870FF] text-white shadow-[0_10px_18px_rgba(24,112,255,0.18)]'
                : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-[#1870FF] hover:text-[#1870FF]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.10)]">
        <AttendancePanel lesson={lesson} />
      </section>
    </div>
  );
}

