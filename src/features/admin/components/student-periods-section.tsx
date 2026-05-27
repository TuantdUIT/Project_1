import { useState } from 'react';
import { CalendarRange, ClipboardList, Pencil, Plus, Trash2, Wallet } from 'lucide-react';
import { useDeletePeriod, usePeriodsByUserQuery } from '@/features/admin';
import type { ResPeriodDTO, TuitionStatus } from '@/features/admin/types';
import { formatDate } from '@/utils/date';
import PeriodFormModal from './period-form-modal';

type EditingState =
  | { kind: 'create' }
  | { kind: 'update'; period: ResPeriodDTO }
  | null;

export default function StudentPeriodsSection({ userUuid }: { userUuid: string }) {
  const periodsQuery = usePeriodsByUserQuery(userUuid);
  const deletePeriod = useDeletePeriod();
  const [editing, setEditing] = useState<EditingState>(null);
  const [pendingDeleteUuid, setPendingDeleteUuid] = useState<string | null>(null);

  const periods = periodsQuery.data ?? [];
  const totalTuition = periods.reduce((sum, p) => sum + (p.tuition ?? 0), 0);
  const totalDebt = periods.reduce((sum, p) => sum + (p.debt ?? 0), 0);
  const unpaidCount = periods.filter((p) => p.tuition_status !== 'PAID').length;

  async function handleConfirmDelete(period: ResPeriodDTO) {
    if (!period.period_uuid) return;
    try {
      await deletePeriod.mutateAsync({ periodUuid: period.period_uuid, userUuid });
      setPendingDeleteUuid(null);
    } catch {
      setPendingDeleteUuid(null);
    }
  }

  return (
    <>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_16px_36px_rgba(15,23,42,0.12)] sm:p-6">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-[22px] font-black text-slate-950">Học phí / Period</h3>
          <button
            type="button"
            onClick={() => setEditing({ kind: 'create' })}
            className="inline-flex h-12 w-fit items-center gap-2 rounded-xl bg-[#1870FF] px-5 text-[15px] font-extrabold text-white shadow-[0_12px_24px_rgba(24,112,255,0.28)] transition hover:bg-[#0f62e6]"
          >
            <Plus size={19} />
            Tạo period
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <SummaryCard
            icon={Wallet}
            label="Tổng học phí"
            value={formatVND(totalTuition)}
            tone="slate"
          />
          <SummaryCard
            icon={CalendarRange}
            label={unpaidCount > 0 ? `Công nợ · ${unpaidCount} chưa PAID` : 'Công nợ'}
            value={formatVND(totalDebt)}
            tone={totalDebt > 0 ? 'rose' : 'emerald'}
          />
          <SummaryCard
            icon={ClipboardList}
            label="Số period"
            value={String(periods.length)}
            tone="slate"
          />
        </div>

        <div className="mt-6 space-y-4">
          {periodsQuery.isLoading ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-[14px] font-semibold text-slate-500">
              Đang tải period...
            </div>
          ) : periodsQuery.isError ? (
            <div className="rounded-2xl border border-dashed border-rose-300 bg-rose-50 px-4 py-8 text-center text-[14px] font-semibold text-rose-600">
              Không tải được danh sách period.
            </div>
          ) : periods.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-[14px] font-semibold text-slate-500">
              Học sinh chưa có period nào. Bấm "Tạo period" để bắt đầu.
            </div>
          ) : (
            periods.map((period) => (
              <PeriodCard
                key={period.period_uuid}
                period={period}
                onEdit={() => setEditing({ kind: 'update', period })}
                onAskDelete={() => setPendingDeleteUuid(period.period_uuid ?? null)}
              />
            ))
          )}
        </div>
      </div>

      {editing?.kind === 'create' ? (
        <PeriodFormModal
          mode="create"
          userUuid={userUuid}
          onClose={() => setEditing(null)}
        />
      ) : null}

      {editing?.kind === 'update' ? (
        <PeriodFormModal
          mode="update"
          userUuid={userUuid}
          period={editing.period}
          onClose={() => setEditing(null)}
        />
      ) : null}

      {pendingDeleteUuid ? (
        <DeleteConfirmModal
          period={periods.find((p) => p.period_uuid === pendingDeleteUuid)}
          isDeleting={deletePeriod.isPending}
          onCancel={() => setPendingDeleteUuid(null)}
          onConfirm={(period) => handleConfirmDelete(period)}
        />
      ) : null}
    </>
  );
}

