import { env } from '@/config/env';

/**
 * Chuyển path tương đối từ backend ES (vd `/uploads/q1.png`) thành URL tuyệt đối.
 * Nếu đã là URL đầy đủ (http/https) thì giữ nguyên. Trả `undefined` khi rỗng.
 */
export function toAbsoluteUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  return `${env.VITE_APP_API_URL_ES}${url.startsWith('/') ? '' : '/'}${url}`;
}
