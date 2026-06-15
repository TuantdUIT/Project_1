import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { useGradesQuery, useLessonTypesQuery } from '@/features/Management_Services/curriculum';
import {
  useCreatePeriodSetting,
  useDeletePeriodSetting,
  useUpdatePeriodSetting,
} from '@/features/Management_Services/period-setting';
import type {
  ReqCreatePeriodSettingDTO,
  ReqPeriodSettingLessonTypeItemDTO,
  ReqUpdatePeriodSettingDTO,
  ResPeriodSettingDTO,
} from '@/features/Management_Services/period-setting/types';

const fieldClass =
  'h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-[14px] font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1870FF] focus:ring-4 focus:ring-[rgba(24,112,255,0.14)]';

const labelClass = 'text-[13px] font-bold text-slate-600';

type PeriodSettingFormModalProps =
  | { mode: 'create'; onClose: () => void }
  | { mode: 'update'; setting: ResPeriodSettingDTO; onClose: () => void };

type LessonTypeRow = {
  lessonTypeId: string;
  lessonsPerWeek: string;
  sortOrder: string;
};

type FormState = {
  name: string;
  numberOfWeek: string;
  gradeId: string;
  applyFrom: string;
  schoolYear: string;
  tuition: string;
  lessonTypes: LessonTypeRow[];
};

const todayIso = () => new Date().toISOString().slice(0, 10);

function buildInitial(setting?: ResPeriodSettingDTO): FormState {
  if (!setting) {
    return {
      name: '',
      numberOfWeek: '',
      gradeId: '',
      applyFrom: todayIso(),
      schoolYear: String(new Date().getFullYear()),
      tuition: '',
      lessonTypes: [],
    };
  }
  return {
    name: setting.period_setting_name ?? '',
    numberOfWeek: setting.number_of_week != null ? String(setting.number_of_week) : '',
    gradeId: setting.grade?.id != null ? String(setting.grade.id) : '',
    applyFrom: setting.apply_from ?? todayIso(),
    schoolYear: setting.school_year != null ? String(setting.school_year) : '',
    tuition: setting.tuition != null ? String(setting.tuition) : '',
    lessonTypes: (setting.lesson_type_configs ?? []).map((config) => ({
      lessonTypeId: config.lesson_type_uuid ?? '',
      lessonsPerWeek: config.lessons_per_week != null ? String(config.lessons_per_week) : '',
      sortOrder: config.sort_order != null ? String(config.sort_order) : '',
    })),
  };
}

