const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Tách một instant (DB lưu UTC0) thành phần ngày + giờ theo **giờ local (UTC+7)**
 * để đổ vào <input type="date"> và TimePicker.
 * - Chuỗi date-only ("YYYY-MM-DD", không có 'T') được giữ nguyên vì input type=date là local thuần.
 * - Chuỗi instant ("...T..Z") được đưa qua Date để quy đổi UTC → local.
 */
export function splitDt(value?: string): { date: string; time: string } {
  if (!value) return { date: '', time: '' };
  if (!value.includes('T')) return { date: value, time: '' };
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    const [date, time] = value.split('T');
    return { date: date ?? '', time: time ?? '' };
  }
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

/** Ghép ngày (local) + giờ "HH:mm" (local) thành chuỗi datetime local naive. */
export function joinDt(date: string, time: string): string | undefined {
  if (!date) return undefined;
  return `${date}T${time || '00:00'}`;
}

/**
 * Quy đổi chuỗi datetime local → instant UTC0 (ISO có 'Z') để gửi xuống DB.
 * Đối xứng với splitDt: local (UTC+7) → UTC0.
 */
export function toInstant(value?: string): string | undefined {
  return value ? new Date(value).toISOString() : undefined;
}
