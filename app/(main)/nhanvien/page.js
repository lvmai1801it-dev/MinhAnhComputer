'use client';
import { useState } from 'react';
import { api } from '@/lib/api-client';
import { useNhanVien } from '@/lib/hooks';
import { useApiAction } from '@/lib/useApiAction';
import { useAuth } from '@/lib/auth-context';

export default function NhanVienPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const { data, isLoading, mutate } = useNhanVien();
  const { run, loading, message } = useApiAction();
  const dsNV = data?.data || [];

  const [keyword, setKeyword] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState('add');
  const [form, setForm] = useState(getEmpty());
  const [formMsg, setFormMsg] = useState(null);

  function getEmpty() {
    return {
      maNV: '', hoTen: '', phongBan: '', chucVu: '',
      luongCoBan: '', phuCap: '',
      ngayVaoLam: new Date().toISOString().slice(0, 10),
      trangThai: 'Đang làm', phuCapTheoNgay: 'Không',
    };
  }

  function moThem() { setMode('add'); setForm(getEmpty()); setFormMsg(null); setModalOpen(true); }
  function moSua(nv) {
    setMode('edit');
    setForm({ ...nv, luongCoBan: nv.luongCoBan || '', phuCap: nv.phuCap || '' });
    setFormMsg(null);
    setModalOpen(true);
  }
  function updateField(k, v) { setForm((p) => ({ ...p, [k]: v })); }

  async function luu() {
    if (!form.hoTen?.trim()) { setFormMsg({ type: 'error', text: 'Chưa nhập họ tên' }); return; }
    setFormMsg(null);
    const r = mode === 'add'
      ? await run(() => api.post('/nhanvien', form))
      : await run(() => api.put(`/nhanvien/${form.maNV}`, form));
    setFormMsg({ type: r.success ? 'success' : 'error', text: r.message });
    if (r.success) setTimeout(() => { setModalOpen(false); mutate(); }, 700);
  }

  async function xoa(maNV, hoTen) {
    if (!confirm(`Xóa "${hoTen}" (${maNV})?`)) return;
    const r = await run(() => api.del(`/nhanvien/${maNV}`));
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

  const dsHienThi = dsNV.filter((r) => {
    if (!keyword) return true;
    const kw = keyword.toLowerCase();
    return (r.maNV + ' ' + r.hoTen + ' ' + (r.phongBan || '') + ' ' + (r.chucVu || '')).toLowerCase().includes(kw);
  });

  if (!isAdmin) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-2xl">
        <h2 className="font-bold text-red-800 mb-2 text-lg">⛔ Không có quyền truy cập</h2>
        <p className="text-sm text-red-700">Chỉ quản lý mới xem được trang này.</p>
      </div>
    );
  }

  const soDangLam = dsNV.filter((r) => r.trangThai !== 'Đã nghỉ').length;
  const soDaNghi = dsNV.filter((r) => r.trangThai === 'Đã nghỉ').length;
  const tongLuongCB = dsNV.filter((r) => r.trangThai !== 'Đã nghỉ').reduce((s, r) => s + (r.luongCoBan || 0), 0);

  return (
    <div className="max-w-full">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-2">
            👥 Quản lý nhân viên
          </h1>
          <p className="text-gray-500 text-sm mt-1">Thêm, sửa, xóa nhân viên trong hệ thống</p>
        </div>
        <button
          onClick={moThem}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold px-5 py-3 rounded-xl shadow-lg shadow-indigo-200 transition active:scale-[0.98] flex items-center justify-center gap-2"
        >
          ➕ Thêm nhân viên
        </button>
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

      {dsNV.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-6">
          <StatCard icon="👥" label="Tổng NV" value={dsNV.length} mau="blue" />
          <StatCard icon="✓" label="Đang làm" value={soDangLam} mau="green" />
          <StatCard icon="🚪" label="Đã nghỉ" value={soDaNghi} mau="red" />
          <StatCard icon="💰" label="Tổng lương CB" value={Number(tongLuongCB).toLocaleString('vi-VN') + '₫'} mau="orange" />
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 mb-6">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm theo mã, tên, phòng ban, chức vụ..."
            className="w-full border-2 border-gray-200 rounded-xl p-3 pl-12 focus:border-indigo-500 outline-none transition font-semibold text-gray-700"
          />
        </div>
        <div className="mt-3 text-xs text-gray-500 flex items-center gap-4">
          <span>Tổng: <b className="text-gray-700">{dsNV.length}</b></span>
          <span className="text-gray-300">|</span>
          <span>Hiển thị: <b className="text-gray-700">{dsHienThi.length}</b></span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-4 items-center animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-100 rounded w-1/4"></div>
                </div>
                <div className="h-8 bg-gray-200 rounded w-24"></div>
              </div>
            ))}
          </div>
        ) : dsHienThi.length === 0 ? (
          <div className="p-12 sm:p-16 text-center">
            <div className="text-6xl mb-4 opacity-30">🤷</div>
            <h3 className="text-lg font-bold text-gray-700 mb-2">
              {keyword ? 'Không tìm thấy nhân viên' : 'Chưa có nhân viên'}
            </h3>
            <p className="text-gray-400 text-sm">
              {keyword ? `Không có kết quả cho "${keyword}"` : 'Bấm "Thêm nhân viên" để bắt đầu'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                    <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Nhân viên</th>
                    <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Phòng ban</th>
                    <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Chức vụ</th>
                    <th className="text-right p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Lương CB</th>
                    <th className="text-right p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Phụ cấp</th>
                    <th className="text-center p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Loại PC</th>
                    <th className="text-center p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">TT</th>
                    <th className="text-center p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {dsHienThi.map((r) => (
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
                        {r.phongBan ? <span className="text-sm text-gray-700">{r.phongBan}</span> : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="p-4">
                        {r.chucVu ? <span className="text-sm text-gray-700">{r.chucVu}</span> : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-sm font-semibold text-gray-700">{Number(r.luongCoBan || 0).toLocaleString('vi-VN')}₫</span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-sm text-gray-600">{Number(r.phuCap || 0).toLocaleString('vi-VN')}₫</span>
                      </td>
                      <td className="p-4 text-center">
                        {r.phuCapTheoNgay === 'Có' ? (
                          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full border border-blue-200">📅 Theo ngày</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 text-xs font-bold px-2.5 py-1 rounded-full">💰 Cố định</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {r.trangThai === 'Đã nghỉ' ? (
                          <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full border border-red-200">Nghỉ</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full border border-green-200">✓ Làm</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => moSua(r)}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                          >
                            ✏️ Sửa
                          </button>
                          <button
                            onClick={() => xoa(r.maNV, r.hoTen)}
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
              {dsHienThi.map((r) => (
                <div key={r.maNV} className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${mauAvatar(r.maNV)} text-white font-bold flex items-center justify-center shadow-md flex-shrink-0 text-lg`}>
                      {chuCaiDau(r.hoTen)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gray-800 truncate">{r.hoTen}</div>
                      <div className="text-xs text-gray-500 font-mono">{r.maNV}</div>
                    </div>
                    {r.trangThai === 'Đã nghỉ' ? (
                      <span className="bg-red-50 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full border border-red-200 flex-shrink-0">Nghỉ</span>
                    ) : (
                      <span className="bg-green-50 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full border border-green-200 flex-shrink-0">✓ Làm</span>
                    )}
                  </div>

                  <div className="space-y-1.5 text-sm mb-3">
                    {r.phongBan && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Phòng ban:</span>
                        <span className="font-semibold text-gray-700">{r.phongBan}</span>
                      </div>
                    )}
                    {r.chucVu && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Chức vụ:</span>
                        <span className="font-semibold text-gray-700">{r.chucVu}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Lương CB:</span>
                      <span className="font-bold text-gray-800">{Number(r.luongCoBan || 0).toLocaleString('vi-VN')}₫</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Phụ cấp:</span>
                      <span className="text-gray-600">{Number(r.phuCap || 0).toLocaleString('vi-VN')}₫</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => moSua(r)}
                      className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-2.5 rounded-lg font-semibold text-sm transition"
                    >
                      ✏️ Sửa
                    </button>
                    <button
                      onClick={() => xoa(r.maNV, r.hoTen)}
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

      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center md:p-4 backdrop-blur-sm"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-white md:rounded-2xl shadow-2xl w-full max-w-lg h-full md:h-auto md:max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10 rounded-t-2xl md:rounded-t-2xl">
              <h3 className="text-lg font-bold text-gray-800">
                {mode === 'add' ? '➕ Thêm nhân viên' : `✏️ Sửa: ${form.maNV}`}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
              >
                ×
              </button>
            </div>
            <div className="p-5 space-y-4">
              {formMsg && (
                <div className={`p-3 rounded-xl text-sm font-semibold ${
                  formMsg.type === 'success'
                    ? 'bg-green-50 text-green-700 border-l-4 border-green-500'
                    : 'bg-red-50 text-red-700 border-l-4 border-red-500'
                }`}>
                  {formMsg.text}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Họ tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.hoTen}
                  onChange={(e) => updateField('hoTen', e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-indigo-500 outline-none transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Phòng ban</label>
                  <input
                    type="text"
                    value={form.phongBan}
                    onChange={(e) => updateField('phongBan', e.target.value)}
                    placeholder="Kỹ thuật"
                    className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-indigo-500 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Chức vụ</label>
                  <input
                    type="text"
                    value={form.chucVu}
                    onChange={(e) => updateField('chucVu', e.target.value)}
                    placeholder="Nhân viên"
                    className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-indigo-500 outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Lương cơ bản</label>
                  <input
                    type="number"
                    value={form.luongCoBan}
                    onChange={(e) => updateField('luongCoBan', e.target.value)}
                    placeholder="8000000"
                    className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-indigo-500 outline-none transition font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Phụ cấp</label>
                  <input
                    type="number"
                    value={form.phuCap}
                    onChange={(e) => updateField('phuCap', e.target.value)}
                    placeholder="300000"
                    className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-indigo-500 outline-none transition font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Ngày vào làm <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.ngayVaoLam}
                  onChange={(e) => updateField('ngayVaoLam', e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-indigo-500 outline-none transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Trạng thái</label>
                  <select
                    value={form.trangThai}
                    onChange={(e) => updateField('trangThai', e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-indigo-500 outline-none transition font-semibold"
                  >
                    <option value="Đang làm">Đang làm</option>
                    <option value="Đã nghỉ">Đã nghỉ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Cách tính PC</label>
                  <select
                    value={form.phuCapTheoNgay}
                    onChange={(e) => updateField('phuCapTheoNgay', e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-indigo-500 outline-none transition font-semibold"
                  >
                    <option value="Không">💰 Cố định</option>
                    <option value="Có">📅 Theo ngày</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2 pb-4">
                <button
                  onClick={luu}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 rounded-xl disabled:opacity-50 transition shadow-lg shadow-indigo-200 active:scale-[0.98]"
                >
                  {loading ? 'Đang lưu...' : '💾 Lưu'}
                </button>
                <button
                  onClick={() => setModalOpen(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
      <div className={`text-xl sm:text-3xl font-extrabold ${m.text} break-words`}>{value}</div>
    </div>
  );
}