'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { useNhanVienChoChon, useChamCongHomNay, useTrangThaiHomNay } from '@/lib/hooks';
import { useApiAction } from '@/lib/useApiAction';
import { useAuth } from '@/lib/auth-context';

export default function ChamCongPage() {
  const { user } = useAuth();
  const [maNV, setMaNV] = useState('');
  const [now, setNow] = useState(new Date());

  const { data: nvData } = useNhanVienChoChon();
  const { data: ccData, mutate: reloadCC } = useChamCongHomNay();
  const { data: ttData, mutate: reloadTT } = useTrangThaiHomNay(maNV);
  const { run, loading, message } = useApiAction();

  const dsNV = nvData?.data || [];
  const dsHomNay = ccData?.data || [];
  const trangThai = ttData?.data;
  const nvDangChon = dsNV.find((nv) => nv.maNV === maNV);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  async function handleCheckIn() {
    if (!maNV) return;
    const r = await run(() => api.post('/chamcong/checkin', { maNV }));
    if (r.success) { reloadCC(); reloadTT(); }
  }

  async function handleCheckOut() {
    if (!maNV) return;
    const r = await run(() => api.post('/chamcong/checkout', { maNV }));
    if (r.success) { reloadCC(); reloadTT(); }
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

  const gioHienTai = now.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const ngayHienTai = now.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const soDaVao = dsHomNay.filter((r) => r.gioVao).length;
  const soDaVe = dsHomNay.filter((r) => r.gioRa).length;
  const soDangLam = dsHomNay.filter((r) => r.gioVao && !r.gioRa).length;

  const laDangLam = trangThai?.co && trangThai.gioVao && !trangThai.gioRa;
  const laDaVe = trangThai?.co && trangThai.gioRa;

  return (
    <div className="max-w-full">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-2">
            ⏱ Chấm công
          </h1>
          <p className="text-gray-500 text-sm mt-1">Check in / Check out cho nhân viên</p>
        </div>
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 sm:px-6 py-3 rounded-2xl shadow-lg shadow-indigo-200 self-start">
          <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-wider">
            {gioHienTai}
          </div>
          <div className="text-[10px] sm:text-xs opacity-90 capitalize">{ngayHienTai}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-6">
        <StatCard icon="👥" label="Tổng" value={dsHomNay.length} mau="blue" />
        <StatCard icon="🟢" label="Vào" value={soDaVao} mau="green" />
        <StatCard icon="🔴" label="Ra" value={soDaVe} mau="red" />
        <StatCard icon="⏳" label="Đang làm" value={soDangLam} mau="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-xl">👤</span> Chọn nhân viên
          </h2>

          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            Mã nhân viên / Tên
          </label>
          <input
            list="dsnv"
            value={maNV}
            onChange={(e) => setMaNV(e.target.value)}
            placeholder="🔍 Gõ tên hoặc mã NV..."
            autoComplete="off"
            className="w-full border-2 border-gray-200 rounded-xl p-4 focus:border-indigo-500 outline-none transition font-semibold text-gray-700 text-base sm:text-lg"
          />
          <datalist id="dsnv">
            {dsNV.map((nv) => (
              <option key={nv.maNV} value={nv.maNV}>
                {nv.maNV} - {nv.hoTen} {nv.phongBan ? `(${nv.phongBan})` : ''}
              </option>
            ))}
          </datalist>

          {nvDangChon && (
            <div className="mt-4 flex items-center gap-3 p-3 sm:p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-100">
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${mauAvatar(nvDangChon.maNV)} text-white font-bold flex items-center justify-center shadow-md text-lg flex-shrink-0`}>
                {chuCaiDau(nvDangChon.hoTen)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-800 truncate">{nvDangChon.hoTen}</div>
                <div className="text-xs text-gray-500 truncate">
                  <b>{nvDangChon.maNV}</b>
                  {nvDangChon.phongBan ? ` · ${nvDangChon.phongBan}` : ''}
                </div>
              </div>
            </div>
          )}

          {trangThai?.co && (
            <div className={`mt-4 p-4 rounded-xl border-2 ${
              laDaVe ? 'bg-blue-50 border-blue-200' :
              laDangLam ? 'bg-green-50 border-green-200' :
              'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Trạng thái hôm nay
                </div>
                {laDaVe ? (
                  <span className="inline-flex items-center gap-1 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    🏠 Đã về
                  </span>
                ) : laDangLam ? (
                  <span className="inline-flex items-center gap-1 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                    ⏳ Đang làm
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-gray-400 text-white text-xs font-bold px-3 py-1 rounded-full">
                    —
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Giờ vào</div>
                  <div className="font-bold text-gray-800 font-mono text-base sm:text-lg">
                    {trangThai.gioVao || '—'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Giờ ra</div>
                  <div className="font-bold text-gray-800 font-mono text-base sm:text-lg">
                    {trangThai.gioRa || '—'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Giờ làm</div>
                  <div className="font-bold text-green-600 font-mono text-base sm:text-lg">
                    {trangThai.gioLam > 0 ? trangThai.gioLam + 'h' : '—'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {message && (
            <div className={`mt-4 p-4 rounded-xl text-sm font-semibold flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 border-l-4 border-green-500'
                : 'bg-red-50 text-red-700 border-l-4 border-red-500'
            }`}>
              <span>{message.type === 'success' ? '✓' : '✕'}</span>
              {message.text}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-6">
            <button
              onClick={handleCheckIn}
              disabled={loading || !maNV || laDangLam || laDaVe}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition shadow-lg shadow-green-200 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span className="text-xl sm:text-2xl">🟢</span>
              <span className="text-sm sm:text-base">CHECK IN</span>
            </button>
            <button
              onClick={handleCheckOut}
              disabled={loading || !maNV || !laDangLam}
              className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold py-4 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition shadow-lg shadow-red-200 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span className="text-xl sm:text-2xl">🔴</span>
              <span className="text-sm sm:text-base">CHECK OUT</span>
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border-2 border-indigo-100 p-4 sm:p-6">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-xl">📖</span> Hướng dẫn
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">1</div>
              <div className="text-gray-700">Gõ <b>tên</b> hoặc <b>mã NV</b> vào ô chọn nhân viên</div>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">2</div>
              <div className="text-gray-700">Bấm <b className="text-green-600">🟢 CHECK IN</b> khi bắt đầu làm việc</div>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">3</div>
              <div className="text-gray-700">Bấm <b className="text-red-600">🔴 CHECK OUT</b> khi kết thúc</div>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-yellow-500 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">!</div>
              <div className="text-gray-700"><b>Chỉ check-in 1 lần/ngày.</b> Nếu quên → admin sửa trong <b>Bảng công</b></div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 sm:p-5 border-b flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <span className="text-xl">📋</span>
            Chấm công hôm nay
            <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-full">
              {dsHomNay.length}
            </span>
          </h3>
          <button
            onClick={reloadCC}
            className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-semibold transition"
          >
            🔄 Tải lại
          </button>
        </div>

        {dsHomNay.length === 0 ? (
          <div className="p-12 sm:p-16 text-center">
            <div className="text-6xl mb-4 opacity-30">📭</div>
            <h3 className="text-lg font-bold text-gray-700 mb-2">Chưa có ai chấm công</h3>
            <p className="text-gray-400 text-sm">Hôm nay chưa có nhân viên nào check-in</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                    <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Nhân viên</th>
                    <th className="text-center p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Giờ vào</th>
                    <th className="text-center p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Giờ ra</th>
                    <th className="text-center p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Giờ làm</th>
                    <th className="text-center p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                    <th className="text-center p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Loại</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {dsHomNay.map((r, i) => (
                    <tr key={i} className="hover:bg-indigo-50/30 transition">
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
                        <span className="inline-flex items-center gap-1 font-mono font-bold text-green-700 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
                          {r.gioVao || '—'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center gap-1 font-mono font-bold px-3 py-1.5 rounded-lg border ${
                          r.gioRa ? 'text-blue-700 bg-blue-50 border-blue-200' : 'text-gray-400 bg-gray-50 border-gray-200'
                        }`}>
                          {r.gioRa || '—'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        {r.gioLam > 0 ? (
                          <span className="font-bold text-indigo-700 text-base">{r.gioLam}h</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {r.gioRa ? (
                          <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">🏠 Đã về</span>
                        ) : r.gioVao ? (
                          <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full animate-pulse">⏳ Đang làm</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-500 text-xs font-bold px-3 py-1 rounded-full">—</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 text-xs font-bold px-2.5 py-1 rounded-full border border-purple-200">
                          {r.loai}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {dsHomNay.map((r, i) => (
                <div key={i} className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${mauAvatar(r.maNV)} text-white font-bold flex items-center justify-center shadow-md flex-shrink-0`}>
                      {chuCaiDau(r.hoTen)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gray-800 truncate">{r.hoTen}</div>
                      <div className="text-xs text-gray-500 font-mono">{r.maNV}</div>
                    </div>
                    {r.gioRa ? (
                      <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0">🏠 Về</span>
                    ) : r.gioVao ? (
                      <span className="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full animate-pulse flex-shrink-0">⏳ Làm</span>
                    ) : null}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="bg-green-50 rounded-lg p-2 text-center">
                      <div className="text-[10px] text-green-600 uppercase font-bold">Vào</div>
                      <div className="font-mono font-bold text-green-700">{r.gioVao || '—'}</div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-2 text-center">
                      <div className="text-[10px] text-blue-600 uppercase font-bold">Ra</div>
                      <div className="font-mono font-bold text-blue-700">{r.gioRa || '—'}</div>
                    </div>
                    <div className="bg-indigo-50 rounded-lg p-2 text-center">
                      <div className="text-[10px] text-indigo-600 uppercase font-bold">Giờ</div>
                      <div className="font-bold text-indigo-700">{r.gioLam > 0 ? r.gioLam + 'h' : '—'}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gray-50 px-4 sm:px-6 py-3 border-t flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
              <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                <span>📋 <b>{dsHomNay.length}</b> lượt</span>
                <span className="text-gray-300 hidden sm:inline">|</span>
                <span>🟢 Vào: <b className="text-green-600">{soDaVao}</b></span>
                <span className="text-gray-300 hidden sm:inline">|</span>
                <span>🔴 Ra: <b className="text-red-600">{soDaVe}</b></span>
              </div>
              <div className="text-gray-400 italic">
                Cập nhật {now.toLocaleTimeString('vi-VN')}
              </div>
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
    purple: { bg: 'from-purple-50 to-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
    green: { bg: 'from-green-50 to-green-100', text: 'text-green-700', border: 'border-green-200' },
    orange: { bg: 'from-orange-50 to-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
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