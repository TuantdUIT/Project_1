import { BookOpen, GraduationCap, Hourglass, Users, type LucideIcon } from 'lucide-react';

type StatsCardsProps = {
  totalStudents: number;
  waitingStudents: number;
  totalGrades: number;
  totalLessonTypes: number;
};

type CardConfig = {
  icon: LucideIcon;
  label: string;
  value: number;
  tone: string;
};

export default function StatsCards({
  totalStudents,
  waitingStudents,
  totalGrades,
  totalLessonTypes,
}: StatsCardsProps) {
  const cards: CardConfig[] = [
    {
      icon: Users,
      label: 'Học sinh đang học',
      value: totalStudents,
      tone: 'bg-[rgba(24,112,255,0.1)] text-[#1870FF]',
    },
    {
      icon: Hourglass,
      label: 'Chờ duyệt',
      value: waitingStudents,
      tone: 'bg-amber-100 text-amber-600',
    },
    {
      icon: GraduationCap,
      label: 'Số khối',
      value: totalGrades,
      tone: 'bg-emerald-100 text-emerald-600',
    },
    {
      icon: BookOpen,
      label: 'Loại bài học',
      value: totalLessonTypes,
      tone: 'bg-violet-100 text-violet-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_16px_36px_rgba(15,23,42,0.24)]"
        >
          <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${card.tone}`}>
            <card.icon size={24} />
          </div>
          <p className="mb-1 text-sm font-medium text-slate-500">{card.label}</p>
          <h3 className="text-3xl font-black text-slate-900">{card.value}</h3>
        </div>
      ))}
    </div>
  );
}
