import './globals.css';
import { Providers } from './providers';

export const metadata = {
  title: 'Chấm công & Tính lương',
  description: 'Hệ thống quản lý nhân viên',
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}