export default function PeriodSettingFormModal(props: PeriodSettingFormModalProps) {
  const isCreate = props.mode === 'create';
  const initial = useMemo(
    () => buildInitial(isCreate ? undefined : props.setting),
    [isCreate, isCreate ? null : props.setting],
  );

  const [form, setForm] = useState<FormState>(initial);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const gradesQuery = useGradesQuery();
  const lessonTypesQuery = useLessonTypesQuery();
  const createSetting = useCreatePeriodSetting();
  const updateSetting = useUpdatePeriodSetting();
  const deleteSetting = useDeletePeriodSetting();
  const isPending = createSetting.isPending || updateSetting.isPending || deleteSetting.isPending;

  async function handleDelete() {
    if (props.mode !== 'update' || !props.setting.uuid_period_setting) return;
    setError('');
    try {
      await deleteSetting.mutateAsync(props.setting.uuid_period_setting);
      props.onClose();
    } catch (deleteErr) {
      setConfirmDelete(false);
      setError(
        deleteErr instanceof Error
          ? deleteErr.message
          : 'Không xóa được template. Có thể đang có period dùng template này.',
      );
    }
  }

  useEffect(() => {
    setForm(initial);
  }, [initial]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function addLessonTypeRow() {
    setForm((current) => ({
      ...current,
      lessonTypes: [
        ...current.lessonTypes,
        {
          lessonTypeId: '',
          lessonsPerWeek: '',
          sortOrder: String(current.lessonTypes.length + 1),
        },
      ],
    }));
  }

  function updateLessonTypeRow(index: number, patch: Partial<LessonTypeRow>) {
    setForm((current) => ({
      ...current,
      lessonTypes: current.lessonTypes.map((row, idx) =>
        idx === index ? { ...row, ...patch } : row,
      ),
    }));
  }

  function removeLessonTypeRow(index: number) {
    setForm((current) => ({
      ...current,
      lessonTypes: current.lessonTypes.filter((_, idx) => idx !== index),
    }));
  }

  function validateLessonTypes(): ReqPeriodSettingLessonTypeItemDTO[] | string {
    const items: ReqPeriodSettingLessonTypeItemDTO[] = [];
    const seenIds = new Set<string>();

    for (const [index, row] of form.lessonTypes.entries()) {
      const lessonTypeId = row.lessonTypeId.trim();
      const lessonsPerWeek = Number(row.lessonsPerWeek);
      const sortOrder = Number(row.sortOrder);

      if (!lessonTypeId) {
        return `Lesson type ở dòng ${index + 1} chưa được chọn.`;
      }
      if (seenIds.has(lessonTypeId)) {
        return `Lesson type ở dòng ${index + 1} bị trùng. Mỗi lesson type chỉ được khai báo một lần.`;
      }
      seenIds.add(lessonTypeId);

      if (!Number.isFinite(lessonsPerWeek) || lessonsPerWeek < 1) {
        return `lessonsPerWeek ở dòng ${index + 1} phải >= 1.`;
      }
      if (!Number.isFinite(sortOrder) || sortOrder < 1) {
        return `sortOrder ở dòng ${index + 1} phải >= 1.`;
      }

      items.push({ lessonTypeId, lessonsPerWeek, sortOrder });
    }

    return items;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');

    const validatedLessonTypes = validateLessonTypes();
    if (typeof validatedLessonTypes === 'string') {
      setError(validatedLessonTypes);
      return;
    }

    const numberOfWeek = Number(form.numberOfWeek);
    const gradeId = Number(form.gradeId);
    const schoolYear = Number(form.schoolYear);
    const tuition = Number(form.tuition);

    if (isCreate) {
      if (
        !form.name.trim()
        || !Number.isFinite(numberOfWeek) || numberOfWeek < 1
        || !Number.isFinite(gradeId)
        || !form.applyFrom
        || !Number.isFinite(schoolYear)
        || !Number.isFinite(tuition)
      ) {
        setError('Vui lòng nhập đầy đủ thông tin bắt buộc.');
        return;
      }

      const body: ReqCreatePeriodSettingDTO = {
        name: form.name.trim(),
        numberOfWeek,
        gradeId,
        applyFrom: form.applyFrom,
        schoolYear,
        tuition,
        lessonTypeConfigs: validatedLessonTypes,
      };

      try {
        await createSetting.mutateAsync(body);
        props.onClose();
      } catch (submitError) {
        setError(
          submitError instanceof Error
            ? submitError.message
            : 'Không tạo được period setting.',
        );
      }
      return;
    }

    const setting = props.setting;
    const body: ReqUpdatePeriodSettingDTO = {};
    if (form.name.trim() !== (setting.period_setting_name ?? '')) body.name = form.name.trim();
    if (Number.isFinite(numberOfWeek) && numberOfWeek !== setting.number_of_week) {
      if (numberOfWeek < 1) {
        setError('numberOfWeek phải lớn hơn 0.');
        return;
      }
      body.numberOfWeek = numberOfWeek;
    }
    if (Number.isFinite(gradeId) && gradeId !== setting.grade?.id) body.gradeId = gradeId;
    if (form.applyFrom !== setting.apply_from) body.applyFrom = form.applyFrom;
    if (Number.isFinite(schoolYear) && schoolYear !== setting.school_year) {
      body.schoolYear = schoolYear;
    }
    if (Number.isFinite(tuition) && tuition !== setting.tuition) body.tuition = tuition;

    body.lessonTypeConfigs = validatedLessonTypes;

    try {
      await updateSetting.mutateAsync({
        uuid: setting.uuid_period_setting ?? '',
        body,
      });
      props.onClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Không cập nhật được period setting.',
      );
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4 py-6">
      <form
        onSubmit={handleSubmit}
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[12px] font-extrabold uppercase tracking-[0.16em] text-[#1870FF]">
              Period Setting
            </p>
            <h3 className="mt-1 text-[22px] font-extrabold leading-tight text-slate-950">
              {isCreate ? 'Tạo template mới' : 'Cập nhật template'}
            </h3>
          </div>
          <button
            type="button"
            onClick={props.onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Tên template" required={isCreate}>
            <input
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
              required={isCreate}
              placeholder="K12-2026-12W"
              className={fieldClass}
            />
          </Field>

          <Field label="Khối" required={isCreate}>
            <select
              value={form.gradeId}
              onChange={(event) => updateField('gradeId', event.target.value)}
              required={isCreate}
              className={`${fieldClass} font-extrabold`}
            >
              <option value="">Chọn khối</option>
              {(gradesQuery.data?.grades ?? []).map((grade) => (
                <option key={grade.id} value={grade.id ?? ''}>
                  {grade.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Số tuần (numberOfWeek)" required={isCreate}>
            <input
              type="number"
              min={1}
              value={form.numberOfWeek}
              onChange={(event) => updateField('numberOfWeek', event.target.value)}
              required={isCreate}
              className={fieldClass}
            />
          </Field>

          <Field label="Năm học" required={isCreate}>
            <input
              type="number"
              value={form.schoolYear}
              onChange={(event) => updateField('schoolYear', event.target.value)}
              required={isCreate}
              className={fieldClass}
            />
          </Field>

          <Field label="Ngày áp dụng (applyFrom)" required={isCreate}>
            <input
              type="date"
              value={form.applyFrom}
              onChange={(event) => updateField('applyFrom', event.target.value)}
              required={isCreate}
              className={fieldClass}
            />
          </Field>

          <Field label="Học phí (VND)" required={isCreate}>
            <input
              type="number"
              min={0}
              value={form.tuition}
              onChange={(event) => updateField('tuition', event.target.value)}
              required={isCreate}
              className={fieldClass}
            />
          </Field>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[14px] font-extrabold text-slate-950">Lesson Type Configs</p>
              
            </div>
            <button
              type="button"
              onClick={addLessonTypeRow}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#1870FF] px-3 text-[12px] font-extrabold text-[#1870FF] transition hover:bg-[rgba(24,112,255,0.08)]"
            >
              <Plus size={14} />
              Thêm dòng
            </button>
          </div>

          {form.lessonTypes.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-4 text-center text-[12px] font-semibold text-slate-500">
              Chưa có lesson type. Có thể bỏ trống.
            </p>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-[2fr_1fr_1fr_auto] items-center gap-2 px-2">
                <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-slate-500">Loại buổi học</span>
                <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-slate-500">Số buổi học một tuần</span>
                <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-slate-500">Thứ tự</span>
                <span className="w-11" aria-hidden />
              </div>
              {form.lessonTypes.map((row, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[2fr_1fr_1fr_auto] items-center gap-2 rounded-lg bg-white p-2"
                >
                  <select
                    value={row.lessonTypeId}
                    onChange={(event) =>
                      updateLessonTypeRow(index, { lessonTypeId: event.target.value })
                    }
                    required
                    className={`${fieldClass} font-extrabold`}
                  >
                    <option value="">Chọn lesson type</option>
                    {(lessonTypesQuery.data ?? []).map((lessonType) => (
                      <option
                        key={lessonType.lesson_type_uuid ?? lessonType.lesson_type_name}
                        value={lessonType.lesson_type_uuid ?? ''}
                      >
                        {lessonType.lesson_type_name ?? '—'}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={row.lessonsPerWeek}
                    onChange={(event) =>
                      updateLessonTypeRow(index, { lessonsPerWeek: event.target.value })
                    }
                    placeholder="Buổi/tuần"
                    required
                    className={fieldClass}
                  />
                  <input
                    type="number"
                    min={1}
                    value={row.sortOrder}
                    onChange={(event) =>
                      updateLessonTypeRow(index, { sortOrder: event.target.value })
                    }
                    placeholder="Thứ tự"
                    required
                    className={fieldClass}
                  />
                  <button
                    type="button"
                    onClick={() => removeLessonTypeRow(index)}
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-rose-100 bg-rose-50 text-rose-600 transition hover:bg-rose-100"
                    aria-label="Xóa dòng"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error ? <p className="mt-4 text-[13px] font-semibold text-rose-600">{error}</p> : null}

        {!isCreate && confirmDelete ? (
          <div className="mt-4 flex flex-col gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[13px] font-bold text-rose-700">
              Xóa template này? Chỉ xóa được nếu chưa có period nào sử dụng.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-[13px] font-extrabold text-slate-600 transition hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteSetting.isPending}
                className="h-9 rounded-lg bg-rose-600 px-3 text-[13px] font-extrabold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleteSetting.isPending ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex items-center justify-between gap-3">
          {!isCreate ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-rose-100 bg-rose-50 px-4 text-[14px] font-extrabold text-rose-600 transition hover:bg-rose-100"
            >
              <Trash2 size={15} />
              Xóa
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={props.onClose}
              className="h-11 rounded-xl border border-slate-300 px-4 text-[14px] font-extrabold text-slate-600 transition hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="h-11 rounded-xl bg-[#1870FF] px-5 text-[14px] font-extrabold text-white shadow-[0_12px_22px_rgba(24,112,255,0.26)] transition hover:bg-[#0f62e6] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? 'Đang lưu...' : isCreate ? 'Tạo template' : 'Lưu thay đổi'}
            </button>
          </div>
        </div>
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
      <span className={labelClass}>
        {label}
        {required ? <span className="text-rose-500"> *</span> : null}
      </span>
      {children}
    </label>
  );
}
