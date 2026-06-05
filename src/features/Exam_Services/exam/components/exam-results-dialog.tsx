import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  X,
  Loader2,
  AlertCircle,
  FileBarChart,
  ShieldAlert,
  Download,
  Trophy,
  BarChart3,
} from 'lucide-react';
import {
  exportExamDashboard,
  useExamRankingQuery,
  useExamResultsQuery,
  useExamStatsQuery,
  type ExamDashboardKind,
} from '@/features/Exam_Services/exam/api/exams';
import { useAuth } from '@/lib/auth/auth-context';
import { parseApiError } from '@/utils/api-errors';

type Props = {
  isOpen: boolean;
  examUuid: string | null;
  examName?: string;
  onClose: () => void;
};

type DashboardTab = ExamDashboardKind;

const thCls = 'px-4 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap';
const tdCls = 'px-4 py-3 text-sm text-slate-600';
const tabCls =
  'px-4 py-2 rounded-xl text-sm font-bold transition-colors';
const activeTabCls = 'bg-blue-600 text-white shadow-sm shadow-blue-200';
const inactiveTabCls = 'text-slate-500 hover:bg-slate-100';

const SUBMIT_SOURCE_LABEL: Record<string, string> = {
  WEB: 'Trực tuyến',
  OMR_IMPORT: 'Quét phiếu',
};

const TAB_LABEL: Record<DashboardTab, string> = {
  stats: 'Thống kê',
  results: 'Kết quả',
  rankings: 'Xếp hạng',
};

function fmtScore(value?: number) {
  if (value === undefined || value === null) return '—';
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function parseTopN(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined;

  return Math.floor(parsed);
}

function EmptyState({ icon, message }: { icon: ReactNode; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-2 text-slate-400">
      {icon}
      <p className="text-sm font-bold">{message}</p>
    </div>
  );
}

function ErrorState({ error, fallback }: { error: unknown; fallback: string }) {
  const parsed = parseApiError(error);
  const message = parsed.status ? parsed.message : fallback;

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-2 text-red-400">
      <AlertCircle size={28} />
      <p className="text-sm font-bold">{message}</p>
    </div>
  );
}

function LoadingState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-20 gap-2 text-slate-400">
      <Loader2 size={20} className="animate-spin" />
      <span className="text-sm font-bold">{message}</span>
    </div>
  );
}

