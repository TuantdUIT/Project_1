import { useMemo, useState } from 'react';
import { Layers, Plus } from 'lucide-react';
import { usePeriodSettingsQuery } from '@/features/Management_Services/period-setting';
import type { ResPeriodSettingDTO } from '@/features/Management_Services/period-setting/types';
import { useGradesQuery } from '@/features/Management_Services/curriculum';
import { formatDate } from '@/utils/date';
import PeriodSettingFormModal from './period-setting-form-modal';

const fieldClass =
  'h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-[14px] font-medium text-slate-900 outline-none transition focus:border-[#1870FF] focus:ring-4 focus:ring-[rgba(24,112,255,0.14)]';

const cardClass =
  'rounded-2xl border border-slate-200/80 bg-white shadow-[0_16px_36px_rgba(15,23,42,0.24)]';

type EditingState =
  | { kind: 'create' }
  | { kind: 'update'; setting: ResPeriodSettingDTO }
  | null;

export default function PeriodSettingList() {
  const settingsQuery = usePeriodSettingsQuery();
  const gradesQuery = useGradesQuery();

  const [editing, setEditing] = useState<EditingState>(null);
  const [gradeFilter, setGradeFilter] = useState<string>('');
  const [yearFilter, setYearFilter] = useState<string>('');

  const settings = settingsQuery.data ?? [];

  const yearOptions = useMemo(() => {
    const set = new Set<number>();
    for (const setting of settings) {
      if (setting.school_year != null) set.add(setting.school_year);
    }
    return Array.from(set).sort((a, b) => b - a);
  }, [settings]);

  const filtered = settings.filter((setting) => {
    if (gradeFilter && String(setting.grade?.id ?? '') !== gradeFilter) return false;
    if (yearFilter && String(setting.school_year ?? '') !== yearFilter) return false;
    return true;
  });

  return (
    <>
      <section className={cardClass}>
        <header className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(24,112,255,0.1)] text-[#1870FF]">
              <Layers size={19} strokeWidth={2.6} />
            </span>
            <h2 className="text-[18px] font-extrabold leading-tight text-slate-950">
              Period Settings (template khóa học)
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setEditing({ kind: 'create' })}
            className="inline-flex h-10 items-center gap-2 self-start rounded-xl bg-[#1870FF] px-4 text-[13px] font-extrabold text-white shadow-[0_10px_22px_rgba(24,112,255,0.26)] transition hover:bg-[#0f62e6]"
          >
            <Plus size={15} />
            Tạo template
          </button>
        </header>

        <div className="border-t border-slate-100 p-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:max-w-2xl">
            <label className="space-y-2">
              <span className="text-[13px] font-bold text-slate-600">Khối</span>
              <select
                value={gradeFilter}
                onChange={(event) => setGradeFilter(event.target.value)}
                className={fieldClass}
              >
                <option value="">Tất cả</option>
                {(gradesQuery.data?.grades ?? []).map((grade) => (
                  <option key={grade.id} value={grade.id ?? ''}>
                    {grade.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-[13px] font-bold text-slate-600">Năm học</span>
              <select
                value={yearFilter}
                onChange={(event) => setYearFilter(event.target.value)}
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
          </div>
        </div>

        <div className="border-t border-slate-100 overflow-x-auto">
          <table className="w-full min-w-[920px] text-left">
            <thead className="bg-slate-50/80 text-[12px] font-extrabold uppercase text-slate-500">
              <tr>
                <th className="px-6 py-4">Tên</th>
                <th className="px-6 py-4">Khối</th>
                <th className="px-6 py-4">Năm</th>
                <th className="px-6 py-4">Số tuần</th>
                <th className="px-6 py-4">Học phí</th>
                <th className="px-6 py-4">Lesson types</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((setting) => (
                <tr
                  key={setting.uuid_period_setting}
                  onClick={() => setEditing({ kind: 'update', setting })}
                  className="h-[68px] cursor-pointer transition hover:bg-slate-50/70"
                >
                  <td className="px-6 py-4">
                    <p className="text-[15px] font-extrabold text-slate-950">
                      {setting.period_setting_name ?? '—'}
                    </p>
                    <p className="mt-0.5 text-[12px] font-medium text-slate-500">
                      Áp dụng từ {formatDate(setting.apply_from)}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-[14px] font-extrabold text-slate-900">
                    {setting.grade?.name ?? '—'}
                  </td>
                  <td className="px-6 py-4 text-[14px] font-medium text-slate-900">
                    {setting.school_year ?? '—'}
                  </td>
                  <td className="px-6 py-4 text-[14px] font-medium text-slate-900">
                    {setting.number_of_week ?? '—'}
                  </td>
                  <td className="px-6 py-4 text-[14px] font-extrabold text-slate-900">
                    {formatVND(setting.tuition)}
                  </td>
                  <td className="px-6 py-4 text-[14px] font-medium text-slate-900">
                    {setting.lesson_type_configs?.length ?? 0}
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[14px] font-semibold text-slate-500">
                    {settingsQuery.isLoading
                      ? 'Đang tải...'
                      : 'Chưa có template khớp bộ lọc.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {editing?.kind === 'create' ? (
        <PeriodSettingFormModal mode="create" onClose={() => setEditing(null)} />
      ) : null}
      {editing?.kind === 'update' ? (
        <PeriodSettingFormModal
          mode="update"
          setting={editing.setting}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </>
  );
}

function formatVND(value: number | undefined | null) {
  if (value == null) return '—';
  return value.toLocaleString('vi-VN') + 'đ';
}

