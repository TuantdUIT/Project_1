import { Link } from 'react-router';
import { paths } from '@/config/paths';

/**
 * Ý nghĩa: Hiển thị trang 404 khi user truy cập route không tồn tại.
 * Hàm sử dụng hàm này làm đầu vào: router lazy-load component này cho wildcard path * để xử lý URL sai.
 */
export default function NotFoundRoute() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
      <p className="mb-3 text-sm font-bold uppercase tracking-widest text-indigo-deep">
        404
      </p>
      <h1 className="mb-4 text-3xl font-black text-on-surface">
        Không tìm thấy trang
      </h1>
      <p className="mb-8 text-on-surface-variant">
        Đường dẫn bạn đang truy cập không tồn tại hoặc đã được di chuyển.
      </p>
      <Link
        to={paths.home}
        className="rounded-xl bg-indigo-deep px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-indigo-700"
      >
        Về trang chủ
      </Link>
    </div>
  );
}
