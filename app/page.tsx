/**
 * Trang gốc / — kiểm tra đăng nhập rồi redirect.
 * - Nếu đã login → vào /chamcong
 * - Nếu chưa → vào /login
 */

'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(user ? '/chamcong' : '/login');
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">
      Đang tải...
    </div>
  );
}