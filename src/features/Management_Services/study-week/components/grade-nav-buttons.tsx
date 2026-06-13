import { NavLink } from 'react-router';
import { paths } from '@/config/paths';
import {
  STUDY_WEEK_GRADE_IDS,
  STUDY_WEEK_GRADE_LABEL,
} from '@/features/Management_Services/study-week/lib/constants';

export default function GradeNavButtons({
  weekUuid,
  activeGradeId,
}: {
  weekUuid: string;
  /**
   * Khối đang được hiển thị (nguồn từ StudyWeekDetail.resolvedGradeId).
   * Dùng để highlight thay cho NavLink.isActive: khi mở dropdown tuần từ
   * danh sách, URL chỉ là query param nên isActive luôn false, nhưng nội dung
   * vẫn mặc định render K10 — highlight phải bám theo nội dung thực tế.
   */
  activeGradeId: number;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {STUDY_WEEK_GRADE_IDS.map((gradeId) => {
        const isActive = gradeId === activeGradeId;
        return (
          <NavLink
            key={gradeId}
            to={paths.adminPortalStudyWeekByGrade(weekUuid, gradeId)}
            className={`inline-flex h-10 items-center justify-center rounded-xl border px-4 text-[13px] font-extrabold transition ${
              isActive
                ? 'border-[#1870FF] bg-[#1870FF] text-white shadow-[0_10px_18px_rgba(24,112,255,0.22)]'
                : 'border-slate-200 bg-white text-slate-600 hover:border-[#1870FF] hover:text-[#1870FF]'
            }`}
          >
            {STUDY_WEEK_GRADE_LABEL[gradeId]}
          </NavLink>
        );
      })}
    </div>
  );
}

