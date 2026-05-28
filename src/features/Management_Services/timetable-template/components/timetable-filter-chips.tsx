import { NavLink, useSearchParams } from 'react-router';
import { paths } from '@/config/paths';
import {
  PRIMARY_GRADE_IDS,
  primaryGradeTitle,
} from '@/features/Management_Services/timetable-template/lib/supplement-grades';

export default function TimetableFilterChips() {
  const [searchParams] = useSearchParams();
  const currentSearch = searchParams.toString();
  const withCurrentSearch = (path: string) =>
    currentSearch ? `${path}?${currentSearch}` : path;

  return (
    <div className="sticky top-0 z-20 -mx-1 flex flex-wrap items-center gap-3 bg-[#f4f7fb]/95 px-1 py-2 backdrop-blur">
      <FilterChip to={withCurrentSearch(paths.adminPortalTimetableAll)}>Tất cả</FilterChip>
      {PRIMARY_GRADE_IDS.map((gradeId) => (
        <FilterChip key={gradeId} to={withCurrentSearch(paths.adminPortalTimetableGrade(gradeId))}>
          {primaryGradeTitle(gradeId)}
        </FilterChip>
      ))}
    </div>
  );
}

function FilterChip({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `inline-flex h-11 items-center rounded-xl px-5 text-[14px] font-extrabold transition ${
          isActive
            ? 'bg-[#1870FF] text-white shadow-[0_12px_22px_rgba(24,112,255,0.26)]'
            : 'border border-slate-300 bg-white text-slate-700 hover:border-[#1870FF] hover:bg-[rgba(24,112,255,0.04)]'
        }`
      }
    >
      {children}
    </NavLink>
  );
}