function RankingTable({
  title,
  emptyMessage,
  students,
}: {
  title: string;
  emptyMessage: string;
  students?: Array<{
    rank?: number;
    studentId?: string;
    fullname?: string;
    score?: number;
    userUuid?: string;
  }>;
}) {
  const rows = students ?? [];

  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden">
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
        <h4 className="text-sm font-black text-slate-800">{title}</h4>
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={<Trophy size={28} className="opacity-20" />} message={emptyMessage} />
      ) : (
        <table className="w-full text-left">
          <thead>
            <tr className="bg-white border-b border-slate-100">
              <th className={`${thCls} text-center w-20`}>Hạng</th>
              <th className={thCls}>Mã học sinh</th>
              <th className={thCls}>Họ tên</th>
              <th className={`${thCls} text-center`}>Điểm</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((student, index) => (
              <tr
                key={student.userUuid ? `${student.userUuid}-${index}` : `${student.studentId ?? 'row'}-${index}`}
                className="hover:bg-slate-50/60 transition-colors"
              >
                <td className="px-4 py-3 text-center text-sm font-black text-slate-700">
                  {student.rank ?? index + 1}
                </td>
                <td className={`${tdCls} font-mono`}>{student.studentId ?? '—'}</td>
                <td className={`${tdCls} font-bold text-slate-800`}>{student.fullname ?? '—'}</td>
                <td className={`${tdCls} text-center font-black text-blue-600`}>{fmtScore(student.score)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export function ExamResultsDialog({ isOpen, examUuid, examName, onClose }: Props) {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState<DashboardTab>('results');
  const [topNInput, setTopNInput] = useState('');
  const [debouncedTopNInput, setDebouncedTopNInput] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setActiveTab('results');
      setTopNInput('');
      setDebouncedTopNInput('');
      setExportError(null);
      setIsExporting(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setDebouncedTopNInput(topNInput);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [isOpen, topNInput]);

  const canAccessDashboard = role?.roleName === 'MANAGER' || role?.roleName === 'TEACHER';
  const rankingLimit = useMemo(() => parseTopN(debouncedTopNInput), [debouncedTopNInput]);
  const exportRankingLimit = useMemo(() => parseTopN(topNInput), [topNInput]);

  const resultsQuery = useExamResultsQuery(examUuid, isOpen && canAccessDashboard && activeTab === 'results');
  const statsQuery = useExamStatsQuery(examUuid, isOpen && canAccessDashboard && activeTab === 'stats');
  const rankingQuery = useExamRankingQuery(
    examUuid,
    isOpen && canAccessDashboard && activeTab === 'rankings',
    rankingLimit,
  );

  if (!isOpen) return null;

  const results = resultsQuery.data ?? [];
  const sections = statsQuery.data?.sections ?? [];
  const webRankingStudents = rankingQuery.data?.webRanking?.students ?? [];
  const paperRankings = rankingQuery.data?.paperRankings ?? [];

  const footerSummary =
    activeTab === 'results'
      ? (results.length > 0 ? `${results.length} học sinh` : '')
      : activeTab === 'stats'
        ? (sections.length > 0 ? `${sections.length} nhóm thống kê` : '')
        : (() => {
            const totalPaperStudents = paperRankings.reduce((sum, group) => sum + (group.students?.length ?? 0), 0);
            const totalStudents = webRankingStudents.length + totalPaperStudents;
            return totalStudents > 0 ? `${totalStudents} dòng xếp hạng` : '';
          })();

  async function handleExport() {
    if (!examUuid || isExporting || !canAccessDashboard) return;

    setIsExporting(true);
    setExportError(null);

    try {
      await exportExamDashboard(activeTab, examUuid, {
        examName,
        n: activeTab === 'rankings' ? exportRankingLimit : undefined,
      });
    } catch (error) {
      const parsed = parseApiError(error);
      setExportError(parsed.message || 'Không thể xuất file Excel.');
    } finally {
      setIsExporting(false);
    }
  }

  function renderStatsTab() {
    if (statsQuery.isLoading) {
      return <LoadingState message="Đang tải thống kê..." />;
    }

    if (statsQuery.isError) {
      return <ErrorState error={statsQuery.error} fallback="Không thể tải thống kê bài thi." />;
    }

    if (sections.length === 0) {
      return <EmptyState icon={<BarChart3 size={28} className="opacity-20" />} message="Chưa có dữ liệu thống kê." />;
    }

    return (
      <table className="w-full text-left">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100 sticky top-0">
            <th className={thCls}>Loại</th>
            <th className={`${thCls} text-center`}>Điểm TB</th>
            <th className={`${thCls} text-center`}>Trung vị</th>
            <th className={`${thCls} text-center`}>Độ lệch chuẩn</th>
            <th className={`${thCls} text-center`}>Số câu có thống kê</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {sections.map((section, index) => (
            <tr key={`${section.sectionType ?? 'section'}-${index}`} className="hover:bg-slate-50/60 transition-colors">
              <td className={`${tdCls} font-bold text-slate-800`}>{section.sectionType ?? '—'}</td>
              <td className={`${tdCls} text-center`}>{fmtScore(section.averageScore)}</td>
              <td className={`${tdCls} text-center`}>{fmtScore(section.meanScore)}</td>
              <td className={`${tdCls} text-center`}>{fmtScore(section.standardDeviationScore)}</td>
              <td className={`${tdCls} text-center`}>{section.questions?.length ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  function renderResultsTab() {
    if (resultsQuery.isLoading) {
      return <LoadingState message="Đang tải kết quả..." />;
    }

    if (resultsQuery.isError) {
      return <ErrorState error={resultsQuery.error} fallback="Không thể tải kết quả kiểm tra." />;
    }

    if (results.length === 0) {
      return <EmptyState icon={<FileBarChart size={28} className="opacity-20" />} message="Chưa có học sinh nào nộp bài." />;
    }

    return (
      <table className="w-full text-left">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100 sticky top-0">
            <th className={thCls}>Mã học sinh</th>
            <th className={thCls}>Họ tên</th>
            <th className={thCls}>Nguồn nộp</th>
            <th className={`${thCls} text-center`}>MCQ</th>
            <th className={`${thCls} text-center`}>TFQ</th>
            <th className={`${thCls} text-center`}>SAQ</th>
            <th className={`${thCls} text-center`}>Tổng điểm</th>
            <th className={`${thCls} text-center`}>Vi phạm</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {results.map((result, index) => (
            <tr
              key={result.userUuid ? `${result.userUuid}-${index}` : index}
              className="hover:bg-slate-50/60 transition-colors"
            >
              <td className={`${tdCls} font-mono`}>{result.studentId ?? '—'}</td>
              <td className={`${tdCls} font-bold text-slate-800`}>{result.fullname ?? '—'}</td>
              <td className={tdCls}>
                {SUBMIT_SOURCE_LABEL[result.submitSource ?? ''] ?? result.submitSource ?? '—'}
              </td>
              <td className={`${tdCls} text-center`}>{fmtScore(result.sectionScores?.MCQ)}</td>
              <td className={`${tdCls} text-center`}>{fmtScore(result.sectionScores?.TFQ)}</td>
              <td className={`${tdCls} text-center`}>{fmtScore(result.sectionScores?.SAQ)}</td>
              <td className={`${tdCls} text-center font-black text-blue-600`}>{fmtScore(result.totalScore)}</td>
              <td className="px-4 py-3 text-center">
                {result.violationCount && result.violationCount > 0 ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-black bg-red-50 text-red-600">
                    <ShieldAlert size={12} />
                    {result.violationCount}
                  </span>
                ) : (
                  <span className="text-sm text-slate-400">0</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  function renderRankingsTab() {
    if (rankingQuery.isLoading) {
      return <LoadingState message="Đang tải xếp hạng..." />;
    }

    if (rankingQuery.isError) {
      return <ErrorState error={rankingQuery.error} fallback="Không thể tải xếp hạng bài thi." />;
    }

    if (webRankingStudents.length === 0 && paperRankings.length === 0) {
      return <EmptyState icon={<Trophy size={28} className="opacity-20" />} message="Chưa có dữ liệu xếp hạng." />;
    }

    return (
      <div className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">
              Top N
            </label>
            <input
              type="number"
              min={1}
              value={topNInput}
              onChange={(e) => setTopNInput(e.target.value)}
              placeholder="Để trống = mặc định 10"
              className="w-48 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
          <p className="text-xs font-bold text-slate-400">
            Để trống để backend dùng mặc định 10.
          </p>
        </div>

        <RankingTable
          title="Web ranking"
          emptyMessage="Chưa có dữ liệu xếp hạng web."
          students={webRankingStudents}
        />

        {paperRankings.map((group, index) => (
          <RankingTable
            key={`${group.paperCode ?? 'paper'}-${index}`}
            title={`Mã đề ${group.paperCode ?? '—'}`}
            emptyMessage="Nhóm mã đề này chưa có dữ liệu xếp hạng."
            students={group.students}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <FileBarChart size={18} className="text-blue-600" />
            <div>
              <h3 className="text-base font-black text-slate-900">Kết quả kiểm tra</h3>
              {examName && <p className="text-xs text-slate-400 mt-0.5">{examName}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 pt-4 shrink-0">
          <div className="inline-flex rounded-2xl bg-slate-100 p-1 gap-1">
            {(['stats', 'results', 'rankings'] as DashboardTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`${tabCls} ${activeTab === tab ? activeTabCls : inactiveTabCls}`}
              >
                {TAB_LABEL[tab]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-auto px-6 py-4">
          {!canAccessDashboard ? (
            <ErrorState error={{}} fallback="Bạn không có quyền xem thống kê bài thi này." />
          ) : (
            <>
              {activeTab === 'stats' && renderStatsTab()}
              {activeTab === 'results' && renderResultsTab()}
              {activeTab === 'rankings' && renderRankingsTab()}
            </>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 px-6 py-4 border-t border-slate-100 shrink-0">
          <div className="min-h-5">
            {exportError ? (
              <p className="text-xs font-bold text-red-500">{exportError}</p>
            ) : (
              <span className="text-xs font-bold text-slate-400">{footerSummary}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExport}
              disabled={!examUuid || isExporting || !canAccessDashboard}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-blue-600 border border-blue-200 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isExporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
              Export Excel
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
