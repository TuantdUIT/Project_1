import type { components } from '@/types/openapi_MS';
import { formatDate } from '@/utils/date';

type ResGradeDTO = components['schemas']['ResGradeDTO'];
type StudyWeek = components['schemas']['ResStudyWeekDTO'];

const fieldClass =
  'h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-[14px] font-medium text-slate-900 outline-none transition focus:border-[#1870FF] focus:ring-4 focus:ring-[rgba(24,112,255,0.14)]';

export type TemplateFilterState = {
  gradeId: string;
  schoolYear: string;
  weekUuid: string;
};

export const EMPTY_TEMPLATE_FILTER: TemplateFilterState = {
  gradeId: '',
  schoolYear: '',
  weekUuid: '',
};

/**
 * Ý nghĩa: Thanh bộ lọc Khối / Năm học / Tuần học dùng chung cho các bảng
 * template (Mẫu thời khóa biểu, Mẫu chấm công) trong trang Tổng hợp template.
 */
export function TemplateFilterBar({
  filter,
  onChange,
  grades,
  yearOptions,
  weeks,
}: {
  filter: TemplateFilterState;
  onChange: (next: TemplateFilterState) => void;
  grades: ResGradeDTO[];
  yearOptions: number[];
  weeks: StudyWeek[];
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:max-w-3xl">
      <label className="space-y-2">
        <span className="text-[13px] font-bold text-slate-600">Khối</span>
        <select
          value={filter.gradeId}
          onChange={(event) => onChange({ ...filter, gradeId: event.target.value })}
          className={fieldClass}
        >
          <option value="">Tất cả</option>
          {grades.map((grade) => (
            <option key={grade.id} value={grade.id ?? ''}>
              {grade.name}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-2">
        <span className="text-[13px] font-bold text-slate-600">Năm học</span>
        <select
          value={filter.schoolYear}
          onChange={(event) => onChange({ ...filter, schoolYear: event.target.value })}
          className={fieldClass}
        >
          <option value="">Tất cả</option>
          {yearOptions.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-2">
        <span className="text-[13px] font-bold text-slate-600">Tuần học</span>
        <select
          value={filter.weekUuid}
          onChange={(event) => onChange({ ...filter, weekUuid: event.target.value })}
          className={fieldClass}
        >
          <option value="">Tất cả</option>
          {weeks.map((week) => (
            <option key={week.week_uuid} value={week.week_uuid ?? ''}>
              Tuần {week.week_number} · {week.school_year} ({formatDate(week.week_start_date)} –{' '}
              {formatDate(week.week_end_date)})
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

/**
 * Template khớp tuần học khi nó đã có hiệu lực trong tuần đó
 * (apply_from <= ngày kết thúc tuần). So sánh chuỗi ISO yyyy-MM-dd an toàn.
 */
export function appliesWithinWeek(applyFrom: string | undefined, week: StudyWeek | undefined) {
  if (!week) return true;
  if (!applyFrom || !week.week_end_date) return false;
  return applyFrom <= week.week_end_date;
}
