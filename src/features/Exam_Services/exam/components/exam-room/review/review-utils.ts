// Tiện ích parse & so khớp đáp án cho màn xem lại bài (review).
// Dùng chung cho ReviewMCQCard / ReviewTFQCard / ReviewSAQCard.

/** MCQ: tách chuỗi option key (vd `A`, `AD`) thành tập ký tự để so khớp từng phương án. */
export function parseOptionKeys(raw?: string): Set<string> {
  if (!raw) return new Set();
  return new Set(raw.toUpperCase().replace(/[^A-Z]/g, '').split(''));
}

/** TFQ: tách chuỗi đáp án theo từng ý. HS dùng D/S/B, đáp án đúng dùng D/S/N (docs 4.5). */
export function splitStatementChars(raw?: string): string[] {
  if (!raw) return [];
  return raw.toUpperCase().split('');
}

export const TF_STUDENT_LABEL: Record<string, string> = {
  D: 'Đúng',
  S: 'Sai',
  B: 'Bỏ trống',
};

export const TF_CORRECT_LABEL: Record<string, string> = {
  D: 'Đúng',
  S: 'Sai',
  N: 'Tự do', // đáp án chuẩn N: HS trả lời khác B đều tính đúng (docs 4.5)
};

/** Đáp án HS cho 1 ý TFQ có đúng không, theo quy ước D/S/N. */
export function isTfStatementCorrect(student?: string, correct?: string): boolean {
  if (!correct) return false;
  if (correct === 'N') return !!student && student !== 'B';
  return student === correct;
}

/** SAQ: so khớp theo normalized nếu có, nếu không thì so raw (chuẩn hóa khoảng trắng/hoa thường). */
export function isSaqCorrect(
  studentNormalized?: string,
  correctNormalized?: string,
  studentRaw?: string,
  correctRaw?: string,
): boolean {
  const s = studentNormalized ?? studentRaw;
  const c = correctNormalized ?? correctRaw;
  if (!c || s === undefined || s === null) return false;
  return s.trim().toUpperCase() === c.trim().toUpperCase();
}
