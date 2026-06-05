// Tên đầy đủ cho loại câu hỏi — nguồn duy nhất, dùng chung toàn Exam Service.
export const QUESTION_TYPE_LABEL: Record<string, string> = {
  MCQ: 'Trắc nghiệm',
  TFQ: 'Đúng/Sai',
  SAQ: 'Trả lời ngắn',
};

/** Trả về tên đầy đủ; fallback về chính mã rồi tới '—' nếu không khớp. */
export function questionTypeLabel(code?: string | null): string {
  if (!code) return '—';
  return QUESTION_TYPE_LABEL[code] ?? code;
}
