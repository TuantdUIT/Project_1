import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router';
import { BookOpen, CalendarDays, ChevronDown, Clock3, GraduationCap, UsersRound } from 'lucide-react';
import { paths } from '@/config/paths';
import AttendancePanel from '@/features/attendance/components/attendance-panel';
import RecordAttendancePanel from '@/features/attendance/components/record-attendance-panel';
import { useLessonQuery } from '@/features/study-week/api/lessons';
import { useLessonPersonnelByGrade } from '@/features/study-week/hooks/use-lesson-personnel-by-grade';
import {
  DEFAULT_STUDY_WEEK_GRADE_ID,
  isStudyWeekGradeId,
} from '@/features/study-week/lib/constants';
import { formatDate, formatLessonTime } from '@/features/study-week/lib/format-week';
import { formatWeekday } from '@/utils/date';

function normalizeLessonStartTime(value?: string) {
  if (!value) return '-';

  const trimmed = value.trim();
  if (/^\d{2}:\d{2}$/.test(trimmed)) return trimmed;
  if (/^\d{2}:\d{2}:\d{2}$/.test(trimmed)) return trimmed.slice(0, 5);

  return formatLessonTime(value);
}

function LessonInfoBlock({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 border-slate-200 px-3 py-2 lg:border-r lg:last:border-r-0 xl:gap-4 xl:px-5">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#1870FF] xl:h-12 xl:w-12">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block whitespace-nowrap text-[12px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</span>
        <span className="mt-1 block truncate text-[16px] font-black text-slate-950">{value}</span>
      </span>
    </div>
  );
}

function DropdownSection({
  title,
  description,
  icon,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.10)]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-slate-50 sm:px-6"
        aria-expanded={isOpen}
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1870FF]">
            {icon}
          </span>
          <span className="min-w-0">
            <span className="block text-[17px] font-black text-slate-950">{title}</span>
            <span className="mt-1 block truncate text-[13px] font-bold text-slate-500">{description}</span>
          </span>
        </span>
        <ChevronDown
          size={22}
          className={`shrink-0 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <div className={`grid transition-[grid-template-rows] duration-300 ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <div className="border-t border-slate-100 p-5 sm:p-6">{children}</div>
        </div>
      </div>
    </section>
  );
}

export default function LessonDetail() {
  const { weekUuid = '', gradeId = '', lessonUuid = '' } = useParams();
  const numericGradeId = Number(gradeId);
  const lessonQuery = useLessonQuery(lessonUuid);
  const personnelQuery = useLessonPersonnelByGrade(
    lessonQuery.data ? [lessonQuery.data] : [],
    isStudyWeekGradeId(numericGradeId) ? numericGradeId : undefined,
  );
  const [isStudentOpen, setStudentOpen] = useState(true);
  const [isStaffOpen, setStaffOpen] = useState(false);

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
  const templatePersonnel = lesson.lesson_uuid
    ? personnelQuery.personnelByLessonUuid.get(lesson.lesson_uuid) ?? []
    : [];
  const lessonGradeName = lesson.grade?.name ?? '-';

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
        {/* <h2 className="mt-3 text-[24px] font-black leading-tight text-slate-950">
          {lesson.lesson_type?.lesson_type_name ?? 'Buổi học'}
        </h2> */}

        <div className="mt-10 grid gap-4 lg:grid-cols-[minmax(120px,0.8fr)_minmax(260px,2.1fr)_minmax(130px,0.95fr)_minmax(120px,0.9fr)_minmax(140px,1fr)] lg:gap-0">
          <LessonInfoBlock
            icon={<CalendarDays size={22} />}
            label="Tuần"
            value={`${lesson.study_week?.week_number ?? '-'}`}
          />
          <LessonInfoBlock
            icon={<CalendarDays size={22} />}
            label="Ngày học"
            value={`${formatWeekday(lesson.lesson_date)} · ${formatDate(lesson.lesson_date)}`}
          />
          <LessonInfoBlock
            icon={<Clock3 size={22} />}
            label="Bắt đầu"
            value={normalizeLessonStartTime(lesson.lesson_start_time)}
          />
          <LessonInfoBlock
            icon={<GraduationCap size={22} />}
            label="Khối"
            value={lessonGradeName}
          />
          <LessonInfoBlock
            icon={<BookOpen size={22} />}
            label="Loại buổi"
            value={lesson.lesson_type?.lesson_type_name ?? '-'}
          />
        </div>

      </section>

      <DropdownSection
        title="Điểm danh học sinh"
        description="Danh sách học sinh theo khối của buổi học"
        icon={<GraduationCap size={22} />}
        isOpen={isStudentOpen}
        onToggle={() => setStudentOpen((current) => !current)}
      >
        <AttendancePanel lesson={lesson} />
      </DropdownSection>

      <DropdownSection
        title="Điểm danh nhân sự"
        description="Giảng viên, trợ giảng và nhân sự hỗ trợ"
        icon={<UsersRound size={22} />}
        isOpen={isStaffOpen}
        onToggle={() => setStaffOpen((current) => !current)}
      >
        <RecordAttendancePanel
          lesson={lesson}
          templatePersonnel={templatePersonnel}
          isTemplatePersonnelLoading={personnelQuery.isLoading}
          isTemplatePersonnelError={personnelQuery.isError}
        />
      </DropdownSection>
    </div>
  );
}
