import type { FlatQ, AnswerValue, GroupAnswer, StandaloneQ } from './types';
import type { ReqStudentAnswer } from '@/features/Exam_Services/exam/types';

/**
 * Mã hóa đáp án trong state thành body cho `POST /api/v1/student/attempts/{id}/answers`.
 *
 * Dùng chung cho autosave (lúc làm bài) và submit (lúc nộp) để KHÔNG lệch cách mã hóa.
 * Trả `null` khi câu chưa có đáp án (không gửi request rỗng).
 *
 * Lưu ý TFQ: ánh xạ `true → 'D'`, còn lại → `'S'` — đồng nhất với logic submit trước đây.
 * Việc dùng `'B'` cho ý bỏ trống (docs 4.5) là cải tiến riêng, cần backend xác nhận trước.
 */
export function buildSaveBody(q: FlatQ, value: AnswerValue | undefined): ReqStudentAnswer | null {
  if (value === undefined || value === null) return null;

  if (q.kind === 'group') {
    const ga = value as GroupAnswer;
    const rawAnswer = q.items
      .map((item) => (ga[item.questionUuid] === true ? 'D' : 'S'))
      .join('');
    return { questionUuid: q.questionUuid, rawAnswer };
  }

  return { questionUuid: (q as StandaloneQ).questionUuid, rawAnswer: String(value) };
}
