import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  Edit3,
  FileText,
  List,
  MessageCircle,
  PlayCircle,
  Star,
  Target,
  Users,
} from 'lucide-react';
import { paths } from '@/config/paths';
import foundation12Data from './K12/foundation_12.json';
import advance12Data from './K12/Advance_12.json';
import strategy12Data from './K12/Strategy_12.json';
import foundation11Data from './K11/foundation_11.json';
import advance11Data from './K11/Advance_11.json';
import strategy11Data from './K11/Strategy_11.json';
import foundation10Data from './K10/foundation_10.json';
import advance10Data from './K10/Advance_10.json';
import strategy10Data from './K10/Strategy_10.json';

type CourseWeekItem = {
  type: string;
  title: string;
  duration?: string;
  format?: string;
  required?: boolean;
};

type CourseWeek = {
  index: number;
  title: string;
  stats: Record<string, number | undefined>;
  items: CourseWeekItem[];
};

type CourseData = {
  course: {
    id: string;
    title: string;
    status: string;
    rating: { score: number; count: number };
    description: string;
    descriptionHighlight: string;
    price: { current: number; original: number; discountPercent: number; currency: string };
    cta: { primary: string; secondary: string };
    cover: {
      audience: string;
      headline: string;
      letter: string;
      fullName: string;
      caption: string;
      brand: string;
    };
    instructor: { title: string; name: string; avatar: string };
    knowledgeContent: { icon: string; label: string; detail: string }[];
    learningFormat: { icon: string; label: string; detail: string }[];
    weeks: CourseWeek[];
  };
};

const COURSE_DATA_MAP: Record<string, CourseData> = {
  '12::F': foundation12Data as CourseData,
  '12::A': advance12Data as CourseData,
  '12::S': strategy12Data as CourseData,
  '11::F': foundation11Data as CourseData,
  '11::A': advance11Data as CourseData,
  '11::S': strategy11Data as CourseData,
  '10::F': foundation10Data as CourseData,
  '10::A': advance10Data as CourseData,
  '10::S': strategy10Data as CourseData,
};

const GRADE_COVER_GRADIENT: Record<string, { from: string; to: string }> = {
  '10': { from: '#15803D', to: '#166534' },
  '11': { from: '#FF4500', to: '#C2410C' },
  '12': { from: '#0369A1', to: '#075985' },
};

type IconKey = 'target' | 'book' | 'list' | 'users' | 'edit' | 'message-circle';

const iconMap: Record<IconKey, React.ComponentType<{ size?: number; className?: string }>> = {
  target: Target,
  book: BookOpen,
  list: List,
  users: Users,
  edit: Edit3,
  'message-circle': MessageCircle,
};

function renderIcon(key: string) {
  const Icon = iconMap[key as IconKey] ?? Target;
  return <Icon size={18} className="mt-0.5 shrink-0 text-indigo-deep" />;
}

function formatPrice(value: number) {
  return value.toLocaleString('vi-VN');
}

function buildWeekMeta(stats: Record<string, number | undefined>) {
  const parts: string[] = [];
  if (stats.lessons) parts.push(`${stats.lessons} BÀI GIẢNG`);
  if (stats.documents) parts.push(`${stats.documents} TÀI LIỆU`);
  if (stats.reviews) parts.push(`REVIEW ${stats.reviews}`);
  if (stats.exams) parts.push(`${stats.exams} BÀI THI`);
  if (stats.mockExams) parts.push(`${stats.mockExams} BÀI THI THỬ`);
  if (stats.duration) parts.push(`${stats.duration} PHÚT`);
  return parts;
}

