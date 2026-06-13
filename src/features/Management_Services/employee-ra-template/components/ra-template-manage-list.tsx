import { useEffect, useMemo, useState } from 'react';
import { UserRoundCheck } from 'lucide-react';
import { useEmployeeRATemplatesQuery } from '@/features/Management_Services/employee-ra-template/api/employee-ra-templates';
import type { EmployeeRATemplate } from '@/features/Management_Services/employee-ra-template/types';
import { useTimetableTemplatesQuery } from '@/features/Management_Services/timetable-template/api/templates';
import type { TimetableTemplate } from '@/features/Management_Services/timetable-template/types';
import { useGradesQuery } from '@/features/Management_Services/curriculum';
import { useStudyWeeksQuery } from '@/features/Management_Services/study-week';
import {
  EMPTY_TEMPLATE_FILTER,
  TemplateFilterBar,
  appliesWithinWeek,
  type TemplateFilterState,
} from '@/features/Management_Services/template-hub/components/template-filter-bar';
import { formatDate } from '@/utils/date';
import RaTemplateDetailModal from './ra-template-detail-modal';

const cardClass =
  'rounded-2xl border border-slate-200/80 bg-white shadow-[0_16px_36px_rgba(15,23,42,0.24)]';

/**
 * Ý nghĩa: Bảng quản lý Mẫu chấm công (Employee RA Template) trong trang
 * Tổng hợp template. Khối / Năm học / Tuần học của mỗi mẫu được suy ra từ
 * mẫu thời khóa biểu liên kết. Click một hàng để mở dialog chi tiết.
 */
export default function RaTemplateManageList() {
  const templatesQuery = useEmployeeRATemplatesQuery();
  const timetableTemplatesQuery = useTimetableTemplatesQuery();
  const gradesQuery = useGradesQuery();
  const weeksQuery = useStudyWeeksQuery();

  const [filter, setFilter] = useState<TemplateFilterState>(EMPTY_TEMPLATE_FILTER);
  const [detailTarget, setDetailTarget] = useState<EmployeeRATemplate | null>(null);

  const templates = templatesQuery.data ?? [];
  const timetableTemplates = timetableTemplatesQuery.data ?? [];
  const grades = gradesQuery.data?.grades ?? [];
  const weeks = useMemo(
    () =>
      [...(weeksQuery.data ?? [])].sort(
        (a, b) =>
          (b.school_year ?? 0) - (a.school_year ?? 0)
          || (b.week_number ?? 0) - (a.week_number ?? 0),
      ),
    [weeksQuery.data],
  );

  const timetableByUuid = useMemo(() => {
    const map = new Map<string, TimetableTemplate>();
    for (const timetableTemplate of timetableTemplates) {
      if (timetableTemplate.timetable_template_uuid) {
        map.set(timetableTemplate.timetable_template_uuid, timetableTemplate);
      }
    }
    return map;
  }, [timetableTemplates]);

  const yearOptions = useMemo(() => {
    const set = new Set<number>();
    for (const template of templates) {
      const linked = template.timetable_template_uuid
        ? timetableByUuid.get(template.timetable_template_uuid)
        : undefined;
      if (linked?.school_year != null) set.add(linked.school_year);
    }
    return Array.from(set).sort((a, b) => b - a);
  }, [templates, timetableByUuid]);

  const selectedWeek = weeks.find((week) => week.week_uuid === filter.weekUuid);

  const filtered = templates.filter((template) => {
    const linked = template.timetable_template_uuid
      ? timetableByUuid.get(template.timetable_template_uuid)
      : undefined;

    if (filter.gradeId && String(linked?.grade?.id ?? '') !== filter.gradeId) return false;
    if (filter.schoolYear && String(linked?.school_year ?? '') !== filter.schoolYear) return false;
    if (filter.weekUuid && !appliesWithinWeek(linked?.apply_from, selectedWeek)) return false;
    return true;
  });

  useEffect(() => {
    if (!detailTarget) return;
    const fresh = templates.find(
      (t) => t.employee_ra_template_uuid === detailTarget.employee_ra_template_uuid,
    );
    if (fresh && fresh !== detailTarget) setDetailTarget(fresh);
  }, [templates, detailTarget]);

  return (
    <>
      <section className={cardClass}>
        <header className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(24,112,255,0.1)] text-[#1870FF]">
              <UserRoundCheck size={19} strokeWidth={2.6} />
            </span>
            <div>
              <h2 className="text-[18px] font-extrabold leading-tight text-slate-950">
                Mẫu chấm công
              </h2>
              <p className="mt-1 text-[13px] font-semibold text-slate-500">
                Click vào một hàng để xem và chỉnh sửa
              </p>
            </div>
          </div>
        </header>

        <div className="border-t border-slate-100 p-5 sm:p-6">
          <TemplateFilterBar
            filter={filter}
            onChange={setFilter}
            grades={grades}
            yearOptions={yearOptions}
            weeks={weeks}
          />
        </div>

        <div className="border-t border-slate-100 overflow-x-auto">
          <table className="w-full min-w-[920px] text-left">
            <thead className="bg-slate-50/80 text-[12px] font-extrabold uppercase text-slate-500">
              <tr>
                <th className="px-6 py-4">Tên</th>
                <th className="px-6 py-4">Mẫu TKB liên kết</th>
                <th className="px-6 py-4">Khối</th>
                <th className="px-6 py-4">Năm học</th>
                <th className="px-6 py-4">Số phân công</th>
                <th className="px-6 py-4">Ngày tạo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((template) => {
                const linked = template.timetable_template_uuid
                  ? timetableByUuid.get(template.timetable_template_uuid)
                  : undefined;

                return (
                  <tr
                    key={template.employee_ra_template_uuid}
                    onClick={() => setDetailTarget(template)}
                    className="h-[68px] cursor-pointer transition hover:bg-slate-50/70"
                  >
                    <td className="px-6 py-4">
                      <p className="text-[15px] font-extrabold text-slate-950">
                        {template.employee_ra_template_name ?? '—'}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-[14px] font-medium text-slate-900">
                      {template.timetable_template_name ?? linked?.timetable_template_name ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-[14px] font-extrabold text-slate-900">
                      {linked?.grade?.name ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-[14px] font-medium text-slate-900">
                      {linked?.school_year ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-[14px] font-medium text-slate-900">
                      {template.items?.length ?? 0}
                    </td>
                    <td className="px-6 py-4 text-[14px] font-medium text-slate-900">
                      {formatDate(template.created_at)}
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[14px] font-semibold text-slate-500">
                    {templatesQuery.isLoading
                      ? 'Đang tải...'
                      : 'Chưa có mẫu chấm công khớp bộ lọc.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {detailTarget ? (
        <RaTemplateDetailModal
          template={detailTarget}
          timetableTemplates={timetableTemplates}
          onClose={() => setDetailTarget(null)}
        />
      ) : null}
    </>
  );
}
