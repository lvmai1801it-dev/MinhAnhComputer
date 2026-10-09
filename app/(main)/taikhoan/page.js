'use client';
import { useState } from 'react';
import { api } from '@/lib/api-client';
import { useTaiKhoan, useNhanVienChoChon } from '@/lib/hooks';
import { useApiAction } from '@/lib/useApiAction';
import { useAuth } from '@/lib/auth-context';

export default function TaiKhoanPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const { data, isLoading, mutate } = useTaiKhoan();
  const { data: nvData } = useNhanVienChoChon();
  const { run, loading, message } = useApiAction();

  const dsTK = data?.data || [];
  const dsNV = nvData?.data || [];

  const [maNV, setMaNV] = useState('');
  const [password, setPassword] = useState('123456');

  async function taoTK() {
    if (!maNV) return;
    const r = await run(() => api.post('/taikhoan/tao', { maNV, password }));
    if (r.success) { setMaNV(''); setPassword('123456'); mutate(); }
  }

  async function xoaTK(ma) {
    if (!confirm(`Xóa tài khoản ${ma}?`)) return;
    const r = await run(() => api.post('/taikhoan/xoa', { maNV: ma }));
    if (r.success) mutate();
  }

  async function doiTT(ma, tt) {
    const r = await run(() => api.post('/taikhoan/doitt', { maNV: ma, trangThai: tt }));
    if (r.success) mutate();
  }

  function chuCaiDau(hoTen) {
    if (!hoTen) return '?';
    const parts = hoTen.trim().split(' ');
    return parts[parts.length - 1].charAt(0).toUpperCase();
  }

  function mauAvatar(maNV) {
    const mau = [
      'from-blue-500 to-blue-600',
      'from-purple-500 to-purple-600',
      'from-pink-500 to-pink-600',
      'from-indigo-500 to-indigo-600',
      'from-teal-500 to-teal-600',
      'from-orange-500 to-orange-600',
    ];
    let sum = 0;
    for (let i = 0; i < maNV.length; i++) sum += maNV.charCodeAt(i);
    return mau[sum % mau.length];
  }

  if (!isAdmin) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-2xl">
        <h2 className="font-bold text-red-800 mb-2 text-lg">⛔ Không có quyền truy cập</h2>
        <p className="text-sm text-red-700">Chỉ quản lý mới xem được trang này.</p>
      </div>
    );
  }

  const soHoatDong = dsTK.filter((t) => t.trangThai !== 'Khóa').length;
  const soKhoa = dsTK.filter((t) => t.trangThai === 'Khóa').length;

  return (
    <div className="max-w-full">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-2">
          🔑 Tài khoản nhân viên
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Tạo tài khoản để nhân viên tự đăng nhập chấm công
        </p>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400 p-3 sm:p-4 rounded-2xl mb-6 text-sm text-blue-800 flex items-start gap-3">
        <span className="text-xl sm:text-2xl">💡</span>
        <div>
          <b>Lưu ý:</b> Tài khoản nhân viên chỉ xem được <b>Chấm công</b>, <b>Bảng công</b>, <b>Tính lương</b>.
          Không xem được thông tin nhân viên khác và không sửa được dữ liệu.
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-6">
        <h3 className="font-bold mb-4 text-gray-800 flex items-center gap-2">
          <span className="text-xl">➕</span> Tạo tài khoản mới
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Nhân viên
            </label>
            <input
              list="dsnv-tk"
              value={maNV}
              onChange={(e) => setMaNV(e.target.value)}
              placeholder="🔍 Gõ tên hoặc mã..."
              className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-indigo-500 outline-none transition font-semibold text-gray-700"
            />
            <datalist id="dsnv-tk">
              {dsNV.map((nv) => (
                <option key={nv.maNV} value={nv.maNV}>
                  {nv.maNV} - {nv.hoTen}
                </option>
              ))}
            </datalist>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Mật khẩu
            </label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-indigo-500 outline-none transition font-mono text-gray-700"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={taoTK}
              disabled={loading || !maNV}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 rounded-xl disabled:opacity-50 transition shadow-lg shadow-indigo-200 active:scale-[0.98]"
            >
              {loading ? 'Đang tạo...' : '➕ Tạo tài khoản'}
            </button>
          </div>
        </div>

        {message && (
          <div className={`mt-4 p-3 rounded-xl text-sm font-semibold ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border-l-4 border-green-500'
              : 'bg-red-50 text-red-700 border-l-4 border-red-500'
          }`}>
            {message.text}
          </div>
        )}
      </div>

      {dsTK.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
          <StatCard icon="🔑" label="Tổng TK" value={dsTK.length} mau="blue" />
          <StatCard icon="✓" label="Hoạt động" value={soHoatDong} mau="green" />
          <StatCard icon="🔒" label="Đã khóa" value={soKhoa} mau="red" />
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 sm:p-5 border-b flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <span className="text-xl">📋</span> Danh sách tài khoản ({dsTK.length})
          </h3>
          <button
            onClick={mutate}
            className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-semibold transition"
          >
            🔄 Tải lại
          </button>
        </div>

        {isLoading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 animate-pulse items-center">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-100 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : dsTK.length === 0 ? (
          <div className="p-12 sm:p-16 text-center">
            <div className="text-6xl mb-4 opacity-30">🔑</div>
            <h3 className="text-lg font-bold text-gray-700 mb-2">Chưa có tài khoản</h3>
            <p className="text-gray-400 text-sm">Tạo tài khoản đầu tiên cho nhân viên</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                    <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Nhân viên</th>
                    <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Mật khẩu</th>
                    <th className="text-center p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                    <th className="text-center p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {dsTK.map((r) => (
                    <tr key={r.maNV} className="hover:bg-indigo-50/30 transition">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${mauAvatar(r.maNV)} text-white font-bold flex items-center justify-center shadow-md flex-shrink-0`}>
                            {chuCaiDau(r.hoTen)}
                          </div>
                          <div>
                            <div className="font-bold text-gray-800">{r.hoTen}</div>
                            <div className="text-xs text-gray-500 font-mono">{r.maNV}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <code className="bg-gray-100 px-3 py-1.5 rounded-lg text-sm font-mono text-gray-700">
                          {r.password}
                        </code>
                      </td>
                      <td className="p-4 text-center">
                        {r.trangThai === 'Khóa' ? (
                          <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 font-bold text-xs px-3 py-1.5 rounded-full border border-red-200">
                            🔒 Khóa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 font-bold text-xs px-3 py-1.5 rounded-full border border-green-200">
                            ✓ Hoạt động
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {r.trangThai === 'Khóa' ? (
                            <button
                              onClick={() => doiTT(r.maNV, 'Hoạt động')}
                              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                            >
                              🔓 Mở
                            </button>
                          ) : (
                            <button
                              onClick={() => doiTT(r.maNV, 'Khóa')}
                              className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                            >
                              🔒 Khóa
                            </button>
                          )}
                          <button
                            onClick={() => xoaTK(r.maNV)}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                          >
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {dsTK.map((r) => (
                <div key={r.maNV} className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${mauAvatar(r.maNV)} text-white font-bold flex items-center justify-center shadow-md flex-shrink-0`}>
                      {chuCaiDau(r.hoTen)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gray-800 truncate">{r.hoTen}</div>
                      <div className="text-xs text-gray-500 font-mono">{r.maNV}</div>
                    </div>
                    {r.trangThai === 'Khóa' ? (
                      <span className="bg-red-50 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full border border-red-200 flex-shrink-0">🔒 Khóa</span>
                    ) : (
                      <span className="bg-green-50 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full border border-green-200 flex-shrink-0">✓ OK</span>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-lg p-2 mb-3">
                    <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Mật khẩu</div>
                    <code className="text-sm font-mono text-gray-700">{r.password}</code>
                  </div>

                  <div className="flex gap-2">
                    {r.trangThai === 'Khóa' ? (
                      <button
                        onClick={() => doiTT(r.maNV, 'Hoạt động')}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-lg font-semibold text-sm transition"
                      >
                        🔓 Mở khóa
                      </button>
                    ) : (
                      <button
                        onClick={() => doiTT(r.maNV, 'Khóa')}
                        className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-2.5 rounded-lg font-semibold text-sm transition"
                      >
                        🔒 Khóa
                      </button>
                    )}
                    <button
                      onClick={() => xoaTK(r.maNV)}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-lg font-semibold text-sm transition"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, mau = 'blue' }) {
  const mauMap = {
    blue: { bg: 'from-blue-50 to-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
    green: { bg: 'from-green-50 to-green-100', text: 'text-green-700', border: 'border-green-200' },
    red: { bg: 'from-red-50 to-red-100', text: 'text-red-700', border: 'border-red-200' },
  };
  const m = mauMap[mau] || mauMap.blue;
  return (
    <div className={`bg-gradient-to-br ${m.bg} ${m.border} border-2 rounded-2xl p-3 sm:p-4 transition hover:shadow-md`}>
      <div className="flex items-center gap-2 mb-1 sm:mb-2">
        <span className="text-xl sm:text-2xl">{icon}</span>
        <span className="text-[10px] sm:text-xs font-bold text-gray-600 uppercase tracking-wider">{label}</span>
      </div>
      <div className={`text-2xl sm:text-3xl font-extrabold ${m.text}`}>{value}</div>
    </div>
  );
}