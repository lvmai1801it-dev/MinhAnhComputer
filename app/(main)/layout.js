'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useConfig } from '@/lib/hooks';

export default function MainLayout({ children }) {
  const { user, logout, loading } = useAuth();
  const { data: cfgData } = useConfig();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Đang tải...
      </div>
    );
  }

  const isAdmin = user.role === 'admin';
  const tenCT = cfgData?.data?.TEN_CONG_TY || 'Chấm công';

  const menu = [
    { href: '/chamcong', icon: '⏱', label: 'Chấm công', short: 'Chấm' },
    { href: '/bangcong', icon: '📅', label: 'Bảng công', short: 'Bảng' },
    { href: '/luong', icon: '💰', label: 'Tính lương', short: 'Lương' },
    ...(isAdmin ? [
      { href: '/nhanvien', icon: '👥', label: 'Nhân viên', short: 'NV' },
      { href: '/taikhoan', icon: '🔑', label: 'Tài khoản', short: 'TK' },
    ] : []),
  ];

  function handleLogout() {
    if (!confirm('Đăng xuất?')) return;
    logout();
    router.replace('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ============ DESKTOP SIDEBAR ============ */}
      <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:w-64 bg-white shadow-md z-30">
        <div className="p-4 border-b">
          <h1 className="text-lg font-bold text-indigo-600 truncate">📋 {tenCT}</h1>
        </div>

        <nav className="flex-1 p-3 overflow-y-auto">
          {menu.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg mb-1 transition ${
                  active ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-semibold">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t text-sm">
          <div className="mb-3">
            <div className="font-semibold truncate">👤 {user.hoTen}</div>
            <div className="text-xs text-gray-500">
              {isAdmin ? '👑 Quản lý' : '👤 Nhân viên'}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm font-semibold"
          >
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* ============ MOBILE TOP BAR ============ */}
      <header className="md:hidden fixed top-0 inset-x-0 bg-white border-b z-30 flex items-center justify-between px-4 h-14 shadow-sm">
        <button
          onClick={() => setSidebarOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 text-xl"
          aria-label="Mở menu"
        >
          ☰
        </button>
        <h1 className="font-bold text-indigo-600 truncate flex-1 mx-2 text-center">
          📋 {tenCT}
        </h1>
        <button
          onClick={handleLogout}
          className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-red-50 text-lg"
          aria-label="Đăng xuất"
        >
          🚪
        </button>
      </header>

      {/* ============ MOBILE SIDEBAR OVERLAY ============ */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        >
          <aside
            className="w-72 max-w-[80vw] h-full bg-white shadow-2xl flex flex-col animate-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b flex items-center justify-between">
              <h1 className="text-lg font-bold text-indigo-600 truncate">
                📋 {tenCT}
              </h1>
              <button
                onClick={() => setSidebarOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <nav className="flex-1 p-3 overflow-y-auto">
              {menu.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition ${
                      active ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-semibold">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t text-sm">
              <div className="mb-3">
                <div className="font-semibold truncate">👤 {user.hoTen}</div>
                <div className="text-xs text-gray-500">
                  {isAdmin ? '👑 Quản lý' : '👤 Nhân viên'}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-lg text-sm font-semibold"
              >
                🚪 Đăng xuất
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ============ MAIN CONTENT ============ */}
      <main className="md:ml-64 pt-14 md:pt-0 pb-20 md:pb-0">
        <div className="p-4 md:p-6">{children}</div>
      </main>

      {/* ============ MOBILE BOTTOM NAV ============ */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t z-30 pb-safe shadow-lg">
        <div className={`grid ${menu.length === 5 ? 'grid-cols-5' : 'grid-cols-3'} h-16`}>
          {menu.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-col items-center justify-center transition ${
                  active ? 'text-indigo-600' : 'text-gray-500'
                }`}
              >
                {active && (
                  <span className="absolute top-0 w-8 h-0.5 bg-indigo-600 rounded-b-full"></span>
                )}
                <span className={`text-xl transition ${active ? 'scale-110' : ''}`}>
                  {item.icon}
                </span>
                <span className={`text-[10px] mt-0.5 ${active ? 'font-bold' : 'font-medium'}`}>
                  {item.short}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}