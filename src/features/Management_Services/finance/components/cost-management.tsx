import { type FormEvent, useMemo, useState } from 'react';
import {
  BadgeDollarSign,
  CheckCircle2,
  Edit3,
  Plus,
  RefreshCw,
  Search,
  Tags,
  Trash2,
  X,
} from 'lucide-react';
import { useUsersQuery } from '@/features/Management_Services/admin';
import type { ResUserDTO } from '@/features/Management_Services/admin/types';
import {
  useCostTagsQuery,
  useCostsQuery,
  useCreateCost,
  useCreateCostTag,
  useDeleteCost,
  useDeleteCostTag,
  useUpdateCost,
  useUpdateCostTag,
} from '@/features/Management_Services/finance';
import type { Cost, CostPaidStatus, CostTag, ReqCreateCostDTO, ReqUpdateCostDTO } from '@/features/Management_Services/finance/types';
import { formatDateTime } from '@/utils/date';
import { parseApiError } from '@/utils/api-errors';

type CostTab = 'costs' | 'tags';
type CostModalState =
  | { mode: 'create' }
  | { mode: 'edit'; cost: Cost }
  | null;
type TagModalState =
  | { mode: 'create' }
  | { mode: 'edit'; tag: CostTag }
  | null;

type CostFormState = {
  name: string;
  paidByUserUuid: string;
  amount: string;
  paidStatus: CostPaidStatus;
  debt: string;
  confirmedByUserUuid: string;
  costTagId: string;
};

const paidStatusOptions: CostPaidStatus[] = ['SAVED', 'APPROVED', 'REJECTED'];

const statusLabels: Record<CostPaidStatus, string> = {
  SAVED: 'Đã lưu',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
};

const statusClasses: Record<CostPaidStatus, string> = {
  SAVED: 'bg-blue-50 text-blue-700',
  APPROVED: 'bg-emerald-50 text-emerald-700',
  REJECTED: 'bg-rose-50 text-rose-700',
};

const fieldClass =
  'h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-[14px] font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1870FF] focus:ring-4 focus:ring-[rgba(24,112,255,0.14)]';

function formatVND(value?: number) {
  if (value == null) return '-';
  return value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
}

function getUserUuid(user: ResUserDTO) {
  return user.id ?? '';
}

function formatAdminUserName(user?: ResUserDTO) {
  if (!user) return '-';
  const fullName = user.user_fullname ?? '-';
  const email = user.user_email ?? '-';
  const role = user.role?.name ?? '-';
  return `${fullName} (${email} - ${role})`;
}

function formatCostUserName(user?: Cost['paid_by_user']) {
  if (!user) return '-';
  return `${user.user_fullname ?? '-'} (${user.user_email ?? '-'} - ${user.role_name ?? '-'})`;
}

function buildInitialCostForm(cost?: Cost): CostFormState {
  return {
    name: cost?.cost_name ?? '',
    paidByUserUuid: cost?.paid_by_user?.user_uuid ?? '',
    amount: cost?.amount != null ? String(cost.amount) : '',
    paidStatus: cost?.cost_paid_status ?? 'SAVED',
    debt: cost?.debt != null ? String(cost.debt) : '',
    confirmedByUserUuid: cost?.confirmed_by_user?.user_uuid ?? '',
    costTagId: cost?.cost_tag?.id != null ? String(cost.cost_tag.id) : '',
  };
}

function toNumber(raw: string) {
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function StatCard({
  label,
  value,
  tone = 'blue',
}: {
  label: string;
  value: string;
  tone?: 'blue' | 'green' | 'rose';
}) {
  const toneClass = {
    blue: 'text-[#1870FF] bg-blue-50',
    green: 'text-emerald-700 bg-emerald-50',
    rose: 'text-rose-700 bg-rose-50',
  }[tone];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-[12px] font-black uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className={`mt-3 inline-flex rounded-xl px-3 py-1 text-[22px] font-black ${toneClass}`}>{value}</p>
    </div>
  );
}

