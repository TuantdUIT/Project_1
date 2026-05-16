import { Outlet } from 'react-router';
import Footer from '@/components/layouts/footer';
import Navbar from '@/components/layouts/navbar';
import LoginModal from '@/components/ui/login-modal';

/**
 * Ý nghĩa: Cung cấp layout chung cho các route public và user route, gồm Navbar, nội dung route, Footer và LoginModal.
 * Hàm sử dụng hàm này làm đầu vào: router dùng AppLayout làm element cha để render các route con qua Outlet.
 */
export default function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
      <LoginModal />
    </div>
  );
}
