import { type FormEvent, useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Edit3,
  ExternalLink,
  FileText,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';
import { useGradesQuery } from '@/features/Management_Services/curriculum/api/grades';
import { useStudyWeeksQuery } from '@/features/Management_Services/study-week';
import {
  useCreateLearningFile,
  useCreateOnlineLecture,
  useDeleteLearningFile,
  useDeleteOnlineLecture,
  useLearningFilesQuery,
  useOnlineLecturesQuery,
  useUpdateLearningFile,
  useUpdateOnlineLecture,
} from '@/features/Management_Services/learning-resource/api/learning-resources';
import type {
  LearningFile,
  OnlineLecture,
  ReqCreateLearningFileDTO,
  ReqCreateOnlineLectureDTO,
  ReqUpdateLearningFileDTO,
  ReqUpdateOnlineLectureDTO,
} from '@/features/Management_Services/learning-resource/types';
import { formatDate, formatDateShort, formatDateTime } from '@/utils/date';
import { parseApiError } from '@/utils/api-errors';

const fieldClass =
  'h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-[14px] font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1870FF] focus:ring-4 focus:ring-[rgba(24,112,255,0.14)]';

type LectureModalState =
  | { mode: 'create' }
  | { mode: 'edit'; lecture: OnlineLecture }
  | null;

type FileModalState =
  | { mode: 'create' }
  | { mode: 'edit'; file: LearningFile }
  | null;

type LectureFormState = {
  studyWeekId: string;
  gradeId: string;
  name: string;
  overview: string;
  link: string;
  validFrom: string;
  validTo: string;
};

type FileFormState = {
  gradeId: string;
  name: string;
  overview: string;
  chapter: string;
  link: string;
  validFrom: string;
  validTo: string;
};

function buildLectureForm(lecture?: OnlineLecture): LectureFormState {
  return {
    studyWeekId: lecture?.study_week?.week_uuid ?? '',
    gradeId: lecture?.grade?.id != null ? String(lecture.grade.id) : '',
    name: lecture?.lecture_name ?? '',
    overview: lecture?.lecture_overview ?? '',
    link: lecture?.lecture_link ?? '',
    validFrom: lecture?.lecture_valid_from ?? '',
    validTo: lecture?.lecture_valid_to ?? '',
  };
}

function buildFileForm(file?: LearningFile): FileFormState {
  return {
    gradeId: file?.grade?.id != null ? String(file.grade.id) : '',
    name: file?.file_name ?? '',
    overview: file?.file_overview ?? '',
    chapter: file?.chapter ?? '',
    link: file?.file_link ?? '',
    validFrom: file?.file_valid_from ?? '',
    validTo: file?.file_valid_to ?? '',
  };
}

function getWeekLabel(lecture: OnlineLecture) {
  const week = lecture.study_week;
  if (!week) return 'Chưa gắn tuần học';
  return `Tuần ${week.week_number ?? '-'} (${formatDateShort(week.week_start_date)} - ${formatDateShort(week.week_end_date)})`;
}

function getGroupLabel(week: NonNullable<OnlineLecture['study_week']>) {
  return `Tuần ${week.week_number ?? '-'} (${formatDateShort(week.week_start_date)} - ${formatDateShort(week.week_end_date)})`;
}

function openExternalLink(url?: string | null) {
  if (!url) return;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export default function LearningResourceManagement() {
  const lecturesQuery = useOnlineLecturesQuery();
  const filesQuery = useLearningFilesQuery();
  const [lectureModal, setLectureModal] = useState<LectureModalState>(null);
  const [fileModal, setFileModal] = useState<FileModalState>(null);
  const [selectedWeekUuid, setSelectedWeekUuid] = useState('');
  const [pageError, setPageError] = useState('');
  const deleteLectureMutation = useDeleteOnlineLecture();
  const deleteFileMutation = useDeleteLearningFile();

  const lectureGroups = useMemo(() => {
    const groups = new Map<
      string,
      {
        week: NonNullable<OnlineLecture['study_week']>;
        items: OnlineLecture[];
      }
    >();

    for (const lecture of lecturesQuery.data ?? []) {
      const week = lecture.study_week;
      if (!week?.week_uuid) continue;
      if (!groups.has(week.week_uuid)) {
        groups.set(week.week_uuid, { week, items: [] });
      }
      groups.get(week.week_uuid)?.items.push(lecture);
    }

    return groups;
  }, [lecturesQuery.data]);

  const weekOptions = useMemo(
    () =>
      [...lectureGroups.values()]
        .map((group) => group.week)
        .sort((a, b) => (b.week_number ?? 0) - (a.week_number ?? 0)),
    [lectureGroups],
  );

  useEffect(() => {
    const hasCurrent = selectedWeekUuid && lectureGroups.has(selectedWeekUuid);
    if (hasCurrent) return;
    setSelectedWeekUuid(weekOptions[0]?.week_uuid ?? '');
  }, [lectureGroups, selectedWeekUuid, weekOptions]);

  const selectedWeekLectures = selectedWeekUuid
    ? lectureGroups.get(selectedWeekUuid)?.items ?? []
    : [];

  const sortedFiles = useMemo(
    () =>
      [...(filesQuery.data ?? [])].sort(
        (a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime(),
      ),
    [filesQuery.data],
  );

  async function handleDeleteLecture(lecture: OnlineLecture) {
    if (!lecture.lecture_uuid) return;
    const ok = window.confirm(`Xóa bài giảng "${lecture.lecture_name ?? 'không tên'}"?`);
    if (!ok) return;

    try {
      setPageError('');
      await deleteLectureMutation.mutateAsync(lecture.lecture_uuid);
    } catch (error) {
      setPageError(parseApiError(error).message);
    }
  }

  async function handleDeleteFile(file: LearningFile) {
    if (!file.file_uuid) return;
    const ok = window.confirm(`Xóa tài liệu "${file.file_name ?? 'không tên'}"?`);
    if (!ok) return;

    try {
      setPageError('');
      await deleteFileMutation.mutateAsync(file.file_uuid);
    } catch (error) {
      setPageError(parseApiError(error).message);
    }
  }

  return (
    <div className="space-y-6">
      {pageError ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] font-bold text-rose-700">
          {pageError}
        </p>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
           
            <h2 className="mt-1 text-[22px] font-extrabold text-slate-950">Bài giảng online</h2>
            <p className="mt-2 text-[14px] font-medium text-slate-500">
              Nhóm theo study week, đổi tuần ngay trên client không gọi lại API.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={selectedWeekUuid}
              onChange={(event) => setSelectedWeekUuid(event.target.value)}
              className={`${fieldClass} min-w-[260px]`}
            >
              <option value="">Chọn tuần học</option>
              {weekOptions.map((week) => (
                <option key={week.week_uuid} value={week.week_uuid ?? ''}>
                  {getGroupLabel(week)}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setLectureModal({ mode: 'create' })}
              className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#1870FF] px-5 text-[14px] font-extrabold text-white shadow-[0_12px_22px_rgba(24,112,255,0.26)] transition hover:brightness-105"
            >
              <Plus size={18} />
              Thêm bài giảng
            </button>
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left">
              <thead className="bg-slate-50 text-[12px] font-black uppercase tracking-[0.08em] text-slate-500">
                <tr>
                  <th className="px-5 py-4">Bài giảng</th>
                  <th className="px-5 py-4">Khối</th>
                  <th className="px-5 py-4">Thời gian hiệu lực</th>
                  <th className="px-5 py-4">Tạo lúc</th>
                  <th className="px-5 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {selectedWeekLectures.map((lecture) => (
                  <tr key={lecture.lecture_uuid} className="hover:bg-slate-50">
                    <td className="px-5 py-4 align-top">
                      <div className="max-w-[420px]">
                        <p className="text-[14px] font-black text-slate-950">
                          {lecture.lecture_name ?? 'Chưa có tiêu đề'}
                        </p>
                        <p className="mt-1 text-[12px] font-bold text-slate-400">
                          {getWeekLabel(lecture)}
                        </p>
                        {lecture.lecture_overview ? (
                          <p className="mt-2 text-[13px] font-medium text-slate-600">
                            {lecture.lecture_overview}
                          </p>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-[13px] font-bold text-slate-600">
                      {lecture.grade?.name ?? '-'}
                    </td>
                    <td className="px-5 py-4 text-[13px] font-semibold text-slate-500">
                      {formatDate(lecture.lecture_valid_from)} - {formatDate(lecture.lecture_valid_to)}
                    </td>
                    <td className="px-5 py-4 text-[13px] font-semibold text-slate-500">
                      {formatDateTime(lecture.created_at, '-')}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openExternalLink(lecture.lecture_link)}
                          className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-[13px] font-extrabold text-slate-600 transition hover:border-[#1870FF] hover:text-[#1870FF]"
                        >
                          <ExternalLink size={15} />
                          Mở link
                        </button>
                        <button
                          type="button"
                          onClick={() => setLectureModal({ mode: 'edit', lecture })}
                          className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-[13px] font-extrabold text-slate-600 transition hover:border-[#1870FF] hover:text-[#1870FF]"
                        >
                          <Edit3 size={15} />
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteLecture(lecture)}
                          className="inline-flex h-9 items-center gap-2 rounded-lg border border-rose-200 px-3 text-[13px] font-extrabold text-rose-600 transition hover:bg-rose-50"
                        >
                          <Trash2 size={15} />
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {lecturesQuery.isLoading ? (
            <p className="px-5 py-6 text-center text-[14px] font-semibold text-slate-500">
              Đang tải bài giảng...
            </p>
          ) : null}

          {lecturesQuery.isError ? (
            <p className="px-5 py-6 text-center text-[14px] font-semibold text-rose-600">
              Không tải được danh sách bài giảng.
            </p>
          ) : null}

          {!lecturesQuery.isLoading && !lecturesQuery.isError && !weekOptions.length ? (
            <p className="px-5 py-6 text-center text-[14px] font-semibold text-slate-500">
              Chưa có bài giảng online nào.
            </p>
          ) : null}

          {!lecturesQuery.isLoading
          && !lecturesQuery.isError
          && weekOptions.length > 0
          && selectedWeekUuid
          && !selectedWeekLectures.length ? (
            <p className="px-5 py-6 text-center text-[14px] font-semibold text-slate-500">
              Tuần này chưa có bài giảng.
            </p>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
           
            <h2 className="mt-1 text-[22px] font-extrabold text-slate-950">Tài liệu</h2>
            <p className="mt-2 text-[14px] font-medium text-slate-500">
              Sắp xếp mới đến cũ theo thời điểm tạo, không nhóm theo tuần.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setFileModal({ mode: 'create' })}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#1870FF] px-4 text-[14px] font-extrabold text-white shadow-[0_12px_22px_rgba(24,112,255,0.26)] transition hover:brightness-105"
          >
            <Plus size={18} />
            Thêm tài liệu
          </button>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left">
              <thead className="bg-slate-50 text-[12px] font-black uppercase tracking-[0.08em] text-slate-500">
                <tr>
                  <th className="px-5 py-4">Tài liệu</th>
                  <th className="px-5 py-4">Khối</th>
                  <th className="px-5 py-4">Chương</th>
                  <th className="px-5 py-4">Tạo lúc</th>
                  <th className="px-5 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {sortedFiles.map((file) => (
                  <tr key={file.file_uuid} className="hover:bg-slate-50">
                    <td className="px-5 py-4 align-top">
                      <div className="max-w-[420px]">
                        <p className="text-[14px] font-black text-slate-950">
                          {file.file_name ?? 'Chưa có tiêu đề'}
                        </p>
                        {file.file_overview ? (
                          <p className="mt-2 text-[13px] font-medium text-slate-600">
                            {file.file_overview}
                          </p>
                        ) : null}
                        <p className="mt-2 text-[12px] font-semibold text-slate-400">
                          Hiệu lực: {formatDate(file.file_valid_from)} - {formatDate(file.file_valid_to)}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-[13px] font-bold text-slate-600">
                      {file.grade?.name ?? '-'}
                    </td>
                    <td className="px-5 py-4 text-[13px] font-semibold text-slate-500">
                      {file.chapter ?? '-'}
                    </td>
                    <td className="px-5 py-4 text-[13px] font-semibold text-slate-500">
                      {formatDateTime(file.created_at, '-')}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openExternalLink(file.file_link)}
                          className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-[13px] font-extrabold text-slate-600 transition hover:border-[#1870FF] hover:text-[#1870FF]"
                        >
                          <ExternalLink size={15} />
                          Mở link
                        </button>
                        <button
                          type="button"
                          onClick={() => setFileModal({ mode: 'edit', file })}
                          className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-[13px] font-extrabold text-slate-600 transition hover:border-[#1870FF] hover:text-[#1870FF]"
                        >
                          <Edit3 size={15} />
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteFile(file)}
                          className="inline-flex h-9 items-center gap-2 rounded-lg border border-rose-200 px-3 text-[13px] font-extrabold text-rose-600 transition hover:bg-rose-50"
                        >
                          <Trash2 size={15} />
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filesQuery.isLoading ? (
            <p className="px-5 py-6 text-center text-[14px] font-semibold text-slate-500">
              Đang tải tài liệu...
            </p>
          ) : null}

          {filesQuery.isError ? (
            <p className="px-5 py-6 text-center text-[14px] font-semibold text-rose-600">
              Không tải được danh sách tài liệu.
            </p>
          ) : null}

          {!filesQuery.isLoading && !filesQuery.isError && !sortedFiles.length ? (
            <p className="px-5 py-6 text-center text-[14px] font-semibold text-slate-500">
              Chưa có tài liệu nào.
            </p>
          ) : null}
        </div>
      </section>

      {lectureModal ? (
        <LectureFormModal modal={lectureModal} onClose={() => setLectureModal(null)} />
      ) : null}

      {fileModal ? <LearningFileFormModal modal={fileModal} onClose={() => setFileModal(null)} /> : null}
    </div>
  );
}

function LectureFormModal({
  modal,
  onClose,
}: {
  modal: Exclude<LectureModalState, null>;
  onClose: () => void;
}) {
  const isCreate = modal.mode === 'create';
  const [form, setForm] = useState(buildLectureForm(isCreate ? undefined : modal.lecture));
  const [error, setError] = useState('');
  const createLectureMutation = useCreateOnlineLecture();
  const updateLectureMutation = useUpdateOnlineLecture();
  const studyWeeksQuery = useStudyWeeksQuery();
  const gradesQuery = useGradesQuery();
  const isPending = createLectureMutation.isPending || updateLectureMutation.isPending;

  function updateField<K extends keyof LectureFormState>(key: K, value: LectureFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function buildPayload(): ReqCreateOnlineLectureDTO | ReqUpdateOnlineLectureDTO | null {
    const name = form.name.trim();
    const link = form.link.trim();
    const overview = form.overview.trim();
    const gradeId = form.gradeId ? Number(form.gradeId) : null;

    if (!form.studyWeekId) {
      setError('Vui lòng chọn tuần học.');
      return null;
    }
    if (!gradeId) {
      setError('Vui lòng chọn khối.');
      return null;
    }
    if (!name) {
      setError('Vui lòng nhập tên bài giảng.');
      return null;
    }
    if (!link) {
      setError('Vui lòng nhập link bài giảng.');
      return null;
    }
    if (!form.validFrom || !form.validTo) {
      setError('Vui lòng nhập đầy đủ ngày hiệu lực.');
      return null;
    }
    if (new Date(form.validTo).getTime() < new Date(form.validFrom).getTime()) {
      setError('Ngày kết thúc không được nhỏ hơn ngày bắt đầu.');
      return null;
    }

    return {
      studyWeekId: form.studyWeekId,
      gradeId,
      name,
      overview: overview || undefined,
      link,
      validFrom: form.validFrom,
      validTo: form.validTo,
    };
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    const payload = buildPayload();
    if (!payload) return;

    try {
      if (isCreate) {
        await createLectureMutation.mutateAsync(payload as ReqCreateOnlineLectureDTO);
      } else if (modal.lecture.lecture_uuid) {
        await updateLectureMutation.mutateAsync({
          lectureUuid: modal.lecture.lecture_uuid,
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
      <form
        onSubmit={handleSubmit}
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
      >
        <ModalHeader
          eyebrow="Bài giảng online"
          title={isCreate ? 'Thêm bài giảng' : 'Sửa bài giảng'}
          icon={<BookOpen size={18} />}
          onClose={onClose}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Tuần học" required>
            <select
              value={form.studyWeekId}
              onChange={(event) => updateField('studyWeekId', event.target.value)}
              className={fieldClass}
            >
              <option value="">Chọn tuần học</option>
              {(studyWeeksQuery.data ?? [])
                .sort((a, b) => (b.week_number ?? 0) - (a.week_number ?? 0))
                .map((week) => (
                  <option key={week.week_uuid} value={week.week_uuid ?? ''}>
                    Tuần {week.week_number ?? '-'} ({formatDateShort(week.week_start_date)} - {formatDateShort(week.week_end_date)})
                  </option>
                ))}
            </select>
          </Field>

          <Field label="Khối" required>
            <select
              value={form.gradeId}
              onChange={(event) => updateField('gradeId', event.target.value)}
              className={fieldClass}
            >
              <option value="">Chọn khối</option>
              {(gradesQuery.data?.grades ?? []).map((grade) => (
                <option key={grade.id} value={grade.id ?? ''}>
                  {grade.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Tên bài giảng" required>
            <input value={form.name} onChange={(event) => updateField('name', event.target.value)} className={fieldClass} />
          </Field>

          <Field label="Link bài giảng" required>
            <input value={form.link} onChange={(event) => updateField('link', event.target.value)} className={fieldClass} />
          </Field>

          <Field label="Hiệu lực từ" required>
            <input type="date" value={form.validFrom} onChange={(event) => updateField('validFrom', event.target.value)} className={fieldClass} />
          </Field>

          <Field label="Hiệu lực đến" required>
            <input type="date" value={form.validTo} onChange={(event) => updateField('validTo', event.target.value)} className={fieldClass} />
          </Field>

          <Field label="Mô tả">
            <textarea
              value={form.overview}
              onChange={(event) => updateField('overview', event.target.value)}
              className="min-h-28 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-[14px] font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1870FF] focus:ring-4 focus:ring-[rgba(24,112,255,0.14)]"
            />
          </Field>
        </div>

        {error ? (
          <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-[13px] font-bold text-rose-700">{error}</p>
        ) : null}

        <ModalActions
          isPending={isPending}
          submitLabel={isCreate ? 'Tạo bài giảng' : 'Lưu thay đổi'}
          onClose={onClose}
        />
      </form>
    </div>
  );
}

function LearningFileFormModal({
  modal,
  onClose,
}: {
  modal: Exclude<FileModalState, null>;
  onClose: () => void;
}) {
  const isCreate = modal.mode === 'create';
  const [form, setForm] = useState(buildFileForm(isCreate ? undefined : modal.file));
  const [error, setError] = useState('');
  const createFileMutation = useCreateLearningFile();
  const updateFileMutation = useUpdateLearningFile();
  const gradesQuery = useGradesQuery();
  const isPending = createFileMutation.isPending || updateFileMutation.isPending;

  function updateField<K extends keyof FileFormState>(key: K, value: FileFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function buildPayload(): ReqCreateLearningFileDTO | ReqUpdateLearningFileDTO | null {
    const name = form.name.trim();
    const link = form.link.trim();
    const overview = form.overview.trim();
    const chapter = form.chapter.trim();
    const gradeId = form.gradeId ? Number(form.gradeId) : null;

    if (!gradeId) {
      setError('Vui lòng chọn khối.');
      return null;
    }
    if (!name) {
      setError('Vui lòng nhập tên tài liệu.');
      return null;
    }
    if (!link) {
      setError('Vui lòng nhập link tài liệu.');
      return null;
    }
    if (!form.validFrom || !form.validTo) {
      setError('Vui lòng nhập đầy đủ ngày hiệu lực.');
      return null;
    }
    if (new Date(form.validTo).getTime() < new Date(form.validFrom).getTime()) {
      setError('Ngày kết thúc không được nhỏ hơn ngày bắt đầu.');
      return null;
    }

    return {
      gradeId,
      name,
      overview: overview || undefined,
      chapter: chapter || undefined,
      link,
      validFrom: form.validFrom,
      validTo: form.validTo,
    };
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    const payload = buildPayload();
    if (!payload) return;

    try {
      if (isCreate) {
        await createFileMutation.mutateAsync(payload as ReqCreateLearningFileDTO);
      } else if (modal.file.file_uuid) {
        await updateFileMutation.mutateAsync({
          fileUuid: modal.file.file_uuid,
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
      <form
        onSubmit={handleSubmit}
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
      >
        <ModalHeader
          eyebrow="Tài liệu"
          title={isCreate ? 'Thêm tài liệu' : 'Sửa tài liệu'}
          icon={<FileText size={18} />}
          onClose={onClose}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Khối" required>
            <select
              value={form.gradeId}
              onChange={(event) => updateField('gradeId', event.target.value)}
              className={fieldClass}
            >
              <option value="">Chọn khối</option>
              {(gradesQuery.data?.grades ?? []).map((grade) => (
                <option key={grade.id} value={grade.id ?? ''}>
                  {grade.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Tên tài liệu" required>
            <input value={form.name} onChange={(event) => updateField('name', event.target.value)} className={fieldClass} />
          </Field>

          <Field label="Link tài liệu" required>
            <input value={form.link} onChange={(event) => updateField('link', event.target.value)} className={fieldClass} />
          </Field>

          <Field label="Chương">
            <input value={form.chapter} onChange={(event) => updateField('chapter', event.target.value)} className={fieldClass} />
          </Field>

          <Field label="Hiệu lực từ" required>
            <input type="date" value={form.validFrom} onChange={(event) => updateField('validFrom', event.target.value)} className={fieldClass} />
          </Field>

          <Field label="Hiệu lực đến" required>
            <input type="date" value={form.validTo} onChange={(event) => updateField('validTo', event.target.value)} className={fieldClass} />
          </Field>

          <Field label="Mô tả">
            <textarea
              value={form.overview}
              onChange={(event) => updateField('overview', event.target.value)}
              className="min-h-28 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-[14px] font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1870FF] focus:ring-4 focus:ring-[rgba(24,112,255,0.14)]"
            />
          </Field>
        </div>

        {error ? (
          <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-[13px] font-bold text-rose-700">{error}</p>
        ) : null}

        <ModalActions
          isPending={isPending}
          submitLabel={isCreate ? 'Tạo tài liệu' : 'Lưu thay đổi'}
          onClose={onClose}
        />
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

function ModalHeader({
  eyebrow,
  title,
  icon,
  onClose,
}: {
  eyebrow: string;
  title: string;
  icon: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <p className="inline-flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-[0.16em] text-[#1870FF]">
          {icon}
          {eyebrow}
        </p>
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
