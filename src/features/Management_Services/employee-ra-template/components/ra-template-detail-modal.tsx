import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Shield, UserRoundCheck, Users, X } from 'lucide-react';
import {
  useDeleteEmployeeRATemplate,
  useUpdateEmployeeRATemplate,
} from '@/features/Management_Services/employee-ra-template/api/employee-ra-templates';
import type {
  EmployeeRATemplate,
  ReqEmployeeRATemplateItem,
  ReqUpdateEmployeeRATemplate,
} from '@/features/Management_Services/employee-ra-template/types';
import { makeSlotKey } from '@/features/Management_Services/employee-ra-template/lib/slot-key';
import { findPersonnelConflicts } from '@/features/Management_Services/employee-ra-template/lib/availability';
import { useNonStudentUsersQuery } from '@/features/Management_Services/admin/api/users';
import type { ResUserDTO } from '@/features/Management_Services/admin/types';
import { useLessonTypesQuery } from '@/features/Management_Services/curriculum';
import type { DayOfWeek, TimetableTemplate } from '@/features/Management_Services/timetable-template/types';
import { DAY_OF_WEEK_LABEL } from '@/features/Management_Services/timetable-template/lib/time';
import { buildDurationByLessonType } from '@/features/Management_Services/timetable-template/lib/slot-overlap';
import {
  ConfirmDeleteBanner,
  DetailGrid,
  DetailModalFooter,
  DetailRow,
  DetailSection,
  EditableRow,
  EditableSelectRow,
} from '@/components/ui/detail-modal-kit';
import { formatDateTime } from '@/utils/date';

type RaTemplateDetailModalProps = {
  template: EmployeeRATemplate;
  timetableTemplates: TimetableTemplate[];
  onClose: () => void;
};

/** Slot lấy từ timetable template liên kết — nguồn chuẩn để gán nhân sự. */
type Slot = {
  key: string;
  lessonTypeId: string;
  lessonTypeName: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
};

/** Chuẩn hóa map nhân sự-theo-slot về chuỗi ổn định để so dirty. */
function normalizePersonnel(map: Record<string, string[]>) {
  return Object.entries(map)
    .map(([key, users]) => [key, [...users].sort()] as const)
    .filter(([, users]) => users.length > 0)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, users]) => `${key}:${users.join(',')}`)
    .join('|');
}

