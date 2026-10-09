/**
 * Trang đăng nhập — dùng Axios, không cần SWR.
 */

'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { useConfig } from '@/lib/hooks';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { data: cfgData } = useConfig();
  const router = useRouter();

  const tenCT = cfgData?.data?.TEN_CONG_TY || 'Hệ thống chấm công';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!user || !pass) {
      setError('Vui lòng nhập đủ tên và mật khẩu');
      return;
    }

    setLoading(true);
    const r = await api.post('/auth/login', { user, pass });
    setLoading(false);

    if (r.success) {
      login(r.data);
      router.replace('/chamcong');
    } else {
      setError(r.message || 'Đăng nhập thất bại');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md"
      >
        <div className="text-center text-4xl mb-3">🔐</div>
        <h1 className="text-2xl font-bold text-center mb-1 text-gray-800">
          {tenCT}
        </h1>
        <p className="text-center text-gray-500 text-sm mb-6">
          Đăng nhập để tiếp tục
        </p>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <label className="block text-sm font-semibold mb-1 text-gray-700">
          Tên đăng nhập
        </label>
        <input
          type="text"
          value={user}
          onChange={(e) => setUser(e.target.value)}
          placeholder="admin hoặc mã NV"
          autoComplete="username"
          className="w-full border-2 border-gray-200 rounded-lg p-3 mb-3 focus:border-indigo-500 outline-none"
        />

        <label className="block text-sm font-semibold mb-1 text-gray-700">
          Mật khẩu
        </label>
        <input
          type="password"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          placeholder="••••••"
          autoComplete="current-password"
          className="w-full border-2 border-gray-200 rounded-lg p-3 mb-5 focus:border-indigo-500 outline-none"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg disabled:opacity-50"
        >
          {loading ? 'Đang kiểm tra...' : 'Đăng nhập'}
        </button>
      </form>
    </div>
  );
}