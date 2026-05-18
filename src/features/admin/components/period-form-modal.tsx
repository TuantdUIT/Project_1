import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { CalendarDays, X } from 'lucide-react';
import { useCreatePeriod, useUpdatePeriod } from '@/features/admin';
import type {
  ReqCreatePeriodDTO,
  ReqUpdatePeriodDTO,
  ResPeriodDTO,
  TuitionStatus,
} from '@/features/admin/types';
import { useGradesQuery } from '@/features/curriculum';
import { usePeriodSettingsQuery } from '@/features/period-setting';

const fieldClass =
  'h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-[14px] font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1870FF] focus:ring-4 focus:ring-[rgba(24,112,255,0.14)]';

const labelClass = 'text-[13px] font-bold text-slate-600';

const tuitionOptions: TuitionStatus[] = ['UNPAID', 'PARTIAL', 'PAID'];

type CreateMode = 'TEMPLATE' | 'MANUAL';

type PeriodFormModalProps =
  | {
      mode: 'create';
      userUuid: string;
      onClose: () => void;
    }
  | {
      mode: 'update';
      userUuid: string;
      period: ResPeriodDTO;
      onClose: () => void;
    };

type FormState = {
  createMode: CreateMode;
  periodSettingId: string;
  timetableTemplateId: string;
  gradeId: string;
  numberOfWeek: string;
  schoolYear: string;
  tuition: string;
  weekLeft: string;
  tuitionStatus: TuitionStatus;
  enrollDate: string;
  debt: string;
  note: string;
  periodStartWeek: string;
  useStudyWeekStartDate: boolean;
};

const todayIso = () => new Date().toISOString().slice(0, 10);

function buildInitialFormState(period?: ResPeriodDTO): FormState {
  if (!period) {
    return {
      createMode: 'TEMPLATE',
      periodSettingId: '',
      timetableTemplateId: '',
      gradeId: '',
      numberOfWeek: '',
      schoolYear: String(new Date().getFullYear()),
      tuition: '',
      weekLeft: '',
      tuitionStatus: 'UNPAID',
      enrollDate: todayIso(),
      debt: '',
      note: '',
      periodStartWeek: '',
      useStudyWeekStartDate: true,
    };
  }
  return {
    createMode: period.period_setting?.uuid_period_setting ? 'TEMPLATE' : 'MANUAL',
    periodSettingId: period.period_setting?.uuid_period_setting ?? '',
    timetableTemplateId: period.timetable_template?.timetable_template_uuid ?? '',
    gradeId: period.grade?.id != null ? String(period.grade.id) : '',
    numberOfWeek: period.number_of_week != null ? String(period.number_of_week) : '',
    schoolYear: period.school_year != null ? String(period.school_year) : '',
    tuition: period.tuition != null ? String(period.tuition) : '',
    weekLeft: period.week_left != null ? String(period.week_left) : '',
    tuitionStatus: period.tuition_status ?? 'UNPAID',
    enrollDate: period.enroll_date ?? todayIso(),
    debt: period.debt != null ? String(period.debt) : '',
    note: period.note ?? '',
    periodStartWeek: period.period_start_week != null ? String(period.period_start_week) : '',
    useStudyWeekStartDate: period.use_study_week_start_date ?? true,
  };
}

