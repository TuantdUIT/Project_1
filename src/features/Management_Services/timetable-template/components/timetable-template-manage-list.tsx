import { useEffect, useMemo, useState } from 'react';
import { CalendarRange, Plus } from 'lucide-react';
import { useTimetableTemplatesQuery } from '@/features/Management_Services/timetable-template/api/templates';
import TimetableTemplateCreateModal from './timetable-template-create-modal';
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
import TimetableTemplateDetailModal from './timetable-template-detail-modal';

const cardClass =
  'rounded-2xl border border-slate-200/80 bg-white shadow-[0_16px_36px_rgba(15,23,42,0.24)]';

/**
 * Ý nghĩa: Bảng quản lý Mẫu thời khóa biểu trong trang Tổng hợp template.
 * Click vào một hàng sẽ mở dialog chi tiết để xem / Chỉnh sửa / Xóa / Áp dụng.
 */
export default function TimetableTemplateManageList() {
  const templatesQuery = useTimetableTemplatesQuery();
  const gradesQuery = useGradesQuery();
  const weeksQuery = useStudyWeeksQuery();

  const [filter, setFilter] = useState<TemplateFilterState>(EMPTY_TEMPLATE_FILTER);
  const [detailTarget, setDetailTarget] = useState<TimetableTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const templates = templatesQuery.data ?? [];
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

  const yearOptions = useMemo(() => {
    const set = new Set<number>();
    for (const template of templates) {
      if (template.school_year != null) set.add(template.school_year);
    }
    return Array.from(set).sort((a, b) => b - a);
  }, [templates]);

  const selectedWeek = weeks.find((week) => week.week_uuid === filter.weekUuid);

  const filtered = templates.filter((template) => {
    if (filter.gradeId && String(template.grade?.id ?? '') !== filter.gradeId) return false;
    if (filter.schoolYear && String(template.school_year ?? '') !== filter.schoolYear) return false;
    if (filter.weekUuid && !appliesWithinWeek(template.apply_from, selectedWeek)) return false;
    return true;
  });

  // Giữ detailTarget đồng bộ với cache sau mỗi lần refetch (vd: sau khi save đổi giờ).
  // Nếu không, modal nhận stale prop → buildChanges() tính oldMinutes sai
  // → matchesOldSlot thất bại → RA sync bị bỏ qua khi revert giờ.
  useEffect(() => {
    if (!detailTarget) return;
    const fresh = templates.find(
      (t) => t.timetable_template_uuid === detailTarget.timetable_template_uuid,
    );
    if (fresh && fresh !== detailTarget) setDetailTarget(fresh);
  }, [templates, detailTarget]);

  return (
    <>
      <section className={cardClass}>
        <header className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(24,112,255,0.1)] text-[#1870FF]">
              <CalendarRange size={19} strokeWidth={2.6} />
            </span>
            <div>
              <h2 className="text-[18px] font-extrabold leading-tight text-slate-950">
                Mẫu thời khóa biểu
              </h2>
              <p className="mt-1 text-[13px] font-semibold text-slate-500">
                Click vào một hàng để xem và chỉnh sửa
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="inline-flex h-10 items-center gap-2 self-start rounded-xl bg-[#1870FF] px-4 text-[13px] font-extrabold text-white shadow-[0_10px_22px_rgba(24,112,255,0.26)] transition hover:bg-[#0f62e6]"
          >
            <Plus size={15} />
            Tạo template
          </button>
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
                <th className="px-6 py-4">Khối</th>
                <th className="px-6 py-4">Năm học</th>
                <th className="px-6 py-4">Số tiết / tuần</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4">Ngày tạo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((template) => (
                <tr
                  key={template.timetable_template_uuid}
                  onClick={() => setDetailTarget(template)}
                  className="h-[68px] cursor-pointer transition hover:bg-slate-50/70"
                >
                  <td className="px-6 py-4">
                    <p className="text-[15px] font-extrabold text-slate-950">
                      {template.timetable_template_name ?? '—'}
                    </p>
                    <p className="mt-0.5 text-[12px] font-medium text-slate-500">
                      Áp dụng từ {formatDate(template.apply_from)}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-[14px] font-extrabold text-slate-900">
                    {template.grade?.name ?? '—'}
                  </td>
                  <td className="px-6 py-4 text-[14px] font-medium text-slate-900">
                    {template.school_year ?? '—'}
                  </td>
                  <td className="px-6 py-4 text-[14px] font-medium text-slate-900">
                    {template.items?.length ?? 0}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-[12px] font-extrabold ${
                        template.active === false
                          ? 'bg-slate-100 text-slate-500'
                          : 'bg-emerald-50 text-emerald-600'
                      }`}
                    >
                      {template.active === false ? 'Ngừng áp dụng' : 'Đang hoạt động'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[14px] font-medium text-slate-900">
                    {formatDate(template.created_at)}
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[14px] font-semibold text-slate-500">
                    {templatesQuery.isLoading
                      ? 'Đang tải...'
                      : 'Chưa có mẫu thời khóa biểu khớp bộ lọc.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {detailTarget ? (
        <TimetableTemplateDetailModal
          template={detailTarget}
          grades={grades}
          onClose={() => setDetailTarget(null)}
        />
      ) : null}

      {isCreating ? <TimetableTemplateCreateModal onClose={() => setIsCreating(false)} /> : null}
    </>
  );
}
