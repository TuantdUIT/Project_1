import { useNavigate, useParams } from 'react-router';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useAttemptQuery } from '@/features/Exam_Services/exam/api/exams';
import { AttemptReviewView } from '@/features/Exam_Services/exam/components/exam-room/review/AttemptReviewView';
import { paths } from '@/config/paths';

function getErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const response = (error as { response?: { status?: number } }).response;
  return response?.status;
}

export default function ExamResultRoute() {
  const { attemptUuid } = useParams<{ attemptUuid: string }>();
  const navigate = useNavigate();
  const { data: attempt, isLoading, isError, error } = useAttemptQuery(attemptUuid ?? '');

  if (!attemptUuid) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-md">
          <AlertCircle size={28} className="text-red-400 mx-auto mb-3" />
          <p className="text-sm font-bold text-red-500">Không tìm thấy mã lượt làm bài.</p>
          <button
            type="button"
            onClick={() => navigate(paths.exam)}
            className="mt-5 px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Về danh sách bài thi
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center gap-3 text-slate-400">
        <Loader2 className="animate-spin" size={24} />
        <span className="text-sm font-bold">Đang tải kết quả bài thi...</span>
      </div>
    );
  }

  if (isError) {
    const status = getErrorStatus(error);
    const message = status === 403
      ? 'Bạn không có quyền xem bài này.'
      : 'Không thể tải kết quả bài thi. Vui lòng kiểm tra lại đường dẫn.';

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-md">
          <AlertCircle size={28} className="text-red-400 mx-auto mb-3" />
          <p className="text-sm font-bold text-red-500">{message}</p>
          <button
            type="button"
            onClick={() => navigate(paths.exam)}
            className="mt-5 px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Về danh sách bài thi
          </button>
        </div>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-md">
          <AlertCircle size={28} className="text-red-400 mx-auto mb-3" />
          <p className="text-sm font-bold text-red-500">Không tìm thấy lượt làm bài.</p>
          <button
            type="button"
            onClick={() => navigate(paths.exam)}
            className="mt-5 px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Về danh sách bài thi
          </button>
        </div>
      </div>
    );
  }

  return (
    <AttemptReviewView
      attempt={attempt}
      onBack={() => navigate(paths.exam)}
    />
  );
}