export default function CostManagement() {
  const [activeTab, setActiveTab] = useState<CostTab>('costs');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | CostPaidStatus>('ALL');
  const [tagFilter, setTagFilter] = useState('ALL');
  const [paidByFilter, setPaidByFilter] = useState('ALL');
  const [costModal, setCostModal] = useState<CostModalState>(null);
  const [tagModal, setTagModal] = useState<TagModalState>(null);
  const [pageError, setPageError] = useState('');

  const costsQuery = useCostsQuery();
  const tagsQuery = useCostTagsQuery();
  const usersQuery = useUsersQuery({ page: 1, size: 2000 });
  const deleteCostMutation = useDeleteCost();
  const deleteTagMutation = useDeleteCostTag();

  const costs = costsQuery.data ?? [];
  const tags = tagsQuery.data ?? [];
  const users = usersQuery.data?.result ?? [];

  const filteredCosts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return costs.filter((cost) => {
      const matchesQuery =
        !normalizedQuery
        || [
          cost.cost_name,
          cost.paid_by_user?.user_fullname,
          cost.paid_by_user?.user_email,
          cost.cost_tag?.name,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery);
      const matchesStatus = statusFilter === 'ALL' || cost.cost_paid_status === statusFilter;
      const matchesTag = tagFilter === 'ALL' || String(cost.cost_tag?.id ?? '') === tagFilter;
      const matchesPaidBy = paidByFilter === 'ALL' || cost.paid_by_user?.user_uuid === paidByFilter;

      return matchesQuery && matchesStatus && matchesTag && matchesPaidBy;
    });
  }, [costs, paidByFilter, query, statusFilter, tagFilter]);

  const totalAmount = costs.reduce((sum, cost) => sum + (cost.amount ?? 0), 0);
  const totalDebt = costs.reduce((sum, cost) => sum + (cost.debt ?? 0), 0);
  const approvedCount = costs.filter((cost) => cost.cost_paid_status === 'APPROVED').length;

  async function handleDeleteCost(cost: Cost) {
    if (!cost.cost_uuid) return;
    const ok = window.confirm(`Xóa chi phí "${cost.cost_name ?? 'không tên'}"?`);
    if (!ok) return;

    try {
      setPageError('');
      await deleteCostMutation.mutateAsync(cost.cost_uuid);
    } catch (error) {
      setPageError(parseApiError(error).message);
    }
  }

  async function handleDeleteTag(tag: CostTag) {
    if (tag.id == null) return;
    const usedCount = costs.filter((cost) => cost.cost_tag?.id === tag.id).length;
    const warning = usedCount
      ? `Nhãn này đang được ${usedCount} khoản chi sử dụng. Vẫn xóa?`
      : `Xóa nhãn "${tag.name ?? 'không tên'}"?`;
    const ok = window.confirm(warning);
    if (!ok) return;

    try {
      setPageError('');
      await deleteTagMutation.mutateAsync(tag.id);
    } catch (error) {
      setPageError(parseApiError(error).message);
    }
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Tổng chi" value={formatVND(totalAmount)} />
        <StatCard label="Còn nợ" value={formatVND(totalDebt)} tone="rose" />
        <StatCard label="Đã duyệt" value={`${approvedCount}/${costs.length}`} tone="green" />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('costs')}
              className={`rounded-xl border px-4 py-2 text-[13px] font-extrabold transition ${
                activeTab === 'costs'
                  ? 'border-[#1870FF] bg-[#1870FF] text-white shadow-[0_10px_18px_rgba(24,112,255,0.18)]'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-[#1870FF] hover:text-[#1870FF]'
              }`}
            >
              Danh sách Chi phí
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('tags')}
              className={`rounded-xl border px-4 py-2 text-[13px] font-extrabold transition ${
                activeTab === 'tags'
                  ? 'border-[#1870FF] bg-[#1870FF] text-white shadow-[0_10px_18px_rgba(24,112,255,0.18)]'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-[#1870FF] hover:text-[#1870FF]'
              }`}
            >
              Quản lý nhãn
            </button>
          </div>

          {activeTab === 'costs' ? (
            <button
              type="button"
              onClick={() => setCostModal({ mode: 'create' })}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#1870FF] px-4 text-[14px] font-extrabold text-white shadow-[0_12px_22px_rgba(24,112,255,0.26)] transition hover:brightness-105"
            >
              <Plus size={18} />
              Thêm chi phí
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setTagModal({ mode: 'create' })}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#1870FF] px-4 text-[14px] font-extrabold text-white shadow-[0_12px_22px_rgba(24,112,255,0.26)] transition hover:brightness-105"
            >
              <Plus size={18} />
              Thêm nhãn
            </button>
          )}
        </div>

        {pageError ? (
          <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] font-bold text-rose-700">
            {pageError}
          </p>
        ) : null}

        {activeTab === 'costs' ? (
          <div className="mt-5 space-y-4">
            <div className="grid gap-3 lg:grid-cols-[1.3fr_0.8fr_0.8fr_1fr]">
              <label className="relative">
                <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className={`${fieldClass} pl-11`}
                  placeholder="Tìm tên chi phí, người chi..."
                />
              </label>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as 'ALL' | CostPaidStatus)}
                className={fieldClass}
              >
                <option value="ALL">Tất cả trạng thái</option>
                {paidStatusOptions.map((status) => (
                  <option key={status} value={status}>{statusLabels[status]}</option>
                ))}
              </select>
              <select
                value={tagFilter}
                onChange={(event) => setTagFilter(event.target.value)}
                className={fieldClass}
              >
                <option value="ALL">Tất cả nhãn</option>
                {tags.map((tag) => (
                  <option key={tag.id} value={tag.id ?? ''}>{tag.name}</option>
                ))}
              </select>
              <select
                value={paidByFilter}
                onChange={(event) => setPaidByFilter(event.target.value)}
                className={fieldClass}
              >
                <option value="ALL">Tất cả người chi</option>
                {users.map((user) => (
                  <option key={getUserUuid(user)} value={getUserUuid(user)}>
                    {formatAdminUserName(user)}
                  </option>
                ))}
              </select>
            </div>

            <CostTable
              costs={filteredCosts}
              isLoading={costsQuery.isLoading}
              onEdit={(cost) => setCostModal({ mode: 'edit', cost })}
              onDelete={handleDeleteCost}
            />
          </div>
        ) : (
          <TagTable
            tags={tags}
            costs={costs}
            isLoading={tagsQuery.isLoading}
            onEdit={(tag) => setTagModal({ mode: 'edit', tag })}
            onDelete={handleDeleteTag}
          />
        )}
      </section>

      {costModal ? (
        <CostFormModal
          modal={costModal}
          users={users}
          tags={tags}
          onClose={() => setCostModal(null)}
        />
      ) : null}

      {tagModal ? (
        <TagFormModal
          modal={tagModal}
          onClose={() => setTagModal(null)}
        />
      ) : null}
    </div>
  );
}

