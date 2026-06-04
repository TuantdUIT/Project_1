import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Plus, Upload, Loader2, RefreshCw, Trash2, CheckCircle2, AlertCircle,
  FileText, ScanLine, Info, FileBarChart, Eye,
} from 'lucide-react';
import { useToastExam } from '@/hooks/hook_ES/use-toast-exam';
import { useExamsQuery } from '@/features/Exam_Services/exam/api/exams';
import {
  useCreateExamPaperMutation,
  useCreateScoringJobMutation,
  getScoringJob,
} from '@/features/Exam_Services/omr/api/omr';
import { useOmrStore } from '@/features/Exam_Services/omr/lib/omr-store';
import { OmrJobDetailDialog } from '@/features/Exam_Services/omr/components/omr-job-detail-dialog';
import type { OmrScoringJobStatus, ResOmrScoringJob } from '@/features/Exam_Services/omr/types';

const cardCls = 'bg-white rounded-2xl border border-slate-200 shadow-sm';
const labelCls = 'block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5';
const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400';
const thCls = 'px-4 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap';
const tdCls = 'px-4 py-3 text-sm text-slate-600';

const JOB_STATUS_COLOR: Record<string, string> = {
  PENDING:    'bg-slate-100 text-slate-500',
  PROCESSING: 'bg-blue-50 text-blue-600',
  EXTRACTED:  'bg-violet-50 text-violet-600',
  IMPORTING:  'bg-amber-50 text-amber-600',
  COMPLETED:  'bg-emerald-50 text-emerald-600',
  FAILED:     'bg-red-50 text-red-500',
};

const JOB_STATUS_LABEL: Record<string, string> = {
  PENDING:    'Chờ xử lý',
  PROCESSING: 'Đang xử lý',
  EXTRACTED:  'Đã trích xuất',
  IMPORTING:  'Đang import',
  COMPLETED:  'Hoàn tất',
  FAILED:     'Thất bại',
};