export default function RaTemplateDetailModal({
  template,
  timetableTemplates,
  onClose,
}: RaTemplateDetailModalProps) {
  const updateTemplate = useUpdateEmployeeRATemplate();
  const deleteTemplate = useDeleteEmployeeRATemplate();
  const usersQuery = useNonStudentUsersQuery();
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');
  // Cảnh báo double-booking: khi có xung đột, Lưu sẽ yêu cầu xác nhận một lần.
  const [showConflictConfirm, setShowConflictConfirm] = useState(false);
  const [conflictAcknowledged, setConflictAcknowledged] = useState(false);

  const originals = useMemo(
    () => ({
      name: template.employee_ra_template_name ?? '',
      timetableTemplateId: template.timetable_template_uuid ?? '',
    }),
    [template],
  );

  const [form, setForm] = useState(originals);

  // Slot lấy từ timetable template ĐANG liên kết trong form (phản ứng khi đổi link).
  const linkedTimetable = useMemo(
    () => timetableTemplates.find((tt) => tt.timetable_template_uuid === form.timetableTemplateId),
    [timetableTemplates, form.timetableTemplateId],
  );

  const slots = useMemo<Slot[]>(() => {
    const seen = new Set<string>();
    const result: Slot[] = [];
    for (const item of linkedTimetable?.items ?? []) {
      const key = makeSlotKey(item);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      result.push({
        key,
        lessonTypeId: item.lesson_type_uuid ?? '',
        lessonTypeName: item.lesson_type_name ?? '—',
        dayOfWeek: (item.day_of_week ?? 'MONDAY') as DayOfWeek,
        startTime: item.start_time ?? '',
      });
    }
    return result;
  }, [linkedTimetable]);

  // Phân công ban đầu: group item RA hiện tại theo slot key.
  const initialPersonnel = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const item of template.items ?? []) {
      const key = makeSlotKey(item);
      if (!key || !item.user_uuid) continue;
      (map[key] ??= []).push(item.user_uuid);
    }
    return map;
  }, [template.items]);

  const [personnelBySlot, setPersonnelBySlot] = useState<Record<string, string[]>>(initialPersonnel);

  useEffect(() => {
    setForm(originals);
    setPersonnelBySlot(initialPersonnel);
    setError('');
  }, [originals, initialPersonnel]);

  const metadataDirty = (Object.keys(originals) as Array<keyof typeof originals>).some(
    (key) => form[key] !== originals[key],
  );
  const personnelDirty = normalizePersonnel(personnelBySlot) !== normalizePersonnel(initialPersonnel);
  const isDirty = metadataDirty || personnelDirty;
  const isBusy = updateTemplate.isPending || deleteTemplate.isPending;
  const items = template.items ?? [];

  const users = usersQuery.data ?? [];
  const userById = useMemo(() => {
    const map = new Map<string, ResUserDTO>();
    for (const user of users) {
      if (user.id) map.set(user.id, user);
    }
    return map;
  }, [users]);

  const editingTotal = useMemo(
    () => Object.values(personnelBySlot).reduce((sum, list) => sum + list.length, 0),
    [personnelBySlot],
  );

  // B — phát hiện nhân sự bị trùng lịch (cùng người, 2 slot cùng ngày giao giờ).
  const lessonTypesQuery = useLessonTypesQuery();
  const durationByLessonType = useMemo(
    () => buildDurationByLessonType(lessonTypesQuery.data ?? []),
    [lessonTypesQuery.data],
  );
  const conflicts = useMemo(
    () => findPersonnelConflicts(personnelBySlot, slots, durationByLessonType),
    [personnelBySlot, slots, durationByLessonType],
  );

  // Đổi phân công → hủy xác nhận cũ (phải xác nhận lại nếu vẫn còn xung đột).
  useEffect(() => {
    setConflictAcknowledged(false);
    setShowConflictConfirm(false);
  }, [personnelBySlot]);

  function updateField<K extends keyof typeof form>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function addUserToSlot(slotKey: string, userUuid: string) {
    if (!userUuid) return;
    setPersonnelBySlot((current) => {
      const existing = current[slotKey] ?? [];
      if (existing.includes(userUuid)) return current;
      return { ...current, [slotKey]: [...existing, userUuid] };
    });
  }

  function removeUserFromSlot(slotKey: string, userUuid: string) {
    setPersonnelBySlot((current) => ({
      ...current,
      [slotKey]: (current[slotKey] ?? []).filter((id) => id !== userUuid),
    }));
  }

  function toggleEditing() {
    if (isEditing) {
      setForm(originals);
      setPersonnelBySlot(initialPersonnel);
      setError('');
      setIsEditing(false);
    } else {
      setIsEditing(true);
      setConfirmDelete(false);
    }
  }

  async function doSave() {
    if (!template.employee_ra_template_uuid) {
      return;
    }

    const body: ReqUpdateEmployeeRATemplate = {};
    if (form.name !== originals.name) body.name = form.name.trim() || undefined;
    if (form.timetableTemplateId !== originals.timetableTemplateId && form.timetableTemplateId) {
      body.timetableTemplateId = form.timetableTemplateId;
    }

    // Chỉ gửi items khi nhân sự thực sự thay đổi. Backend dùng cơ chế REPLACE
    // toàn bộ mảng items, nên phải build ĐẦY ĐỦ từ mọi slot (kể cả slot không đổi).
    if (personnelDirty) {
      const nextItems: ReqEmployeeRATemplateItem[] = [];
      for (const slot of slots) {
        (personnelBySlot[slot.key] ?? []).forEach((userUuid, index) => {
          nextItems.push({
            lessonTypeId: slot.lessonTypeId,
            userUuid,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            sortOrder: index,
          });
        });
      }
      body.items = nextItems;
    }

    setError('');
    try {
      await updateTemplate.mutateAsync({
        templateUuid: template.employee_ra_template_uuid,
        body,
      });
      setIsEditing(false);
      onClose();
    } catch (mutationError) {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : 'Không cập nhật được template. Vui lòng thử lại.',
      );
    }
  }

  function handleApply(event: FormEvent) {
    event.preventDefault();

    if (!template.employee_ra_template_uuid || !isDirty) {
      return;
    }

    // Có nhân sự trùng lịch → yêu cầu xác nhận một lần trước khi lưu.
    if (conflicts.length > 0 && !conflictAcknowledged) {
      setShowConflictConfirm(true);
      return;
    }

    void doSave();
  }

  async function handleDelete() {
    if (!template.employee_ra_template_uuid) {
      return;
    }

    setError('');
    try {
      await deleteTemplate.mutateAsync(template.employee_ra_template_uuid);
      onClose();
    } catch (mutationError) {
      setConfirmDelete(false);
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : 'Không xóa được template. Có thể template đang được sử dụng.',
      );
    }
  }

  const personnelCount = isEditing ? editingTotal : items.length;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4 py-6">
      <form
        onSubmit={handleApply}
        className="flex w-full max-w-2xl max-h-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 p-6">
          <div className="min-w-0">
            <p className="text-[12px] font-extrabold uppercase tracking-[0.16em] text-[#1870FF]">
              Mẫu chấm công
            </p>
            {isEditing ? (
              <input
                value={form.name}
                onChange={(event) => updateField('name', event.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1 text-[28px] font-extrabold leading-tight text-slate-950 outline-none transition focus:border-[#1870FF] focus:ring-4 focus:ring-[rgba(24,112,255,0.14)]"
              />
            ) : (
              <h3 className="mt-1 truncate text-[28px] font-extrabold leading-tight text-slate-950">
                {template.employee_ra_template_name ?? '—'}
              </h3>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#1870FF]/10 px-3 py-1 text-[12px] font-extrabold uppercase tracking-[0.08em] text-[#1870FF]">
                <span className="h-2 w-2 rounded-full bg-[#1870FF]" />
                {template.timetable_template_name ?? 'Chưa liên kết TKB'}
              </span>
              <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[12px] font-extrabold text-slate-600">
                {personnelCount} phân công
              </span>
            </div>
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

        <div className="flex-1 overflow-y-auto">
          <DetailSection icon={UserRoundCheck} title="Thông tin template">
            <DetailGrid>
              <EditableRow
                label="Tên template"
                value={isEditing ? form.name : template.employee_ra_template_name}
                editing={isEditing}
                onChange={(next) => updateField('name', next)}
                required
              />
              <EditableSelectRow
                label="Mẫu thời khóa biểu liên kết"
                value={form.timetableTemplateId}
                editing={isEditing}
                onChange={(next) => updateField('timetableTemplateId', next)}
                displayValue={template.timetable_template_name}
                required
              >
                <option value="">Chọn mẫu thời khóa biểu</option>
                {timetableTemplates.map((timetableTemplate) => (
                  <option
                    key={timetableTemplate.timetable_template_uuid}
                    value={timetableTemplate.timetable_template_uuid ?? ''}
                  >
                    {timetableTemplate.timetable_template_name}
                    {timetableTemplate.grade?.name ? ` · ${timetableTemplate.grade.name}` : ''}
                    {timetableTemplate.school_year ? ` · ${timetableTemplate.school_year}` : ''}
                  </option>
                ))}
              </EditableSelectRow>
            </DetailGrid>
          </DetailSection>

          <DetailSection icon={Users} title={`Phân công nhân sự (${personnelCount})`}>
            {isEditing ? (
              <>
                {conflicts.length > 0 ? (
                  <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
                    <p className="flex items-center gap-1.5 font-extrabold">
                      <AlertTriangle size={13} className="shrink-0" />
                      {conflicts.length} nhân sự bị trùng lịch
                    </p>
                    <ul className="mt-1 list-disc space-y-0.5 pl-5 font-semibold">
                      {conflicts.map((conflict, index) => (
                        <li key={`${conflict.userUuid}-${index}`}>
                          {userById.get(conflict.userUuid)?.user_fullname
                            ?? userById.get(conflict.userUuid)?.user_email
                            ?? 'Nhân sự'}
                          {' · '}
                          {DAY_OF_WEEK_LABEL[conflict.dayOfWeek as DayOfWeek] ?? conflict.dayOfWeek}
                          {': '}
                          {conflict.firstLabel} ⟷ {conflict.secondLabel}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <PersonnelSlotEditor
                  slots={slots}
                  personnelBySlot={personnelBySlot}
                  users={users}
                  userById={userById}
                  isLoadingUsers={usersQuery.isLoading}
                  onAdd={addUserToSlot}
                  onRemove={removeUserFromSlot}
                />
              </>
            ) : items.length > 0 ? (
              <ul className="max-h-44 space-y-1.5 overflow-y-auto pr-1">
                {items.map((item) => (
                  <li
                    key={item.employee_ra_template_item_uuid}
                    className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2"
                  >
                    <span className="min-w-0 truncate text-[13px] font-extrabold text-slate-950">
                      {item.full_name ?? '—'}
                      {item.role_name ? (
                        <span className="ml-2 rounded-full bg-slate-200/70 px-2 py-0.5 text-[11px] font-extrabold text-slate-600">
                          {item.role_name}
                        </span>
                      ) : null}
                    </span>
                    <span className="shrink-0 text-[12px] font-bold text-slate-500">
                      {item.lesson_type_name ?? '—'} ·{' '}
                      {item.day_of_week ? DAY_OF_WEEK_LABEL[item.day_of_week] : '—'} ·{' '}
                      {item.start_time ?? '—'}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[13px] font-semibold text-slate-500">Chưa có phân công nào.</p>
            )}
          </DetailSection>

          <div className="bg-slate-50">
            <DetailSection icon={Shield} title="Dấu vết hệ thống">
              <DetailGrid>
                <DetailRow label="Ngày tạo" value={formatDateTime(template.created_at)} />
                <DetailRow label="Ngày cập nhật" value={formatDateTime(template.updated_at)} />
                <DetailRow label="Người tạo" value={template.created_by} />
                <DetailRow label="Người cập nhật" value={template.updated_by} />
              </DetailGrid>
            </DetailSection>
          </div>
        </div>

        {error ? (
          <p className="border-t border-slate-100 px-4 pt-3 text-[13px] font-semibold text-rose-600">
            {error}
          </p>
        ) : null}

        {confirmDelete ? (
          <ConfirmDeleteBanner
            message="Xóa mẫu chấm công này? Thao tác này không thể hoàn tác."
            isPending={deleteTemplate.isPending}
            onCancel={() => setConfirmDelete(false)}
            onConfirm={handleDelete}
          />
        ) : null}

        {showConflictConfirm ? (
          <div className="flex flex-col gap-3 border-t border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-start gap-2 text-[13px] font-bold text-amber-800">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              Có {conflicts.length} nhân sự bị trùng lịch. Vẫn lưu phân công này?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowConflictConfirm(false)}
                className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-3 text-[13px] font-black text-slate-700 transition hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConflictConfirm(false);
                  setConflictAcknowledged(true);
                  void doSave();
                }}
                disabled={updateTemplate.isPending}
                className="inline-flex h-9 items-center gap-2 rounded-xl bg-amber-500 px-3 text-[13px] font-black text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Vẫn lưu
              </button>
            </div>
          </div>
        ) : null}

        <DetailModalFooter
          isEditing={isEditing}
          isDirty={isDirty}
          isBusy={isBusy}
          isSaving={updateTemplate.isPending}
          onToggleEdit={toggleEditing}
          onRequestDelete={() => setConfirmDelete(true)}
        />
      </form>
    </div>
  );
}

function PersonnelSlotEditor({
  slots,
  personnelBySlot,
  users,
  userById,
  isLoadingUsers,
  onAdd,
  onRemove,
}: {
  slots: Slot[];
  personnelBySlot: Record<string, string[]>;
  users: ResUserDTO[];
  userById: Map<string, ResUserDTO>;
  isLoadingUsers: boolean;
  onAdd: (slotKey: string, userUuid: string) => void;
  onRemove: (slotKey: string, userUuid: string) => void;
}) {
  if (!slots.length) {
    return (
      <p className="rounded-lg bg-amber-50 px-3 py-2 text-[13px] font-bold text-amber-700">
        Mẫu thời khóa biểu liên kết chưa có tiết học (slot) nào để gán nhân sự.
      </p>
    );
  }

  return (
    <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
      <p className="text-[12px] font-semibold text-slate-500">
        Gán nhân sự cho từng tiết. Lưu thay đổi sẽ ghi đè toàn bộ phân công của mẫu này.
      </p>
      {slots.map((slot) => {
        const assigned = personnelBySlot[slot.key] ?? [];
        const available = users.filter((user) => user.id && !assigned.includes(user.id));

        return (
          <div key={slot.key} className="rounded-xl border border-slate-200 p-3">
            <p className="text-[12px] font-extrabold text-slate-700">
              {slot.lessonTypeName} · {DAY_OF_WEEK_LABEL[slot.dayOfWeek]} · {slot.startTime || '—'}
            </p>

            <div className="mt-2 flex flex-wrap gap-1.5">
              {assigned.length ? (
                assigned.map((userUuid) => {
                  const user = userById.get(userUuid);
                  return (
                    <span
                      key={userUuid}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#1870FF]/10 px-2.5 py-1 text-[12px] font-extrabold text-[#1870FF]"
                    >
                      {user?.user_fullname ?? user?.user_email ?? userUuid}
                      {user?.role?.name ? (
                        <span className="text-[10px] uppercase text-[#1870FF]/70">· {user.role.name}</span>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => onRemove(slot.key, userUuid)}
                        className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-[#1870FF]/20"
                        aria-label="Bỏ nhân sự"
                      >
                        <X size={11} />
                      </button>
                    </span>
                  );
                })
              ) : (
                <span className="text-[12px] font-semibold text-slate-400">Chưa gán nhân sự</span>
              )}
            </div>

            <select
              value=""
              disabled={isLoadingUsers || !available.length}
              onChange={(event) => {
                onAdd(slot.key, event.target.value);
                event.currentTarget.value = '';
              }}
              className="mt-2 h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-[13px] font-bold text-slate-800 outline-none transition focus:border-[#1870FF] focus:ring-2 focus:ring-[#1870FF]/15 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            >
              <option value="">
                {isLoadingUsers
                  ? 'Đang tải nhân sự...'
                  : available.length
                    ? '+ Thêm nhân sự'
                    : 'Đã gán hết nhân sự khả dụng'}
              </option>
              {available.map((user) => (
                <option key={user.id} value={user.id ?? ''}>
                  {user.user_fullname ?? user.user_email ?? 'Nhân sự'}
                  {user.role?.name ? ` · ${user.role.name}` : ''}
                </option>
              ))}
            </select>
          </div>
        );
      })}
    </div>
  );
}
