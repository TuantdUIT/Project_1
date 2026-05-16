import { RouterProvider } from 'react-router';
import { AppProvider } from '@/app/provider';
import { router } from '@/app/router';

/**
 * Ý nghĩa: Entry component mới của app, nối provider nền tảng với React Router.
 * Hàm sử dụng hàm này làm đầu vào: src/main.tsx render App vào root DOM.
 */
export default function App() {
  return (
    <AppProvider>
      <RouterProvider router={router} />
    </AppProvider>
  );
}