export default function PeriodFormModal(props: PeriodFormModalProps) {
  const isCreate = props.mode === 'create';
  const initial = useMemo(
    () => buildInitialFormState(isCreate ? undefined : props.period),
    [isCreate, isCreate ? null : props.period],
  );

  const [form, setForm] = useState<FormState>(initial);
  const [error, setError] = useState('');
  const [userTouchedDebt, setUserTouchedDebt] = useState(!isCreate);

  const periodSettingsQuery = usePeriodSettingsQuery();
  const gradesQuery = useGradesQuery();
  const createPeriod = useCreatePeriod();
  const updatePeriod = useUpdatePeriod();
  const isPending = createPeriod.isPending || updatePeriod.isPending;

  const selectedSetting = useMemo(
    () =>
      periodSettingsQuery.data?.find(
        (setting) => setting.uuid_period_setting === form.periodSettingId,
      ),
    [periodSettingsQuery.data, form.periodSettingId],
  );

  useEffect(() => {
    if (!isCreate || form.createMode !== 'TEMPLATE' || !selectedSetting) {
      return;
    }
    setForm((current) => ({
      ...current,
      gradeId: selectedSetting.grade?.id != null ? String(selectedSetting.grade.id) : current.gradeId,
      numberOfWeek:
        selectedSetting.number_of_week != null
          ? String(selectedSetting.number_of_week)
          : current.numberOfWeek,
      schoolYear:
        selectedSetting.school_year != null ? String(selectedSetting.school_year) : current.schoolYear,
      tuition: selectedSetting.tuition != null ? String(selectedSetting.tuition) : current.tuition,
    }));
  }, [selectedSetting, isCreate, form.createMode]);

  useEffect(() => {
    if (userTouchedDebt) {
      return;
    }
    const tuitionNum = Number(form.tuition);
    if (!Number.isFinite(tuitionNum)) {
      return;
    }
    const next = form.tuitionStatus === 'PAID' ? 0 : tuitionNum;
    setForm((current) => ({ ...current, debt: String(next) }));
  }, [form.tuitionStatus, form.tuition, userTouchedDebt]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toNumberOrUndefined(raw: string): number | undefined {
    const trimmed = raw.trim();
    if (!trimmed) {
      return undefined;
    }
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  function buildCreateBody(): ReqCreatePeriodDTO | null {
    if (!form.enrollDate) {
      setError('Vui lòng nhập ngày bắt đầu (enrollDate).');
      return null;
    }

    const base: ReqCreatePeriodDTO = {
      userUuid: props.userUuid,
      tuitionStatus: form.tuitionStatus,
      enrollDate: form.enrollDate,
      debt: toNumberOrUndefined(form.debt),
      note: form.note.trim() || undefined,
      periodStartWeek: toNumberOrUndefined(form.periodStartWeek),
      useStudyWeekStartDate: form.useStudyWeekStartDate,
      timetableTemplateId: form.timetableTemplateId.trim() || undefined,
    };

    if (form.createMode === 'TEMPLATE') {
      if (!form.periodSettingId) {
        setError('Vui lòng chọn template (Period Setting).');
        return null;
      }
      return { ...base, periodSettingId: form.periodSettingId };
    }

    const gradeId = toNumberOrUndefined(form.gradeId);
    const numberOfWeek = toNumberOrUndefined(form.numberOfWeek);
    const schoolYear = toNumberOrUndefined(form.schoolYear);
    const tuition = toNumberOrUndefined(form.tuition);

    if (gradeId == null || numberOfWeek == null || schoolYear == null || tuition == null) {
      setError('Cần đủ Khối, Số tuần, Năm học, Học phí khi không dùng template.');
      return null;
    }
    if (numberOfWeek < 1) {
      setError('Số tuần phải lớn hơn 0.');
      return null;
    }

    return {
      ...base,
      gradeId,
      numberOfWeek,
      schoolYear,
      tuition,
      weekLeft: toNumberOrUndefined(form.weekLeft),
    };
  }

  function buildUpdateBody(period: ResPeriodDTO): ReqUpdatePeriodDTO {
    const body: ReqUpdatePeriodDTO = {};

    if (form.tuitionStatus !== period.tuition_status) body.tuitionStatus = form.tuitionStatus;
    if (form.enrollDate !== period.enroll_date) body.enrollDate = form.enrollDate;
    if (form.note !== (period.note ?? '')) body.note = form.note.trim() || undefined;
    if (form.useStudyWeekStartDate !== (period.use_study_week_start_date ?? true)) {
      body.useStudyWeekStartDate = form.useStudyWeekStartDate;
    }

    const settingId = form.periodSettingId.trim();
    const currentSettingId = period.period_setting?.uuid_period_setting ?? '';
    if (settingId !== currentSettingId) body.periodSettingId = settingId || undefined;

    const templateId = form.timetableTemplateId.trim();
    const currentTemplateId = period.timetable_template?.timetable_template_uuid ?? '';
    if (templateId !== currentTemplateId) body.timetableTemplateId = templateId || undefined;

    const gradeId = toNumberOrUndefined(form.gradeId);
    if (gradeId !== (period.grade?.id ?? undefined)) body.gradeId = gradeId;

    const numberOfWeek = toNumberOrUndefined(form.numberOfWeek);
    if (numberOfWeek !== (period.number_of_week ?? undefined)) body.numberOfWeek = numberOfWeek;

    const schoolYear = toNumberOrUndefined(form.schoolYear);
    if (schoolYear !== (period.school_year ?? undefined)) body.schoolYear = schoolYear;

    const tuition = toNumberOrUndefined(form.tuition);
    if (tuition !== (period.tuition ?? undefined)) body.tuition = tuition;

    const weekLeft = toNumberOrUndefined(form.weekLeft);
    if (weekLeft !== (period.week_left ?? undefined)) body.weekLeft = weekLeft;

    const periodStartWeek = toNumberOrUndefined(form.periodStartWeek);
    if (periodStartWeek !== (period.period_start_week ?? undefined)) {
      body.periodStartWeek = periodStartWeek;
    }

    const debt = toNumberOrUndefined(form.debt);
    if (debt !== (period.debt ?? undefined)) body.debt = debt;

    return body;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');

    try {
      if (isCreate) {
        const body = buildCreateBody();
        if (!body) return;
        await createPeriod.mutateAsync(body);
      } else {
        const body = buildUpdateBody(props.period);
        const periodUuid = props.period.period_uuid;
        if (!periodUuid) {
          setError('Không tìm thấy UUID của period.');
          return;
        }
        await updatePeriod.mutateAsync({ periodUuid, body, userUuid: props.userUuid });
      }
      props.onClose();
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : 'Có lỗi xảy ra khi lưu period.';
      setError(message);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4 py-6">
      <form
        onSubmit={handleSubmit}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[12px] font-extrabold uppercase tracking-[0.16em] text-[#1870FF]">
              Period / Học phí
            </p>
            <h3 className="mt-1 text-[22px] font-extrabold leading-tight text-slate-950">
              {isCreate ? 'Tạo period mới' : 'Cập nhật period'}
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

        {isCreate ? (
          <div className="mb-5 flex rounded-xl border border-slate-200 bg-slate-50 p-1">
            {(['TEMPLATE', 'MANUAL'] as CreateMode[]).map((option) => {
              const isActive = form.createMode === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => updateField('createMode', option)}
                  className={`flex-1 rounded-lg px-4 py-2 text-[13px] font-extrabold transition ${
                    isActive
                      ? 'bg-white text-[#1870FF] shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {option === 'TEMPLATE' ? 'Từ template' : 'Nhập tay'}
                </button>
              );
            })}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {isCreate && form.createMode === 'TEMPLATE' ? (
            <label className="space-y-2 sm:col-span-2">
              <span className={labelClass}>
                Template (Period Setting) <span className="text-rose-500">*</span>
              </span>
              <select
                value={form.periodSettingId}
                onChange={(event) => updateField('periodSettingId', event.target.value)}
                required
                className={`${fieldClass} font-extrabold`}
              >
                <option value="">
                  {periodSettingsQuery.isLoading ? 'Đang tải template...' : 'Chọn template'}
                </option>
                {(periodSettingsQuery.data ?? []).map((setting) => (
                  <option
                    key={setting.uuid_period_setting}
                    value={setting.uuid_period_setting ?? ''}
                  >
                    {setting.period_setting_name} · {setting.grade?.name ?? '—'} ·{' '}
                    {setting.number_of_week ?? '?'}W · {formatTuition(setting.tuition)}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <Field label="Khối" required={isCreate && form.createMode === 'MANUAL'}>
            <select
              value={form.gradeId}
              onChange={(event) => updateField('gradeId', event.target.value)}
              required={isCreate && form.createMode === 'MANUAL'}
              disabled={isCreate && form.createMode === 'TEMPLATE'}
              className={`${fieldClass} font-extrabold disabled:bg-slate-50 disabled:text-slate-500`}
            >
              <option value="">Chọn khối</option>
              {(gradesQuery.data?.grades ?? []).map((grade) => (
                <option key={grade.id} value={grade.id ?? ''}>
                  {grade.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Số tuần (numberOfWeek)" required={isCreate && form.createMode === 'MANUAL'}>
            <input
              type="number"
              min={1}
              value={form.numberOfWeek}
              onChange={(event) => updateField('numberOfWeek', event.target.value)}
              required={isCreate && form.createMode === 'MANUAL'}
              disabled={isCreate && form.createMode === 'TEMPLATE'}
              className={`${fieldClass} disabled:bg-slate-50 disabled:text-slate-500`}
            />
          </Field>

          <Field label="Năm học" required={isCreate && form.createMode === 'MANUAL'}>
            <input
              type="number"
              value={form.schoolYear}
              onChange={(event) => updateField('schoolYear', event.target.value)}
              required={isCreate && form.createMode === 'MANUAL'}
              disabled={isCreate && form.createMode === 'TEMPLATE'}
              className={`${fieldClass} disabled:bg-slate-50 disabled:text-slate-500`}
            />
          </Field>

          <Field label="Học phí (VND)" required={isCreate && form.createMode === 'MANUAL'}>
            <input
              type="number"
              min={0}
              value={form.tuition}
              onChange={(event) => updateField('tuition', event.target.value)}
              required={isCreate && form.createMode === 'MANUAL'}
              disabled={isCreate && form.createMode === 'TEMPLATE'}
              className={`${fieldClass} disabled:bg-slate-50 disabled:text-slate-500`}
            />
          </Field>

          <Field label="Trạng thái học phí" required>
            <div className="flex gap-2">
              {tuitionOptions.map((option) => {
                const isActive = form.tuitionStatus === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => updateField('tuitionStatus', option)}
                    className={`h-11 flex-1 rounded-xl border text-[13px] font-extrabold uppercase tracking-wide transition ${
                      isActive
                        ? 'border-[#1870FF] bg-[#1870FF] text-white shadow-[0_10px_18px_rgba(24,112,255,0.22)]'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-[#1870FF] hover:text-[#1870FF]'
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Ngày nhập học (enrollDate)" required>
            <div className="relative">
              <input
                type="date"
                value={form.enrollDate}
                onChange={(event) => updateField('enrollDate', event.target.value)}
                required
                className={`${fieldClass} pr-10`}
              />
              <CalendarDays
                size={17}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>
          </Field>

          <Field label="Công nợ (debt)">
            <input
              type="number"
              min={0}
              value={form.debt}
              onChange={(event) => {
                setUserTouchedDebt(true);
                updateField('debt', event.target.value);
              }}
              className={fieldClass}
              placeholder="Bỏ trống để theo trạng thái học phí"
            />
          </Field>

          <Field label="Số tuần còn lại (weekLeft)">
            <input
              type="number"
              min={1}
              value={form.weekLeft}
              onChange={(event) => updateField('weekLeft', event.target.value)}
              className={fieldClass}
              placeholder="Mặc định bằng numberOfWeek"
            />
          </Field>

          <Field label="Tuần bắt đầu (periodStartWeek)">
            <input
              type="number"
              min={1}
              value={form.periodStartWeek}
              onChange={(event) => updateField('periodStartWeek', event.target.value)}
              className={fieldClass}
              placeholder="Tự dò từ StudyWeek nếu bỏ trống"
            />
          </Field>

          <Field label="Timetable template (UUID)">
            <input
              value={form.timetableTemplateId}
              onChange={(event) => updateField('timetableTemplateId', event.target.value)}
              className={fieldClass}
              placeholder="UUID (tuỳ chọn)"
            />
          </Field>

          <label className="sm:col-span-2 space-y-2">
            <span className={labelClass}>Ghi chú</span>
            <textarea
              value={form.note}
              onChange={(event) => updateField('note', event.target.value)}
              rows={2}
              className={`${fieldClass} h-auto py-2`}
              placeholder="Ghi chú cho period..."
            />
          </label>

          <label className="sm:col-span-2 inline-flex items-center gap-2 text-[13px] font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={form.useStudyWeekStartDate}
              onChange={(event) => updateField('useStudyWeekStartDate', event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-[#1870FF] focus:ring-[#1870FF]"
            />
            <span>
              Dùng Chủ nhật của tuần chứa <code className="rounded bg-slate-100 px-1">enrollDate</code> làm ngày hiệu lực
            </span>
          </label>
        </div>

        {error ? <p className="mt-4 text-[13px] font-semibold text-rose-600">{error}</p> : null}

        <div className="mt-6 flex items-center justify-end gap-3">
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
            {isPending ? 'Đang lưu...' : isCreate ? 'Tạo period' : 'Lưu thay đổi'}
          </button>
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

function formatTuition(value: number | undefined) {
  if (value == null) return '—';
  return value.toLocaleString('vi-VN') + 'đ';
}
