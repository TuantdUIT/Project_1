/**
 * Đảm bảo link luôn là URL tuyệt đối. Nếu thiếu scheme (vd "drive.google.com/..."),
 * window.open/anchor sẽ coi là đường dẫn tương đối và mở nhầm sang origin hiện tại
 * (vd localhost:3000) — nên tự thêm "https://".
 */
export function normalizeExternalUrl(url: string) {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  return `https://${trimmed}`;
}

/**
 * Mở link ngoài trong tab mới một cách an toàn (chuẩn hóa URL + chặn opener).
 */
export function openExternalLink(url?: string | null) {
  if (!url) return;
  window.open(normalizeExternalUrl(url), '_blank', 'noopener,noreferrer');
}
