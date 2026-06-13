import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CalendarRange, ListChecks, Shield, X } from 'lucide-react';
import { useDeleteTimetableTemplate } from '@/features/Management_Services/timetable-template/api/templates';
import {
  useApplyTimetableTemplateUpdate,
  type SlotTimeChange,
  type TimetableMetadata,
} from '@/features/Management_Services/timetable-template/lib/template-sync';
import { DAY_OF_WEEK_LABEL, formatMinutes, parseHHmm } from '@/features/Management_Services/timetable-template/lib/time';
import { buildDurationByLessonType, findTimetableOverlaps } from '@/features/Management_Services/timetable-template/lib/slot-overlap';
import type { DayOfWeek, TimetableTemplate } from '@/features/Management_Services/timetable-template/types';
import { useEmployeeRATemplatesQuery } from '@/features/Management_Services/employee-ra-template/api/employee-ra-templates';
import { useLessonTypesQuery } from '@/features/Management_Services/curriculum';
import type { components } from '@/types/openapi_MS';
import {
  ConfirmDeleteBanner,
  DetailGrid,
  DetailModalFooter,
  DetailRow,
  DetailSection,
  EditableRow,
  EditableSelectRow,
} from '@/components/ui/detail-modal-kit';
import { formatDate, formatDateTime } from '@/utils/date';

type ResGradeDTO = components['schemas']['ResGradeDTO'];

type TimetableTemplateDetailModalProps = {
  template: TimetableTemplate;
  grades: ResGradeDTO[];
  onClose: () => void;
};

/** "HH:mm:ss" | "HH:mm" -> "HH:mm" cho input type=time. */
function toInputTime(value: string | undefined) {
  const minutes = parseHHmm(value);
  return minutes == null ? '' : formatMinutes(minutes);
}