export default function CourseDetailRoute() {
  const navigate = useNavigate();
  const { gradeId, lessonTypeId } = useParams();
  const [openWeek, setOpenWeek] = useState<number | null>(1);

  const courseData = gradeId && lessonTypeId ? COURSE_DATA_MAP[`${gradeId}::${lessonTypeId}`] : undefined;
  const course = courseData?.course;
  const coverGradient = (gradeId ? GRADE_COVER_GRADIENT[gradeId] : undefined) ?? GRADE_COVER_GRADIENT['12'];

  const totalLessons = useMemo(
    () =>
      course?.weeks.reduce(
        (sum, week) => sum + (week.stats.lessons ?? 0) + (week.stats.exams ?? 0),
        0,
      ) ?? 0,
    [course?.weeks],
  );

  if (!course) {
    return (
      <div className="min-h-screen bg-surface-container-lowest pb-20">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate(-1)}
            className="mb-6 inline-flex items-center text-sm font-medium text-on-surface-variant transition-colors hover:text-indigo-deep"
          >
            <ArrowLeft size={18} className="mr-2" />
            Quay lại danh sách khóa học
          </button>
          <div className="rounded-2xl border border-dashed border-outline-variant bg-white p-10 text-center shadow-academic-sm">
            <h1 className="mb-3 text-2xl font-black text-on-surface">
              Nội dung khóa học đang được cập nhật
            </h1>
            <p className="mb-6 text-on-surface-variant">
              Hiện chỉ có khóa <strong className="font-bold text-on-surface">Foundation – Khối 12</strong>{' '}
              đã sẵn sàng để xem trước. Các khóa còn lại đang chờ backend cung cấp dữ liệu.
            </p>
            <Link
              to={paths.courseDetail(12, 'F')}
              className="btn-primary inline-flex items-center"
            >
              Xem khóa Foundation – Khối 12
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-container-lowest pb-20">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center text-sm font-medium text-on-surface-variant transition-colors hover:text-indigo-deep"
        >
          <ArrowLeft size={18} className="mr-2" />
          Quay lại danh sách khóa học
        </button>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
          <main className="space-y-8">
            <header>
              <div className="mb-3 flex flex-wrap items-center gap-3 text-sm">
                <span className="rounded-full bg-growth-green/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-growth-green">
                  {course.status}
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-on-surface-variant">
                  <Star size={14} className="fill-yellow-400 text-yellow-400" />
                  {course.rating.score}
                  <span className="text-on-surface-variant/70">({course.rating.count} đánh giá)</span>
                </span>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-on-surface sm:text-4xl">
                {course.title}
              </h1>
              <p className="mt-3 max-w-2xl text-base text-on-surface-variant">
                Khóa học xây dựng{' '}
                <strong className="font-bold text-on-surface">{course.descriptionHighlight}</strong>
                , giúp học sinh lấy lại căn bản và làm chủ toàn bộ kiến thức trọng tâm.
              </p>
            </header>

            <section>
              <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-on-surface">
                <BookOpen size={20} className="text-indigo-deep" />
                Nội dung bài học theo tuần
              </h2>
              <div className="space-y-3">
                {course.weeks.map((week) => {
                  const isOpen = openWeek === week.index;
                  const metaParts = buildWeekMeta(week.stats);
                  return (
                    <article
                      key={week.index}
                      className="overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-academic-sm"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenWeek(isOpen ? null : week.index)}
                        className="flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-surface-container-low"
                      >
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-deep text-sm font-black text-white">
                          {String(week.index).padStart(2, '0')}
                        </span>
                        <div className="flex-1">
                          <h3 className="text-base font-bold text-on-surface">
                            Tuần {week.index}: {week.title}
                          </h3>
                          {metaParts.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                              {metaParts.map((part, idx) => (
                                <span key={idx} className="inline-flex items-center gap-1">
                                  <PlayCircle size={12} />
                                  {part}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <ChevronDown
                          size={20}
                          className={`mt-1 shrink-0 text-on-surface-variant transition-transform ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      {isOpen && week.items.length > 0 && (
                        <ul className="divide-y divide-outline-variant border-t border-outline-variant">
                          {week.items.map((item, idx) => (
                            <li
                              key={idx}
                              className="flex items-center justify-between gap-3 px-5 py-3 text-sm text-on-surface"
                            >
                              <div className="flex items-center gap-3">
                                {item.type === 'video' ? (
                                  <PlayCircle size={18} className="text-indigo-deep" />
                                ) : (
                                  <FileText size={18} className="text-on-surface-variant" />
                                )}
                                <span>{item.title}</span>
                                {item.required && (
                                  <span className="rounded bg-action-orange px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                                    Bắt buộc
                                  </span>
                                )}
                              </div>
                              <span className="text-xs font-semibold text-on-surface-variant">
                                {item.type === 'video' ? item.duration : item.format}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {isOpen && week.items.length === 0 && (
                        <div className="border-t border-outline-variant px-5 py-4">
                          <p className="text-base font-bold text-on-surface-variant">
                            Nội dung đang được cập nhật
                          </p>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
              <p className="mt-4 text-xs text-on-surface-variant">
                Tổng cộng {totalLessons} bài giảng/đánh giá trong {course.weeks.length} tuần học.
              </p>
            </section>
          </main>

          <aside className="space-y-6">
            <div className="overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-academic-sm">
              <div
                className="relative flex flex-col items-center justify-center px-6 py-10 text-center text-white"
                style={{
                  background: `linear-gradient(135deg, ${coverGradient.from} 0%, ${coverGradient.to} 100%)`,
                }}
              >
                <span aria-hidden className="absolute right-5 top-5 h-5 w-5 rounded-full bg-white/25 blur-[2px]" />
                <p className="text-xs font-bold uppercase tracking-widest">{course.cover.brand}</p>
                <p className="mt-3 text-2xl font-black">{course.cover.audience}</p>
                <p className="text-lg font-bold uppercase tracking-wide">
                  {course.cover.headline}
                </p>
                <p className="my-3 font-serif text-[120px] leading-none">{course.cover.letter}</p>
                <p className="text-lg font-black uppercase">{course.cover.fullName}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-wider">
                  {course.cover.caption}
                </p>
              </div>

              <div className="space-y-4 p-6">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-black text-on-surface">
                    {formatPrice(course.price.current)}đ
                  </span>
                  <span className="text-sm italic text-on-surface-variant line-through">
                    {formatPrice(course.price.original)}đ
                  </span>
                  <span className="rounded-md bg-action-orange px-2 py-0.5 text-xs font-black text-white">
                    -{course.price.discountPercent}%
                  </span>
                </div>

                <button className="btn-primary w-full">{course.cta.primary}</button>
                <button className="w-full rounded-academic border-2 border-indigo-deep px-6 py-2.5 font-bold text-indigo-deep transition-colors hover:bg-secondary">
                  {course.cta.secondary}
                </button>

                <div>
                  <p className="micro-label mb-3 text-on-surface-variant">Nội dung kiến thức</p>
                  <ul className="space-y-3 text-sm text-on-surface-variant">
                    {course.knowledgeContent.map((item) => (
                      <li key={item.label} className="flex items-start gap-2">
                        {renderIcon(item.icon)}
                        <span>
                          <strong className="font-bold text-on-surface">{item.label}:</strong>{' '}
                          {item.detail}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="micro-label mb-3 text-on-surface-variant">Hình thức học</p>
                  <ul className="space-y-3 text-sm text-on-surface-variant">
                    {course.learningFormat.map((item) => (
                      <li key={item.label} className="flex items-start gap-2">
                        {renderIcon(item.icon)}
                        <span>
                          <strong className="font-bold text-on-surface">{item.label}:</strong>{' '}
                          {item.detail}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-outline-variant bg-white p-5 shadow-academic-sm">
              <p className="micro-label mb-3 text-on-surface-variant">
                {course.instructor.title}
              </p>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-secondary text-base font-black text-indigo-deep">
                  {course.instructor.avatar ? (
                    <img
                      src={course.instructor.avatar}
                      alt={course.instructor.name}
                      className="h-full w-full object-cover"
                      onError={(event) => {
                        event.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    course.instructor.name.charAt(0)
                  )}
                </div>
                <p className="font-bold text-on-surface">{course.instructor.name}</p>
              </div>
            </div>

            <Link
              to={paths.courses}
              className="block text-center text-sm font-semibold text-indigo-deep hover:underline"
            >
              Xem thêm khóa học khác
            </Link>
          </aside>
        </div>
      </div>
    </div>
  );
}