function fmtDateTime(value?: string) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function AdminOmrRoute() {
  const { toasts, show: showToast } = useToastExam();
  const { data: examsPage } = useExamsQuery();
  const exams = examsPage?.content ?? [];

  const examNameByUuid = useMemo(() => {
    const map: Record<string, string> = {};
    for (const e of exams) if (e.examUuid) map[e.examUuid] = e.examName ?? '—';
    return map;
  }, [exams]);

  const [examUuid, setExamUuid] = useState('');
  const [paperCode, setPaperCode] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const [detailJobUuid, setDetailJobUuid] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { papers, jobs, addPaper, removePaper, addJob, updateJob, removeJob } = useOmrStore();

  // Đồng bộ dữ liệu job mới nhất (từ auto-poll trong dialog) về danh sách.
  const handleSyncJob = useCallback((job: ResOmrScoringJob) => {
    if (job.jobUuid) updateJob(job.jobUuid, job);
  }, [updateJob]);

  const detailJob = jobs.find((j) => j.jobUuid === detailJobUuid);
  const createPaperMutation = useCreateExamPaperMutation();
  const createJobMutation = useCreateScoringJobMutation();

  const selectedExamName = examUuid ? examNameByUuid[examUuid] : undefined;

  // ── Bước 1: tạo mã đề ──
  function handleCreatePaper() {
    if (!examUuid) { showToast('Vui lòng chọn bài thi', 'error'); return; }
    if (!paperCode.trim()) { showToast('Vui lòng nhập mã đề', 'error'); return; }
    createPaperMutation.mutate(
      { examUuid, paperCode: paperCode.trim() },
      {
        onSuccess: (res) => {
          addPaper({ ...res, examName: selectedExamName, savedAt: new Date().toISOString() });
          showToast(`Đã tạo mã đề ${res.paperCode ?? paperCode}`);
          setPaperCode('');
        },
        onError: () => showToast('Tạo mã đề thất bại', 'error'),
      },
    );
  }

  // ── Bước 3: upload phiếu quét ──
  function handleUpload() {
    if (!examUuid) { showToast('Vui lòng chọn bài thi', 'error'); return; }
    if (!file) { showToast('Vui lòng chọn file PDF', 'error'); return; }
    createJobMutation.mutate(
      { examUuid, file },
      {
        onSuccess: (res) => {
          addJob({ ...res, examName: selectedExamName, fileName: file.name, savedAt: new Date().toISOString() });
          showToast('Đã upload phiếu — hệ thống đang xử lý nền');
          setFile(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
        },
        onError: () => showToast('Upload thất bại', 'error'),
      },
    );
  }

  // ── Làm mới trạng thái 1 job (đọc lại GET .../{jobUuid}) ──
  async function handleRefreshJob(jobUuid?: string) {
    if (!jobUuid) return;
    setRefreshing(jobUuid);
    try {
      const res = await getScoringJob(jobUuid);
      updateJob(jobUuid, res);
      showToast('Đã cập nhật trạng thái');
    } catch {
      showToast('Không thể cập nhật trạng thái', 'error');
    } finally {
      setRefreshing(null);
    }
  }

  return (
    <div className="space-y-6">

      {/* Cảnh báo giới hạn backend */}
      <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-xs font-bold">
        <Info size={15} className="shrink-0 mt-0.5" />
        <span>
          Backend chưa có API liệt kê mã đề / phiếu đã upload. Danh sách bên dưới được lưu cục bộ
          trên trình duyệt này (không thấy mục do người khác tạo). Trạng thái job có thể làm mới qua nút
          “Làm mới”.
        </span>
      </div>

      {/* Chọn bài thi */}
      <div className={`${cardCls} p-5`}>
        <label className={labelCls}>Bài thi *</label>
        <select
          value={examUuid}
          onChange={(e) => setExamUuid(e.target.value)}
          className={`${inputCls} bg-white max-w-md`}
        >
          <option value="">— Chọn bài thi —</option>
          {exams.map((e) => (
            <option key={e.examUuid} value={e.examUuid}>
              {e.examName ?? '—'}{e.schoolYear ? ` (${e.schoolYear})` : ''}
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-400 mt-2">Cả hai bước (tạo mã đề & upload phiếu) đều áp dụng cho bài thi đang chọn.</p>
      </div>

      {/* ── BƯỚC 1: TẠO MÃ ĐỀ ── */}
      <div className={`${cardCls} overflow-hidden`}>
        <div className="px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-blue-600 text-white text-xs font-black">1</span>
            <h2 className="text-base font-black text-slate-900">Tạo mã đề</h2>
            <FileText size={16} className="text-slate-300" />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Gọi một lần cho mỗi mã đề sẽ in ra phiếu (VD: 101, 102…). Bắt buộc làm trước khi upload phiếu quét.
          </p>
        </div>

        <div className="p-6 flex items-end gap-3 flex-wrap">
          <div className="flex-1 min-w-[180px] max-w-xs">
            <label className={labelCls}>Mã đề (paperCode) *</label>
            <input
              value={paperCode}
              onChange={(e) => setPaperCode(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreatePaper(); }}
              placeholder="VD: 101"
              className={inputCls}
            />
          </div>
          <button
            type="button"
            onClick={handleCreatePaper}
            disabled={createPaperMutation.isPending}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors shadow-sm shadow-blue-200"
          >
            {createPaperMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
            Tạo mã đề
          </button>
        </div>

        {/* Danh sách mã đề */}
        {papers.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm font-bold text-slate-400 border-t border-slate-100">
            Chưa tạo mã đề nào
          </div>
        ) : (
          <table className="w-full text-left border-t border-slate-100">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className={thCls}>Mã đề</th>
                <th className={thCls}>Bài thi</th>
                <th className={`${thCls} text-center`}>Số câu</th>
                <th className={thCls}>Tạo lúc</th>
                <th className={`${thCls} text-center`}>Xóa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {papers.map((p) => (
                <tr key={p.paperUuid} className="hover:bg-slate-50/60 transition-colors">
                  <td className={`${tdCls} font-black text-slate-800`}>{p.paperCode ?? '—'}</td>
                  <td className={tdCls}>{p.examName ?? examNameByUuid[p.examUuid ?? ''] ?? '—'}</td>
                  <td className={`${tdCls} text-center`}>{p.questions?.length ?? 0}</td>
                  <td className={tdCls}>{fmtDateTime(p.generatedAt ?? p.savedAt)}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => removePaper(p.paperUuid)}
                      title="Xóa khỏi danh sách (cục bộ)"
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── BƯỚC 2: NGOÀI HỆ THỐNG ── */}
      <div className="flex items-center gap-3 px-5 py-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-500">
        <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-slate-300 text-white text-xs font-black shrink-0">2</span>
        <p className="text-sm font-bold">
          (Ngoài hệ thống) In đề → phát cho học sinh làm → quét phiếu thành file PDF.
          <span className="font-medium text-slate-400"> Thao tác vật lý/offline, không qua API.</span>
        </p>
      </div>

      {/* ── BƯỚC 3: UPLOAD PHIẾU QUÉT ── */}
      <div className={`${cardCls} overflow-hidden`}>
        <div className="px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-blue-600 text-white text-xs font-black">3</span>
            <h2 className="text-base font-black text-slate-900">Upload phiếu quét</h2>
            <ScanLine size={16} className="text-slate-300" />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tải lên file PDF chứa các phiếu OMR đã tô. Sau khi nhận, hệ thống tự xử lý nền (chấm điểm).
          </p>
        </div>

        <div className="p-6 flex items-end gap-3 flex-wrap">
          <div className="flex-1 min-w-[220px] max-w-md">
            <label className={labelCls}>File phiếu quét (.pdf) *</label>
            <label className="flex items-center gap-2 border border-slate-200 border-dashed rounded-xl px-3 py-2.5 text-sm text-slate-500 cursor-pointer hover:border-blue-400 hover:bg-blue-50/40 transition-colors">
              <Upload size={15} className="shrink-0 text-slate-400" />
              <span className="truncate">{file ? file.name : 'Chọn file PDF...'}</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="hidden"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={handleUpload}
            disabled={createJobMutation.isPending}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors shadow-sm shadow-blue-200"
          >
            {createJobMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
            Upload
          </button>
        </div>

        {/* Danh sách file đã upload / job */}
        {jobs.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm font-bold text-slate-400 border-t border-slate-100">
            Chưa upload phiếu nào
          </div>
        ) : (
          <table className="w-full text-left border-t border-slate-100">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className={thCls}>File</th>
                <th className={thCls}>Bài thi</th>
                <th className={thCls}>Trạng thái</th>
                <th className={`${thCls} text-center`}>Số trang</th>
                <th className={`${thCls} text-center`}>KQ / OK / Lỗi</th>
                <th className={thCls}>Upload lúc</th>
                <th className={`${thCls} text-center`}>Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {jobs.map((j) => (
                <tr key={j.jobUuid} className="hover:bg-slate-50/60 transition-colors">
                  <td className={`${tdCls} font-semibold text-slate-800 max-w-[200px] truncate`}>{j.fileName ?? '—'}</td>
                  <td className={tdCls}>{j.examName ?? examNameByUuid[j.examUuid ?? ''] ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${JOB_STATUS_COLOR[j.status ?? ''] ?? 'bg-slate-100 text-slate-500'}`}>
                      {JOB_STATUS_LABEL[j.status as OmrScoringJobStatus] ?? j.status ?? '—'}
                    </span>
                  </td>
                  <td className={`${tdCls} text-center`}>{j.pageCount ?? '—'}</td>
                  <td className={`${tdCls} text-center`}>
                    {(j.resultCount ?? 0)} / <span className="text-emerald-600">{j.completedCount ?? 0}</span> / <span className="text-red-500">{j.failedCount ?? 0}</span>
                  </td>
                  <td className={tdCls}>{fmtDateTime(j.createdAt ?? j.savedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => setDetailJobUuid(j.jobUuid ?? null)}
                        title="Xem chi tiết"
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRefreshJob(j.jobUuid)}
                        disabled={refreshing === j.jobUuid}
                        title="Làm mới trạng thái"
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-40 transition-colors"
                      >
                        <RefreshCw size={15} className={refreshing === j.jobUuid ? 'animate-spin' : ''} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeJob(j.jobUuid)}
                        title="Xóa khỏi danh sách (cục bộ)"
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Ghi chú bước tiếp theo */}
      <div className="flex items-center gap-2 px-5 py-3 text-xs font-bold text-slate-400">
        <FileBarChart size={14} />
        Bước theo dõi kết quả & chấm điểm (Bước 4–5) sẽ làm sau.
      </div>

      {/* Dialog chi tiết job (Bước 4) */}
      <OmrJobDetailDialog
        jobUuid={detailJobUuid}
        fallback={detailJob}
        examName={detailJob?.examName}
        fileName={detailJob?.fileName}
        onClose={() => setDetailJobUuid(null)}
        onSync={handleSyncJob}
      />

      {/* Toast */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-bold text-white animate-fade-in-up ${
              t.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'
            }`}
          >
            {t.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