export default function TimetableTemplateDetailModal({
  template,
  grades,
  onClose,
}: TimetableTemplateDetailModalProps) {
  const applyUpdate = useApplyTimetableTemplateUpdate();
  const deleteTemplate = useDeleteTimetableTemplate();
  const raTemplatesQuery = useEmployeeRATemplatesQuery();

  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');
  const [successNote, setSuccessNote] = useState('');
  // Cảnh báo chồng giờ: khi có chồng, Lưu sẽ yêu cầu xác nhận một lần.
  const [showOverlapConfirm, setShowOverlapConfirm] = useState(false);
  const [overlapAcknowledged, setOverlapAcknowledged] = useState(false);

  const items = useMemo(() => template.items ?? [], [template.items]);

  const originals = useMemo(
    () => ({
      name: template.timetable_template_name ?? '',
      gradeId: template.grade?.id != null ? String(template.grade.id) : '',
      schoolYear: template.school_year != null ? String(template.school_year) : '',
      applyFrom: template.apply_from ?? '',
      active: template.active == null ? 'true' : String(template.active),
    }),
    [template],
  );

  // Bản đồ giờ gốc của từng tiết (key = item uuid) ở dạng "HH:mm".
  const originalItemTimes = useMemo(() => {
    const map: Record<string, string> = {};
    for (const item of items) {
      if (item.timetable_template_item_uuid) {
        map[item.timetable_template_item_uuid] = toInputTime(item.start_time);
      }
    }
    return map;
  }, [items]);

  const [form, setForm] = useState(originals);
  const [itemTimes, setItemTimes] = useState<Record<string, string>>(originalItemTimes);

  useEffect(() => {
    setForm(originals);
    setItemTimes(originalItemTimes);
    setError('');
    setSuccessNote('');
  }, [originals, originalItemTimes]);

  const metadataDirty = (Object.keys(originals) as Array<keyof typeof originals>).some(
    (key) => form[key] !== originals[key],
  );
  const timesDirty = Object.keys(originalItemTimes).some(
    (uuid) => itemTimes[uuid] !== originalItemTimes[uuid],
  );
  const isDirty = metadataDirty || timesDirty;
  const isBusy = applyUpdate.isPending || deleteTemplate.isPending;

  // A — phát hiện chồng giờ trên GIỜ ĐANG SỬA (itemTimes), không phải giờ gốc.
  const lessonTypesQuery = useLessonTypesQuery();
  const durationByLessonType = useMemo(
    () => buildDurationByLessonType(lessonTypesQuery.data ?? []),
    [lessonTypesQuery.data],
  );
  const overlaps = useMemo(() => {
    const editedItems = items.map((item) => ({
      lesson_type_uuid: item.lesson_type_uuid,
      lesson_type_name: item.lesson_type_name,
      day_of_week: item.day_of_week,
      start_time: item.timetable_template_item_uuid
        ? (itemTimes[item.timetable_template_item_uuid] ?? item.start_time)
        : item.start_time,
    }));
    return findTimetableOverlaps(editedItems, durationByLessonType);
  }, [items, itemTimes, durationByLessonType]);

  // Đổi giờ → hủy xác nhận cũ (phải xác nhận lại nếu vẫn còn chồng giờ).
  useEffect(() => {
    setOverlapAcknowledged(false);
    setShowOverlapConfirm(false);
  }, [itemTimes]);

  const linkedRaTemplates = useMemo(
    () =>
      (raTemplatesQuery.data ?? []).filter(
        (raTemplate) => raTemplate.timetable_template_uuid === template.timetable_template_uuid,
      ),
    [raTemplatesQuery.data, template.timetable_template_uuid],
  );

  function updateField<K extends keyof typeof form>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleEditing() {
    if (isEditing) {
      setForm(originals);
      setItemTimes(originalItemTimes);
      setError('');
      setIsEditing(false);
    } else {
      setIsEditing(true);
      setConfirmDelete(false);
      setSuccessNote('');
    }
  }

  function buildChanges(): SlotTimeChange[] {
    const changes: SlotTimeChange[] = [];
    for (const item of items) {
      const uuid = item.timetable_template_item_uuid;
      if (!uuid) continue;

      const next = itemTimes[uuid];
      const original = originalItemTimes[uuid];
      const oldMinutes = parseHHmm(item.start_time);

      if (next && next !== original && oldMinutes != null && item.lesson_type_uuid && item.day_of_week) {
        changes.push({
          lessonTypeId: item.lesson_type_uuid,
          dayOfWeek: item.day_of_week,
          oldMinutes,
          newStartTime: next,
        });
      }
    }
    return changes;
  }

  async function doApply() {
    if (!template.timetable_template_uuid) {
      return;
    }

    const metadata: TimetableMetadata = {
      name: form.name.trim() || undefined,
      gradeId: form.gradeId ? Number(form.gradeId) : undefined,
      schoolYear: form.schoolYear ? Number(form.schoolYear) : undefined,
      applyFrom: form.applyFrom || undefined,
      active: form.active === 'true',
    };

    setError('');
    setSuccessNote('');
    try {
      const result = await applyUpdate.mutateAsync({
        template,
        metadata,
        changes: buildChanges(),
        linkedRaTemplates,
      });
      setIsEditing(false);
      if (result.syncedRaTemplates > 0) {
        setSuccessNote(
          `Đã cập nhật và đồng bộ ${result.movedAssignments} phân công sang giờ mới `
            + `ở ${result.syncedRaTemplates} mẫu chấm công liên kết.`,
        );
      } else {
        onClose();
      }
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

    if (!template.timetable_template_uuid || !isDirty) {
      return;
    }

    // Có tiết chồng giờ → yêu cầu xác nhận một lần trước khi lưu.
    if (overlaps.length > 0 && !overlapAcknowledged) {
      setShowOverlapConfirm(true);
      return;
    }

    void doApply();
  }

  async function handleDelete() {
    if (!template.timetable_template_uuid) {
      return;
    }

    setError('');
    try {
      await deleteTemplate.mutateAsync(template.timetable_template_uuid);
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

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4 py-6">
      <form
        onSubmit={handleApply}
        className="flex w-full max-w-2xl max-h-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 p-6">
          <div className="min-w-0">
            <p className="text-[12px] font-extrabold uppercase tracking-[0.16em] text-[#1870FF]">
              Mẫu thời khóa biểu
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
                {template.timetable_template_name ?? '—'}
              </h3>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#1870FF]/10 px-3 py-1 text-[12px] font-extrabold uppercase tracking-[0.08em] text-[#1870FF]">
                <span className="h-2 w-2 rounded-full bg-[#1870FF]" />
                {template.grade?.name ?? 'Chưa gán khối'}
              </span>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-[12px] font-extrabold ${
                  template.active === false
                    ? 'bg-slate-100 text-slate-500'
                    : 'bg-emerald-50 text-emerald-600'
                }`}
              >
                {template.active === false ? 'Ngừng áp dụng' : 'Đang hoạt động'}
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
          <DetailSection icon={CalendarRange} title="Thông tin template">
            <DetailGrid>
              <EditableRow
                label="Tên template"
                value={isEditing ? form.name : template.timetable_template_name}
                editing={isEditing}
                onChange={(next) => updateField('name', next)}
                required
              />
              <EditableSelectRow
                label="Khối"
                value={form.gradeId}
                editing={isEditing}
                onChange={(next) => updateField('gradeId', next)}
                displayValue={template.grade?.name}
                required
              >
                <option value="">Chọn khối</option>
                {grades.map((grade) => (
                  <option key={grade.id} value={grade.id ?? ''}>
                    {grade.name}
                  </option>
                ))}
              </EditableSelectRow>
              <EditableRow
                label="Năm học"
                value={isEditing ? form.schoolYear : String(template.school_year ?? '')}
                editing={isEditing}
                onChange={(next) => updateField('schoolYear', next.replace(/\D/g, ''))}
                type="number"
                required
              />
              <EditableRow
                label="Áp dụng từ"
                value={isEditing ? form.applyFrom : template.apply_from}
                editing={isEditing}
                onChange={(next) => updateField('applyFrom', next)}
                type="date"
                displayValue={formatDate(template.apply_from)}
                required
              />
              <EditableSelectRow
                label="Trạng thái"
                value={form.active}
                editing={isEditing}
                onChange={(next) => updateField('active', next)}
                displayValue={template.active === false ? 'Ngừng áp dụng' : 'Đang hoạt động'}
              >
                <option value="true">Đang hoạt động</option>
                <option value="false">Ngừng áp dụng</option>
              </EditableSelectRow>
            </DetailGrid>
          </DetailSection>

          <DetailSection icon={ListChecks} title={`Tiết học trong tuần (${items.length})`}>
            {isEditing ? (
              <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-[12px] font-semibold text-amber-700">
                Đổi giờ một tiết sẽ tự đồng bộ sang nhân sự tương ứng trong các mẫu chấm công liên kết.
              </p>
            ) : null}
            {isEditing && overlaps.length > 0 ? (
              <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
                <p className="flex items-center gap-1.5 font-extrabold">
                  <AlertTriangle size={13} className="shrink-0" />
                  {overlaps.length} cặp tiết bị chồng giờ
                </p>
                <ul className="mt-1 list-disc space-y-0.5 pl-5 font-semibold">
                  {overlaps.map((overlap, index) => (
                    <li key={index}>
                      {DAY_OF_WEEK_LABEL[overlap.dayOfWeek as DayOfWeek] ?? overlap.dayOfWeek}
                      {': '}
                      {overlap.firstLabel} ⟷ {overlap.secondLabel}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {items.length > 0 ? (
              <ul className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
                {items.map((item) => {
                  const uuid = item.timetable_template_item_uuid ?? '';
                  return (
                    <li
                      key={uuid}
                      className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2"
                    >
                      <span className="min-w-0 truncate text-[13px] font-extrabold text-slate-950">
                        {item.lesson_type_name ?? '—'}
                      </span>
                      <span className="flex shrink-0 items-center gap-2 text-[12px] font-bold text-slate-500">
                        {item.day_of_week ? DAY_OF_WEEK_LABEL[item.day_of_week] : '—'}
                        {isEditing ? (
                          <input
                            type="time"
                            value={itemTimes[uuid] ?? ''}
                            onChange={(event) =>
                              setItemTimes((current) => ({ ...current, [uuid]: event.target.value }))
                            }
                            className="h-8 rounded-md border border-slate-300 bg-white px-2 text-[13px] font-extrabold text-slate-950 outline-none transition focus:border-[#1870FF] focus:ring-2 focus:ring-[rgba(24,112,255,0.2)]"
                          />
                        ) : (
                          <span>{item.start_time ?? '—'}</span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-[13px] font-semibold text-slate-500">Chưa có tiết học nào.</p>
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
        {successNote ? (
          <p className="border-t border-slate-100 px-4 pt-3 text-[13px] font-semibold text-emerald-600">
            {successNote}
          </p>
        ) : null}

        {confirmDelete ? (
          <ConfirmDeleteBanner
            message="Xóa mẫu thời khóa biểu này? Thao tác này không thể hoàn tác."
            isPending={deleteTemplate.isPending}
            onCancel={() => setConfirmDelete(false)}
            onConfirm={handleDelete}
          />
        ) : null}

        {showOverlapConfirm ? (
          <div className="flex flex-col gap-3 border-t border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-start gap-2 text-[13px] font-bold text-amber-800">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              Có {overlaps.length} cặp tiết chồng giờ. Vẫn lưu thay đổi?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowOverlapConfirm(false)}
                className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-3 text-[13px] font-black text-slate-700 transition hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowOverlapConfirm(false);
                  setOverlapAcknowledged(true);
                  void doApply();
                }}
                disabled={applyUpdate.isPending}
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
          isSaving={applyUpdate.isPending}
          onToggleEdit={toggleEditing}
          onRequestDelete={() => setConfirmDelete(true)}
        />
      </form>
    </div>
  );
}