function PeriodCard({
  period,
  onEdit,
  onAskDelete,
}: {
  period: ResPeriodDTO;
  onEdit: () => void;
  onAskDelete: () => void;
}) {
  const title =
    period.period_setting?.period_setting_name
    ?? `Nhập tay · ${period.grade?.name ?? '—'} · ${period.number_of_week ?? '?'}W`;
  const weeksDone = (period.number_of_week ?? 0) - (period.week_left ?? 0);
  const progressPct =
    period.number_of_week && period.number_of_week > 0
      ? Math.max(0, Math.min(100, Math.round((weeksDone / period.number_of_week) * 100)))
      : 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[20px] font-black text-slate-950">{title}</p>
          <p className="mt-2 text-[14px] font-semibold text-slate-500">
            {formatDate(period.enroll_date)} → {formatDate(period.estimate_expire_date)}
            {period.is_editted_from_setting ? (
              <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-amber-700">
                Đã chỉnh từ template
              </span>
            ) : null}
          </p>
        </div>
        <TuitionBadge status={period.tuition_status} />
      </div>

      <div className="mt-7 grid max-w-2xl grid-cols-1 gap-5 text-[13px] sm:grid-cols-2">
        <div>
          <p className="text-[12px] font-black uppercase tracking-[0.16em] text-slate-400">Học phí</p>
          <p className="mt-2 text-[18px] font-black text-slate-950">{formatVND(period.tuition)}</p>
        </div>
        <div>
          <p className="text-[12px] font-black uppercase tracking-[0.16em] text-slate-400">Công nợ</p>
          <p
            className={`mt-2 text-[18px] font-black ${
              (period.debt ?? 0) > 0 ? 'text-rose-600' : 'text-emerald-600'
            }`}
          >
            {formatVND(period.debt)}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between text-[14px] font-semibold text-slate-500">
          <span>
            Tuần {weeksDone}/{period.number_of_week ?? '?'} · còn {period.week_left ?? '?'} tuần
          </span>
          <span>{progressPct}%</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-[#1870FF]" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {period.note ? (
        <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-[12px] font-medium text-slate-600">
          {period.note}
        </p>
      ) : null}

      <div className="mt-6 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 text-[14px] font-extrabold text-slate-700 transition hover:border-[#1870FF] hover:text-[#1870FF]"
        >
          <Pencil size={16} />
          Sửa
        </button>
        <button
          type="button"
          onClick={onAskDelete}
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 text-[14px] font-extrabold text-rose-600 transition hover:bg-rose-100"
        >
          <Trash2 size={16} />
          Xóa
        </button>
      </div>
    </div>
  );
}

function TuitionBadge({ status }: { status?: TuitionStatus }) {
  const styles =
    status === 'PAID'
      ? { bg: 'bg-emerald-50', text: 'text-emerald-700' }
      : status === 'PARTIAL'
        ? { bg: 'bg-amber-50', text: 'text-amber-700' }
        : { bg: 'bg-rose-50', text: 'text-rose-700' };

  return (
    <span
      className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-extrabold uppercase tracking-[0.08em] ${styles.bg} ${styles.text}`}
    >
      {status ?? 'UNPAID'}
    </span>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  tone: 'slate' | 'rose' | 'emerald';
}) {
  const toneClass =
    tone === 'rose'
      ? 'text-rose-700'
      : tone === 'emerald'
        ? 'text-emerald-700'
        : 'text-slate-900';
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5">
      <div className="flex items-center gap-3 text-[13px] font-black uppercase tracking-[0.14em] text-slate-500">
        <Icon size={19} />
        <span className="truncate">{label}</span>
      </div>
      <p className={`mt-4 text-[26px] font-black ${toneClass}`}>{value}</p>
    </div>
  );
}

function DeleteConfirmModal({
  period,
  isDeleting,
  onCancel,
  onConfirm,
}: {
  period?: ResPeriodDTO;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: (period: ResPeriodDTO) => void;
}) {
  if (!period) return null;
  const name =
    period.period_setting?.period_setting_name
    ?? `Period ${period.number_of_week ?? '?'}W`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h3 className="text-[18px] font-extrabold text-slate-950">Xác nhận xóa period</h3>
        <p className="mt-2 text-[14px] font-medium text-slate-600">
          Bạn sắp xóa period <strong>{name}</strong>. Công nợ học sinh sẽ được tính lại tự động.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="h-11 rounded-xl border border-slate-300 px-4 text-[14px] font-extrabold text-slate-600 transition hover:bg-slate-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={() => onConfirm(period)}
            disabled={isDeleting}
            className="h-11 rounded-xl bg-rose-600 px-4 text-[14px] font-extrabold text-white shadow-[0_10px_22px_rgba(225,29,72,0.26)] transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? 'Đang xóa...' : 'Xóa period'}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatVND(value: number | undefined | null) {
  if (value == null) return '—';
  return value.toLocaleString('vi-VN') + 'đ';
}
