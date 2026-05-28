import { useState } from 'react';
import { motion } from 'motion/react';
import mockCourses from '@/app/routes/app/mock_data_courses.json';

type FeaturedCoursesProps = {
  onCourseClick: (gradeId: number, lessonTypeId: string) => void;
};

type Tier = {
  key: string;
  letter: string;
  headline: string;
  fullName: string;
  caption: string;
  cardTitle: string;
  description: string;
};

type GradeOption = {
  key: string;
  gradeId: number;
  label: string;
  color: string;
};

const GRADE_OPTIONS: GradeOption[] = mockCourses.grades;
const GRADE_TIERS: Tier[] = mockCourses.tiers;
const DGNL = mockCourses.dgnl;
const DGNL_FILTER = DGNL.key;

export default function FeaturedCourses({ onCourseClick }: FeaturedCoursesProps) {
  const [filter, setFilter] = useState<string>(GRADE_OPTIONS[0]?.key ?? DGNL_FILTER);

  const activeGrade = filter !== DGNL_FILTER ? GRADE_OPTIONS.find((g) => g.key === filter) : undefined;

  function handleTierClick(tier: Tier) {
    if (filter === DGNL_FILTER) {
      onCourseClick(0, DGNL.tier.key);
      return;
    }
    if (!activeGrade) return;
    onCourseClick(activeGrade.gradeId, tier.key);
  }

  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="mb-6 text-3xl font-bold text-on-surface">Các khóa học tiêu biểu</h2>

        <div className="mb-10 flex flex-wrap items-center justify-center gap-2">
          {GRADE_OPTIONS.map((g) => {
            const isActive = g.key === filter;
            return (
              <button
                key={g.key}
                type="button"
                onClick={() => setFilter(g.key)}
                className={
                  isActive
                    ? 'rounded-full bg-indigo-deep px-5 py-1.5 text-sm font-bold text-white shadow-sm'
                    : 'rounded-full border border-indigo-deep/20 bg-white px-5 py-1.5 text-sm font-semibold text-indigo-deep transition-colors hover:bg-indigo-50'
                }
              >
                {g.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setFilter(DGNL_FILTER)}
            className={
              filter === DGNL_FILTER
                ? 'rounded-full bg-indigo-deep px-5 py-1.5 text-sm font-bold text-white shadow-sm'
                : 'rounded-full border border-indigo-deep/20 bg-white px-5 py-1.5 text-sm font-semibold text-indigo-deep transition-colors hover:bg-indigo-50'
            }
          >
            {DGNL.label}
          </button>
        </div>

        {filter === DGNL_FILTER ? (
          <div className="flex justify-center">
            <div className="w-full max-w-sm">
              <TierCard
                tier={DGNL.tier}
                gradeLabel={DGNL.label}
                color={DGNL.color}
                onClick={() => handleTierClick(DGNL.tier)}
              />
            </div>
          </div>
        ) : activeGrade ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {GRADE_TIERS.map((tier) => (
              <TierCard
                key={tier.key}
                tier={tier}
                gradeLabel={activeGrade.label}
                color={activeGrade.color}
                onClick={() => handleTierClick(tier)}
              />
            ))}
          </div>
        ) : (
          <p className="text-on-surface-variant">Chưa có khối học để hiển thị.</p>
        )}
      </div>
    </section>
  );
}

type TierCardProps = {
  tier: Tier;
  gradeLabel: string;
  color: string;
  onClick: () => void;
};

function TierCard({ tier, gradeLabel, color, onClick }: TierCardProps) {
  return (
    <motion.div whileHover={{ y: -8 }} className="card-surface flex h-full flex-col text-left">
      <div
        className="relative flex aspect-square flex-col items-center justify-center overflow-hidden p-6 text-center text-white"
        style={{ backgroundColor: color }}
      >
        <div className="absolute left-4 top-3 text-[10px] font-bold uppercase tracking-wider opacity-80">BHP Math</div>
        <div className="absolute right-4 top-4 h-5 w-5 rounded-full bg-white/25 blur-[2px]" />
        <div className="mb-1 text-sm font-bold opacity-90">{gradeLabel}</div>
        <div className="mb-1 text-base font-extrabold tracking-tight">{tier.headline}</div>
        <div className="my-2 text-[96px] font-black leading-none drop-shadow-2xl">{tier.letter}</div>
        <div className="text-sm font-bold uppercase tracking-wide">{tier.fullName}</div>
        <div className="mt-1 text-[10px] font-medium uppercase opacity-80">{tier.caption}</div>
      </div>

      <div className="flex flex-grow flex-col p-5">
        <div className="mb-3 flex flex-wrap gap-1.5">
          <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase text-indigo-deep">{gradeLabel}</span>
          <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase text-indigo-deep">{tier.letter}</span>
        </div>
        <h3 className="mb-2 text-base font-bold leading-tight text-on-surface">{tier.cardTitle}</h3>
        <p className="mb-5 line-clamp-3 flex-grow text-sm text-on-surface-variant">{tier.description}</p>
        <button
          type="button"
          onClick={onClick}
          className="w-full rounded-academic border border-indigo-deep/20 py-2.5 text-sm font-bold text-indigo-deep transition-colors hover:bg-indigo-50"
        >
          Xem chi tiết
        </button>
      </div>
    </motion.div>
  );
}