function CostTable({
  costs,
  isLoading,
  onEdit,
  onDelete,
}: {
  costs: Cost[];
  isLoading: boolean;
  onEdit: (cost: Cost) => void;
  onDelete: (cost: Cost) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left">
          <thead className="bg-slate-50 text-[12px] font-black uppercase tracking-[0.08em] text-slate-500">
            <tr>
              <th className="px-5 py-4">Tên</th>
              <th className="px-5 py-4">Người chi</th>
              <th className="px-5 py-4">Số tiền</th>
              <th className="px-5 py-4">Nợ</th>
              <th className="px-5 py-4">Trạng thái</th>
              <th className="px-5 py-4">Nhãn</th>
              <th className="px-5 py-4">Cập nhật</th>
              <th className="px-5 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {costs.map((cost) => {
              const status = cost.cost_paid_status ?? 'SAVED';
              return (
                <tr key={cost.cost_uuid} className="hover:bg-slate-50">
                  <td className="px-5 py-4 text-[14px] font-black text-slate-950">{cost.cost_name ?? '-'}</td>
                  <td className="px-5 py-4 text-[13px] font-semibold text-slate-600">{formatCostUserName(cost.paid_by_user)}</td>
                  <td className="px-5 py-4 text-[14px] font-black text-slate-900">{formatVND(cost.amount)}</td>
                  <td className="px-5 py-4 text-[14px] font-black text-rose-600">{formatVND(cost.debt)}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-[12px] font-black ${statusClasses[status]}`}>
                      {statusLabels[status]}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-[13px] font-bold text-slate-600">{cost.cost_tag?.name ?? '-'}</td>
                  <td className="px-5 py-4 text-[13px] font-semibold text-slate-500">{formatDateTime(cost.updated_at, '-')}</td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(cost)}
                        className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-[13px] font-extrabold text-slate-600 transition hover:border-[#1870FF] hover:text-[#1870FF]"
                      >
                        <Edit3 size={15} />
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(cost)}
                        className="inline-flex h-9 items-center gap-2 rounded-lg border border-rose-200 px-3 text-[13px] font-extrabold text-rose-600 transition hover:bg-rose-50"
                      >
                        <Trash2 size={15} />
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isLoading ? (
        <p className="px-5 py-6 text-center text-[14px] font-semibold text-slate-500">Đang tải chi phí...</p>
      ) : null}

      {!isLoading && !costs.length ? (
        <p className="px-5 py-6 text-center text-[14px] font-semibold text-slate-500">Chưa có khoản chi phù hợp.</p>
      ) : null}
    </div>
  );
}

function TagTable({
  tags,
  costs,
  isLoading,
  onEdit,
  onDelete,
}: {
  tags: CostTag[];
  costs: Cost[];
  isLoading: boolean;
  onEdit: (tag: CostTag) => void;
  onDelete: (tag: CostTag) => void;
}) {
  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
      <table className="w-full text-left">
        <thead className="bg-slate-50 text-[12px] font-black uppercase tracking-[0.08em] text-slate-500">
          <tr>
            <th className="px-5 py-4">Nhãn</th>
            <th className="px-5 py-4">Đang dùng</th>
            <th className="px-5 py-4">Cập nhật</th>
            <th className="px-5 py-4 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {tags.map((tag) => {
            const usedCount = costs.filter((cost) => cost.cost_tag?.id === tag.id).length;
            return (
              <tr key={tag.id} className="hover:bg-slate-50">
                <td className="px-5 py-4">
                  <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-[13px] font-black text-blue-700">
                    <Tags size={15} />
                    {tag.name ?? '-'}
                  </span>
                </td>
                <td className="px-5 py-4 text-[14px] font-black text-slate-900">{usedCount} khoản chi</td>
                <td className="px-5 py-4 text-[13px] font-semibold text-slate-500">{formatDateTime(tag.updatedAt, '-')}</td>
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(tag)}
                      className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-[13px] font-extrabold text-slate-600 transition hover:border-[#1870FF] hover:text-[#1870FF]"
                    >
                      <Edit3 size={15} />
                      Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(tag)}
                      className="inline-flex h-9 items-center gap-2 rounded-lg border border-rose-200 px-3 text-[13px] font-extrabold text-rose-600 transition hover:bg-rose-50"
                    >
                      <Trash2 size={15} />
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {isLoading ? (
        <p className="px-5 py-6 text-center text-[14px] font-semibold text-slate-500">Đang tải nhãn...</p>
      ) : null}

      {!isLoading && !tags.length ? (
        <p className="px-5 py-6 text-center text-[14px] font-semibold text-slate-500">Chưa có nhãn chi phí.</p>
      ) : null}
    </div>
  );
}

function CostFormModal({
  modal,
  users,
  tags,
  onClose,
}: {
  modal: Exclude<CostModalState, null>;
  users: ResUserDTO[];
  tags: CostTag[];
  onClose: () => void;
}) {
  const isCreate = modal.mode === 'create';
  const [form, setForm] = useState<CostFormState>(buildInitialCostForm(isCreate ? undefined : modal.cost));
  const [error, setError] = useState('');
  const createCostMutation = useCreateCost();
  const updateCostMutation = useUpdateCost();
  const isPending = createCostMutation.isPending || updateCostMutation.isPending;

  function updateField<K extends keyof CostFormState>(key: K, value: CostFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function buildPayload(): ReqCreateCostDTO | ReqUpdateCostDTO | null {
    const name = form.name.trim();
    const amount = toNumber(form.amount);
    const debt = toNumber(form.debt);
    const costTagId = form.costTagId ? Number(form.costTagId) : undefined;

    if (!name) {
      setError('Vui lòng nhập tên chi phí.');
      return null;
    }
    if (!form.paidByUserUuid) {
      setError('Vui lòng chọn người chi.');
      return null;
    }
    if (amount == null || amount <= 0) {
      setError('Số tiền phải lớn hơn 0.');
      return null;
    }
    if (debt == null || debt < 0 || debt > amount) {
      setError('Nợ còn lại phải từ 0 đến số tiền.');
      return null;
    }

    return {
      name,
      paidByUserUuid: form.paidByUserUuid,
      amount,
      paidStatus: form.paidStatus,
      debt,
      confirmedByUserUuid: form.confirmedByUserUuid || undefined,
      costTagId,
    };
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    const payload = buildPayload();
    if (!payload) return;

    try {
      if (isCreate) {
        await createCostMutation.mutateAsync(payload as ReqCreateCostDTO);
      } else if (modal.cost.cost_uuid) {
        await updateCostMutation.mutateAsync({
          costUuid: modal.cost.cost_uuid,
          body: payload,
        });
      }
      onClose();
    } catch (submitError) {
      setError(parseApiError(submitError).message);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4 py-6">
      <form onSubmit={handleSubmit} className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <ModalHeader title={isCreate ? 'Thêm chi phí' : 'Sửa chi phí'} onClose={onClose} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Tên chi phí" required>
            <input value={form.name} onChange={(event) => updateField('name', event.target.value)} className={fieldClass} />
          </Field>
          <Field label="Người chi" required>
            <select value={form.paidByUserUuid} onChange={(event) => updateField('paidByUserUuid', event.target.value)} className={fieldClass}>
              <option value="">Chọn người chi</option>
              {users.map((user) => (
                <option key={getUserUuid(user)} value={getUserUuid(user)}>{formatAdminUserName(user)}</option>
              ))}
            </select>
          </Field>
          <Field label="Số tiền" required>
            <input type="number" min={0} step="0.01" value={form.amount} onChange={(event) => updateField('amount', event.target.value)} className={fieldClass} />
          </Field>
          <Field label="Nợ còn lại" required>
            <input type="number" min={0} step="0.01" value={form.debt} onChange={(event) => updateField('debt', event.target.value)} className={fieldClass} />
          </Field>
          <Field label="Trạng thái" required>
            <select value={form.paidStatus} onChange={(event) => updateField('paidStatus', event.target.value as CostPaidStatus)} className={fieldClass}>
              {paidStatusOptions.map((status) => (
                <option key={status} value={status}>{statusLabels[status]}</option>
              ))}
            </select>
          </Field>
          <Field label="Nhãn">
            <select value={form.costTagId} onChange={(event) => updateField('costTagId', event.target.value)} className={fieldClass}>
              <option value="">Không gắn nhãn</option>
              {tags.map((tag) => (
                <option key={tag.id} value={tag.id ?? ''}>{tag.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Người xác nhận">
            <select value={form.confirmedByUserUuid} onChange={(event) => updateField('confirmedByUserUuid', event.target.value)} className={fieldClass}>
              <option value="">Chưa chọn</option>
              {users.map((user) => (
                <option key={getUserUuid(user)} value={getUserUuid(user)}>{formatAdminUserName(user)}</option>
              ))}
            </select>
          </Field>
        </div>

        {error ? <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-[13px] font-bold text-rose-700">{error}</p> : null}

        <ModalActions isPending={isPending} submitLabel={isCreate ? 'Tạo chi phí' : 'Lưu thay đổi'} onClose={onClose} />
      </form>
    </div>
  );
}

function TagFormModal({
  modal,
  onClose,
}: {
  modal: Exclude<TagModalState, null>;
  onClose: () => void;
}) {
  const isCreate = modal.mode === 'create';
  const [name, setName] = useState(isCreate ? '' : modal.tag.name ?? '');
  const [error, setError] = useState('');
  const createTagMutation = useCreateCostTag();
  const updateTagMutation = useUpdateCostTag();
  const isPending = createTagMutation.isPending || updateTagMutation.isPending;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Vui lòng nhập tên nhãn.');
      return;
    }

    try {
      setError('');
      if (isCreate) {
        await createTagMutation.mutateAsync({ name: trimmed });
      } else if (modal.tag.id != null) {
        await updateTagMutation.mutateAsync({ costTagId: modal.tag.id, body: { name: trimmed } });
      }
      onClose();
    } catch (submitError) {
      setError(parseApiError(submitError).message);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4 py-6">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <ModalHeader title={isCreate ? 'Thêm nhãn' : 'Sửa nhãn'} onClose={onClose} />
        <Field label="Tên nhãn" required>
          <input value={name} onChange={(event) => setName(event.target.value)} className={fieldClass} />
        </Field>
        {error ? <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-[13px] font-bold text-rose-700">{error}</p> : null}
        <ModalActions isPending={isPending} submitLabel={isCreate ? 'Tạo nhãn' : 'Lưu thay đổi'} onClose={onClose} />
      </form>
    </div>
  );
}

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-2">
      <span className="text-[13px] font-bold text-slate-600">
        {label}
        {required ? <span className="text-rose-500"> *</span> : null}
      </span>
      {children}
    </label>
  );
}

function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <p className="text-[12px] font-extrabold uppercase tracking-[0.16em] text-[#1870FF]">Chi phí</p>
        <h3 className="mt-1 text-[22px] font-extrabold leading-tight text-slate-950">{title}</h3>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100"
        aria-label="Đóng"
      >
        <X size={18} />
      </button>
    </div>
  );
}

function ModalActions({
  isPending,
  submitLabel,
  onClose,
}: {
  isPending: boolean;
  submitLabel: string;
  onClose: () => void;
}) {
  return (
    <div className="mt-6 flex items-center justify-end gap-3">
      <button
        type="button"
        onClick={onClose}
        className="h-11 rounded-xl border border-slate-300 px-4 text-[14px] font-extrabold text-slate-600 transition hover:bg-slate-50"
      >
        Hủy
      </button>
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#1870FF] px-5 text-[14px] font-extrabold text-white shadow-[0_12px_22px_rgba(24,112,255,0.26)] transition hover:bg-[#0f62e6] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? <RefreshCw size={17} className="animate-spin" /> : <CheckCircle2 size={17} />}
        {submitLabel}
      </button>
    </div>
  );
}
