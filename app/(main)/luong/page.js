'use client';
import { useState } from 'react';
import { api } from '@/lib/api-client';
import { useApiAction } from '@/lib/useApiAction';
import { useAuth } from '@/lib/auth-context';

export default function LuongPage() {
  const today = new Date();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [thang, setThang] = useState(today.getMonth() + 1);
  const [nam, setNam] = useState(today.getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const { run, loading: saving, message } = useApiAction();

  async function tinhLuong() {
    setLoading(true);
    setData(null);
    const r = await api.post('/luong/tinh', { thang, nam });
    setLoading(false);
    if (r.success) {
      setData({ thang: r.thang, nam: r.nam, danhSach: r.danhSach || [] });
    }
  }

  async function luuLuong() {
    if (!data) return;
    if (!confirm(`Lưu bảng lương tháng ${data.thang}/${data.nam}?`)) return;
    await run(() => api.post('/luong/luu', {
      thang: data.thang, nam: data.nam, danhSach: data.danhSach,
    }));
  }

  const fmtTien = (v) => Number(v || 0).toLocaleString('vi-VN');

  const tongThucNhan = data?.danhSach?.reduce((s, x) => s + x.thucNhan, 0) || 0;
  const tongNgayCong = data?.danhSach?.reduce((s, x) => s + x.ngayCong, 0) || 0;
  const tongPhuCap = data?.danhSach?.reduce((s, x) => s + x.phuCapThucNhan, 0) || 0;
  const soNV = data?.danhSach?.length || 0;

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

  return (
    <div className="max-w-full">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-2">
          💰 Tính lương tháng
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Tính lương theo bảng công và mức lương cơ bản của từng nhân viên
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Tháng
            </label>
            <select
              value={thang}
              onChange={(e) => setThang(Number(e.target.value))}
              className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-indigo-500 outline-none transition font-semibold text-gray-700"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>Tháng {m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Năm
            </label>
            <input
              type="number"
              value={nam}
              onChange={(e) => setNam(Number(e.target.value))}
              className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-indigo-500 outline-none transition font-semibold text-gray-700"
            />
          </div>
          <div className="md:col-span-2 flex items-end">
            <button
              onClick={tinhLuong}
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 rounded-xl disabled:opacity-50 transition shadow-lg shadow-indigo-200 active:scale-[0.98]"
            >
              {loading ? 'Đang tính...' : '💵 Tính lương'}
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl mb-6 text-sm font-semibold flex items-center gap-2 ${
          message.type === 'success'
            ? 'bg-green-50 text-green-700 border-l-4 border-green-500'
            : 'bg-red-50 text-red-700 border-l-4 border-red-500'
        }`}>
          <span>{message.type === 'success' ? '✓' : '✕'}</span>
          {message.text}
        </div>
      )}

      {!data && !loading && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 sm:p-16 text-center">
          <div className="text-6xl mb-4 opacity-30">📊</div>
          <h3 className="text-lg font-bold text-gray-700 mb-2">Chưa có dữ liệu</h3>
          <p className="text-gray-400 text-sm">Chọn tháng và bấm "Tính lương" để xem bảng lương</p>
        </div>
      )}

      {loading && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-4 animate-pulse">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-3 bg-gray-100 rounded w-1/4"></div>
              </div>
              <div className="h-8 bg-gray-200 rounded w-24"></div>
            </div>
          ))}
        </div>
      )}

      {data && data.danhSach && data.danhSach.length > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-6">
            <TheThongKe icon="👥" label="Nhân viên" value={soNV} mau="blue" />
            <TheThongKe icon="📅" label="Tổng ngày công" value={tongNgayCong} mau="purple" />
            <TheThongKe icon="🎁" label="Tổng phụ cấp" value={fmtTien(tongPhuCap) + '₫'} mau="orange" />
            <TheThongKe icon="💵" label="Tổng thực nhận" value={fmtTien(tongThucNhan) + '₫'} mau="green" />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                    <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Nhân viên</th>
                    <th className="text-center p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Ngày công</th>
                    <th className="text-right p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Lương CB</th>
                    <th className="text-right p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Phụ cấp</th>
                    <th className="text-right p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">PC thực</th>
                    <th className="text-right p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Thực nhận</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.danhSach.map((r) => (
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
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center justify-center bg-purple-50 text-purple-700 font-bold rounded-lg px-3 py-1 text-sm">
                          {r.ngayCong}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="text-gray-600 text-sm">{fmtTien(r.luongCoBan)}₫</div>
                      </td>
                      <td className="p-4 text-right">
                        {r.phuCapTheoNgay === 'Có' ? (
                          <div>
                            <div className="text-gray-400 line-through text-sm">{fmtTien(r.phuCap)}₫</div>
                            <div className="text-[10px] text-orange-500 font-semibold uppercase">Theo ngày</div>
                          </div>
                        ) : (
                          <div>
                            <div className="text-gray-600 text-sm">{fmtTien(r.phuCap)}₫</div>
                            <div className="text-[10px] text-gray-400 font-semibold uppercase">Cố định</div>
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="text-blue-600 font-bold text-sm">{fmtTien(r.phuCapThucNhan)}₫</div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="inline-block bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold px-4 py-2 rounded-xl shadow-md shadow-green-200 text-base">
                          {fmtTien(r.thucNhan)}₫
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gradient-to-r from-yellow-50 to-amber-50 border-t-2 border-yellow-200">
                    <td colSpan={5} className="p-4 text-right font-bold text-gray-700 uppercase text-sm tracking-wider">
                      Tổng cộng
                    </td>
                    <td className="p-4 text-right">
                      <div className="inline-block bg-gradient-to-r from-red-500 to-rose-500 text-white font-extrabold px-5 py-2.5 rounded-xl shadow-md shadow-red-200 text-lg">
                        {fmtTien(tongThucNhan)}₫
                      </div>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {data.danhSach.map((r) => (
                <div key={r.maNV} className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${mauAvatar(r.maNV)} text-white font-bold flex items-center justify-center shadow-md flex-shrink-0`}>
                      {chuCaiDau(r.hoTen)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gray-800 truncate">{r.hoTen}</div>
                      <div className="text-xs text-gray-500 font-mono">{r.maNV}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-[10px] text-gray-500 uppercase font-bold">Thực nhận</div>
                      <div className="font-extrabold text-green-600 text-sm">{fmtTien(r.thucNhan)}₫</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="bg-purple-50 rounded-lg p-2 text-center">
                      <div className="text-[10px] text-purple-600 uppercase font-bold">Công</div>
                      <div className="font-bold text-purple-700 text-base">{r.ngayCong}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <div className="text-[10px] text-gray-500 uppercase font-bold">Lương CB</div>
                      <div className="font-semibold text-gray-700 text-xs">{fmtTien(r.luongCoBan)}₫</div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-2 text-center">
                      <div className="text-[10px] text-blue-600 uppercase font-bold">PC thực</div>
                      <div className="font-semibold text-blue-700 text-xs">{fmtTien(r.phuCapThucNhan)}₫</div>
                    </div>
                  </div>
                </div>
              ))}
              <div className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-700 uppercase text-sm">Tổng cộng</span>
                  <span className="bg-gradient-to-r from-red-500 to-rose-500 text-white font-extrabold px-4 py-2 rounded-xl text-base">
                    {fmtTien(tongThucNhan)}₫
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 sm:px-6 py-3 border-t flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
              <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                <span>📋 <b>{soNV}</b> nhân viên</span>
                <span className="text-gray-300 hidden sm:inline">|</span>
                <span>📅 Tháng <b>{data.thang}/{data.nam}</b></span>
                <span className="text-gray-300 hidden sm:inline">|</span>
                <span>💱 Đơn vị: <b>VNĐ</b></span>
              </div>
              <div className="text-gray-400 italic">
                {new Date().toLocaleDateString('vi-VN')}
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={() => setData(null)}
                className="px-5 py-3 bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl font-semibold transition flex items-center justify-center gap-2"
              >
                🔄 Xóa kết quả
              </button>
              <button
                onClick={luuLuong}
                disabled={saving}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-xl disabled:opacity-50 transition shadow-lg shadow-green-200 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {saving ? 'Đang lưu...' : '💾 Lưu vào Sheet'}
              </button>
            </div>
          )}
        </>
      )}

      {data && data.danhSach && data.danhSach.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 sm:p-16 text-center">
          <div className="text-6xl mb-4 opacity-30">🤷</div>
          <h3 className="text-lg font-bold text-gray-700 mb-2">Không có nhân viên</h3>
          <p className="text-gray-400 text-sm">
            Tháng {data.thang}/{data.nam} chưa có dữ liệu để tính lương
          </p>
        </div>
      )}
    </div>
  );
}

function TheThongKe({ icon, label, value, mau = 'blue' }) {
  const mauMap = {
    blue: { bg: 'from-blue-50 to-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
    purple: { bg: 'from-purple-50 to-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
    green: { bg: 'from-green-50 to-green-100', text: 'text-green-700', border: 'border-green-200' },
    orange: { bg: 'from-orange-50 to-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
  };
  const m = mauMap[mau] || mauMap.blue;
  return (
    <div className={`bg-gradient-to-br ${m.bg} ${m.border} border-2 rounded-2xl p-3 sm:p-4 transition hover:shadow-md`}>
      <div className="flex items-center gap-2 mb-1 sm:mb-2">
        <span className="text-xl sm:text-2xl">{icon}</span>
        <span className="text-[10px] sm:text-xs font-bold text-gray-600 uppercase tracking-wider">{label}</span>
      </div>
      <div className={`text-lg sm:text-2xl font-extrabold ${m.text} break-words`}>{value}</div>
    </div>
  );
}