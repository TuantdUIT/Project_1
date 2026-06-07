import { useMemo } from 'react';
import { BookOpen, ExternalLink, FileText, GraduationCap, Layers } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import {
  useStudentLearningFilesQuery,
  useStudentOnlineLecturesQuery,
} from '@/features/Management_Services/learning-resource/api/learning-resources';
import type {
  LearningFile,
  OnlineLecture,
} from '@/features/Management_Services/learning-resource/types';
import { formatDate, formatDateShort } from '@/utils/date';
import { openExternalLink } from '@/utils/url';

export default function LearningResourcesRoute() {
  const { user } = useAuth();
  const lecturesQuery = useStudentOnlineLecturesQuery(user?.id);
  const filesQuery = useStudentLearningFilesQuery(user?.id);

  const sortedLectures = useMemo(
    () =>
      [...(lecturesQuery.data ?? [])].sort(
        (a, b) => (b.study_week?.week_number ?? 0) - (a.study_week?.week_number ?? 0),
      ),
    [lecturesQuery.data],
  );

  const sortedFiles = useMemo(
    () =>
      [...(filesQuery.data ?? [])].sort(
        (a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime(),
      ),
    [filesQuery.data],
  );

  return (
    <div className="min-h-screen bg-[#f4f7fb]">
      <header className="border-b border-slate-200 bg-white px-4 py-5">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[rgba(24,112,255,0.1)] text-[#1870FF]">
            <Layers size={21} strokeWidth={2.6} />
          </span>
          <div>
            <p className="text-[12px] font-black uppercase tracking-[0.16em] text-slate-400">
              Học liệu
            </p>
            <h1 className="mt-1 text-[22px] font-black leading-tight text-slate-950">
              Tài liệu &amp; bài giảng của tôi
            </h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        {/* Bài giảng online */}
        <Section
          icon={<BookOpen size={18} />}
          eyebrow="Bài giảng online"
          title="Bài giảng online"
          description="Chỉ hiển thị bài giảng thuộc khối bạn đang học và còn trong thời gian hiệu lực."
        >
          {lecturesQuery.isLoading ? (
            <LoadingRow label="Đang tải bài giảng..." />
          ) : lecturesQuery.isError ? (
            <ErrorRow label="Không tải được danh sách bài giảng." />
          ) : !sortedLectures.length ? (
            <EmptyRow label="Chưa có bài giảng online nào dành cho bạn." />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {sortedLectures.map((lecture) => (
                <LectureCard key={lecture.lecture_uuid} lecture={lecture} />
              ))}
            </div>
          )}
        </Section>

        {/* Tài liệu học tập */}
        <Section
          icon={<FileText size={18} />}
          eyebrow="Tài liệu"
          title="Tài liệu học tập"
          description="Tài liệu được sắp xếp từ mới đến cũ, đã lọc theo khối và thời hạn truy cập của bạn."
        >
          {filesQuery.isLoading ? (
            <LoadingRow label="Đang tải tài liệu..." />
          ) : filesQuery.isError ? (
            <ErrorRow label="Không tải được danh sách tài liệu." />
          ) : !sortedFiles.length ? (
            <EmptyRow label="Chưa có tài liệu nào dành cho bạn." />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {sortedFiles.map((file) => (
                <FileCard key={file.file_uuid} file={file} />
              ))}
            </div>
          )}
        </Section>
      </main>
    </div>
  );
}

function LectureCard({ lecture }: { lecture: OnlineLecture }) {
  const week = lecture.study_week;
  return (
    <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <GradeBadge name={lecture.grade?.name} />
        {week ? (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-500">
            Tuần {week.week_number ?? '-'} ({formatDateShort(week.week_start_date)} -{' '}
            {formatDateShort(week.week_end_date)})
          </span>
        ) : null}
      </div>
      <h3 className="text-[15px] font-black text-slate-950">
        {lecture.lecture_name ?? 'Chưa có tiêu đề'}
      </h3>
      {lecture.lecture_overview ? (
        <p className="mt-2 line-clamp-3 text-[13px] font-medium text-slate-600">
          {lecture.lecture_overview}
        </p>
      ) : null}
      <p className="mt-3 text-[12px] font-semibold text-slate-400">
        Hiệu lực: {formatDate(lecture.lecture_valid_from)} - {formatDate(lecture.lecture_valid_to)}
      </p>
      <OpenLinkButton url={lecture.lecture_link} label="Xem bài giảng" />
    </article>
  );
}

function FileCard({ file }: { file: LearningFile }) {
  return (
    <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <GradeBadge name={file.grade?.name} />
        {file.chapter ? (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-500">
            {file.chapter}
          </span>
        ) : null}
      </div>
      <h3 className="text-[15px] font-black text-slate-950">
        {file.file_name ?? 'Chưa có tiêu đề'}
      </h3>
      {file.file_overview ? (
        <p className="mt-2 line-clamp-3 text-[13px] font-medium text-slate-600">
          {file.file_overview}
        </p>
      ) : null}
      <p className="mt-3 text-[12px] font-semibold text-slate-400">
        Hiệu lực: {formatDate(file.file_valid_from)} - {formatDate(file.file_valid_to)}
      </p>
      <OpenLinkButton url={file.file_link} label="Mở tài liệu" />
    </article>
  );
}

function GradeBadge({ name }: { name?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-[#1870FF]/10 px-2 py-0.5 text-[11px] font-black uppercase text-[#1870FF]">
      <GraduationCap size={12} strokeWidth={2.7} />
      {name ?? '-'}
    </span>
  );
}

function OpenLinkButton({ url, label }: { url?: string | null; label: string }) {
  return (
    <button
      type="button"
      disabled={!url}
      onClick={() => openExternalLink(url)}
      className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#1870FF] px-4 text-[13px] font-extrabold text-white shadow-[0_12px_22px_rgba(24,112,255,0.26)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <ExternalLink size={15} />
      {label}
    </button>
  );
}

function Section({
  icon,
  eyebrow,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <p className="inline-flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-[0.16em] text-[#1870FF]">
          {icon}
          {eyebrow}
        </p>
        <h2 className="mt-1 text-[20px] font-extrabold text-slate-950">{title}</h2>
        <p className="mt-1 text-[13px] font-medium text-slate-500">{description}</p>
      </div>
      {children}
    </section>
  );
}

function LoadingRow({ label }: { label: string }) {
  return <p className="py-6 text-center text-[14px] font-semibold text-slate-500">{label}</p>;
}

function ErrorRow({ label }: { label: string }) {
  return <p className="py-6 text-center text-[14px] font-semibold text-rose-600">{label}</p>;
}

function EmptyRow({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
      <p className="text-[14px] font-bold text-slate-600">{label}</p>
    </div>
  );
}
