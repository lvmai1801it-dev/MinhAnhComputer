'use client';
import { useState } from 'react';
import { useBangCong, useConfig } from '@/lib/hooks';
import { useAuth } from '@/lib/auth-context';
import ModalSuaChamCong from './ModalSuaChamCong';

export default function BangCongPage() {
  const today = new Date();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [thang, setThang] = useState(today.getMonth() + 1);
  const [nam, setNam] = useState(today.getFullYear());
  const [modalData, setModalData] = useState(null);

  const { data: cfgData } = useConfig();
  const { data: bcData, isLoading, error, mutate } = useBangCong(thang, nam);

  const cfg = cfgData?.data;
  const data = bcData?.data;

  function laCuoiTuan(d) {
    const dow = new Date(nam, thang - 1, d).getDay();
    return dow === 0 || dow === 6;
  }

  function classKyHieu(ky) {
    if (!cfg || !ky) return '';
    if (ky === cfg.KY_HIEU_DU_GIO) return 'text-green-600 font-bold';
    if (ky === cfg.KY_HIEU_NUA_NGAY) return 'text-orange-500 font-bold';
    if (ky === cfg.KY_HIEU_THIEU_GIO) return 'text-gray-400 font-bold text-xs';
    if (ky === cfg.KY_HIEU_NGHI_PHEP) return 'text-blue-500 font-bold';
    if (ky === cfg.KY_HIEU_NGHI_LE) return 'text-purple-500 font-bold';
    if (ky === cfg.KY_HIEU_NGHI_KHONG_LUONG) return 'text-red-500 font-bold';
    return 'font-bold';
  }

  function classKyHieuMobile(ky) {
    if (!cfg || !ky) return 'bg-gray-100 text-gray-600';
    if (ky === cfg.KY_HIEU_DU_GIO) return 'bg-green-100 text-green-700 border border-green-300';
    if (ky === cfg.KY_HIEU_NUA_NGAY) return 'bg-orange-100 text-orange-700 border border-orange-300';
    if (ky === cfg.KY_HIEU_THIEU_GIO) return 'bg-gray-100 text-gray-500 border border-gray-300';
    if (ky === cfg.KY_HIEU_NGHI_PHEP) return 'bg-blue-100 text-blue-700 border border-blue-300';
    if (ky === cfg.KY_HIEU_NGHI_LE) return 'bg-purple-100 text-purple-700 border border-purple-300';
    if (ky === cfg.KY_HIEU_NGHI_KHONG_LUONG) return 'bg-red-100 text-red-700 border border-red-300';
    return 'bg-gray-100 text-gray-600';
  }

  const tongNV = data?.danhSach?.length || 0;
  const tongNgayCong = data?.danhSach?.reduce((s, x) => s + x.soNgayCong, 0) || 0;
  const tongGio = data?.danhSach?.reduce((s, x) => s + x.tongGio, 0) || 0;
  const tbNgayCong = tongNV > 0 ? Math.round((tongNgayCong / tongNV) * 10) / 10 : 0;

  return (
    <div className="max-w-full">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-2">
          📅 Bảng công tháng
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Tổng hợp ngày công của tất cả nhân viên theo tháng
        </p>
      </div>

      {isAdmin && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400 p-3 sm:p-4 rounded-2xl mb-6 text-sm text-blue-800 flex items-start gap-3">
          <span className="text-xl sm:text-2xl">💡</span>
          <div>
            <b>Admin:</b> Click vào ô ngày (desktop) hoặc nút ngày (mobile) để <b>thêm / sửa / xóa</b> chấm công.
          </div>
        </div>
      )}

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
        </div>

        {cfg && (
          <div className="mt-5 pt-5 border-t border-gray-100">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              Chú thích ký hiệu
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <LegendItem ky={cfg.KY_HIEU_DU_GIO} mo="Đủ giờ" mau="green" />
              <LegendItem ky={cfg.KY_HIEU_NUA_NGAY} mo="Nửa ngày" mau="orange" />
              <LegendItem ky={cfg.KY_HIEU_THIEU_GIO} mo="Thiếu giờ" mau="gray" />
              <LegendItem ky={cfg.KY_HIEU_NGHI_PHEP} mo="Nghỉ phép" mau="blue" />
              <LegendItem ky={cfg.KY_HIEU_NGHI_LE} mo="Nghỉ lễ" mau="purple" />
              <LegendItem ky={cfg.KY_HIEU_NGHI_KHONG_LUONG} mo="Nghỉ K.Lương" mau="red" />
            </div>
          </div>
        )}
      </div>

      {isLoading && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="animate-pulse space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-8 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-2xl text-red-700">
          ⚠️ Lỗi tải bảng công. Vui lòng thử lại.
        </div>
      )}

      {data && data.danhSach && data.danhSach.length > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-6">
            <StatCard icon="👥" label="Nhân viên" value={tongNV} mau="blue" />
            <StatCard icon="📅" label="Tổng ngày công" value={tongNgayCong} mau="purple" />
            <StatCard icon="⏱" label="Tổng giờ" value={tongGio + 'h'} mau="orange" />
            <StatCard icon="📊" label="TB ngày/NV" value={tbNgayCong} mau="green" />
          </div>

          {/* ============ DESKTOP TABLE ============ */}
          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <th className="sticky left-0 bg-gradient-to-r from-gray-50 to-gray-100 z-10 text-left p-3 min-w-[200px] border-r-2 border-gray-200">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Nhân viên
                      </span>
                    </th>
                    {Array.from({ length: data.soNgayTrongThang }, (_, i) => i + 1).map((d) => (
                      <th
                        key={d}
                        className={`p-2 text-center w-9 text-xs font-bold ${
                          laCuoiTuan(d) ? 'bg-red-50 text-red-600' : 'text-gray-500'
                        }`}
                      >
                        {d}
                      </th>
                    ))}
                    <th className="p-3 text-center bg-gradient-to-r from-yellow-50 to-amber-50 min-w-[70px] border-l-2 border-yellow-200">
                      <span className="text-xs font-bold text-yellow-700 uppercase">Tổng</span>
                    </th>
                    <th className="p-3 text-center bg-gradient-to-r from-yellow-50 to-amber-50 min-w-[70px]">
                      <span className="text-xs font-bold text-yellow-700 uppercase">Giờ</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.danhSach.map((nv) => (
                    <tr key={nv.maNV} className="hover:bg-indigo-50/30 transition">
                      <td className="sticky left-0 bg-white z-10 p-3 border-r-2 border-gray-200">
                        <div className="font-bold text-gray-800">{nv.hoTen}</div>
                        <div className="text-[10px] text-gray-500 font-mono">
                          {nv.maNV} {nv.phongBan ? `· ${nv.phongBan}` : ''}
                        </div>
                      </td>
                      {Array.from({ length: data.soNgayTrongThang }, (_, i) => i + 1).map((d) => {
                        const ky = nv.chiTiet[d] || '';
                        const ngayStr = `${String(d).padStart(2, '0')}/${String(thang).padStart(2, '0')}/${nam}`;
                        return (
                          <td
                            key={d}
                            className={`text-center p-1 transition ${
                              laCuoiTuan(d) ? 'bg-red-50/40' : ''
                            } ${
                              isAdmin ? 'cursor-pointer hover:bg-indigo-100' : ''
                            }`}
                            onClick={() => {
                              if (!isAdmin) return;
                              setModalData({ maNV: nv.maNV, hoTen: nv.hoTen, ngay: ngayStr });
                            }}
                            title={isAdmin ? `Click để sửa ${ngayStr}` : ''}
                          >
                            <span className={`text-sm ${classKyHieu(ky)}`}>{ky}</span>
                          </td>
                        );
                      })}
                      <td className="text-center p-2 bg-yellow-50">
                        <span className="inline-block bg-purple-100 text-purple-700 font-bold rounded-lg px-2 py-0.5 text-sm">
                          {nv.soNgayCong}
                        </span>
                      </td>
                      <td className="text-center p-2 bg-yellow-50">
                        <span className="text-gray-600 font-semibold text-sm">
                          {Math.round(nv.tongGio * 10) / 10}h
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-gray-50 px-6 py-3 border-t flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-4">
                <span>📋 <b>{data.danhSach.length}</b> nhân viên</span>
                <span className="text-gray-300">|</span>
                <span>📅 <b>{data.soNgayTrongThang}</b> ngày</span>
                <span className="text-gray-300">|</span>
                <span>Tháng <b>{data.thang}/{data.nam}</b></span>
              </div>
              <div className="text-gray-400 italic">
                {isAdmin ? 'Click vào ô để sửa chấm công' : ''}
              </div>
            </div>
          </div>

          {/* ============ MOBILE CARDS ============ */}
          <div className="md:hidden space-y-3">
            {data.danhSach.map((nv) => {
              const chiTietArr = Object.entries(nv.chiTiet || {})
                .map(([d, ky]) => ({ ngay: Number(d), ky }))
                .sort((a, b) => a.ngay - b.ngay);

              return (
                <div key={nv.maNV} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-gray-800 truncate">{nv.hoTen}</div>
                      <div className="text-xs text-gray-500 font-mono truncate">
                        {nv.maNV}{nv.phongBan ? ` · ${nv.phongBan}` : ''}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0 ml-2">
                      <div className="text-center">
                        <div className="text-[10px] text-gray-500 uppercase font-bold">Công</div>
                        <div className="bg-purple-100 text-purple-700 font-bold rounded-lg px-2 py-1 text-sm">
                          {nv.soNgayCong}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-[10px] text-gray-500 uppercase font-bold">Giờ</div>
                        <div className="bg-blue-100 text-blue-700 font-bold rounded-lg px-2 py-1 text-sm">
                          {Math.round(nv.tongGio * 10) / 10}h
                        </div>
                      </div>
                    </div>
                  </div>

                  {chiTietArr.length === 0 ? (
                    <div className="text-xs text-gray-400 italic text-center py-2">
                      Chưa có chấm công
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {chiTietArr.map((item) => (
                        <button
                          key={item.ngay}
                          onClick={() => {
                            if (!isAdmin) return;
                            const ngayStr = `${String(item.ngay).padStart(2, '0')}/${String(thang).padStart(2, '0')}/${nam}`;
                            setModalData({ maNV: nv.maNV, hoTen: nv.hoTen, ngay: ngayStr });
                          }}
                          className={`w-10 h-10 rounded-lg text-xs font-bold flex flex-col items-center justify-center transition ${classKyHieuMobile(item.ky)} ${
                            isAdmin ? 'cursor-pointer hover:scale-110 active:scale-95' : ''
                          }`}
                        >
                          <span className="text-[9px] opacity-70">{item.ngay}</span>
                          <span className="text-sm leading-none">{item.ky}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {data && data.danhSach && data.danhSach.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 sm:p-16 text-center">
          <div className="text-6xl mb-4 opacity-30">🤷</div>
          <h3 className="text-lg font-bold text-gray-700 mb-2">Không có dữ liệu</h3>
          <p className="text-gray-400 text-sm">
            Tháng {data.thang}/{data.nam} chưa có nhân viên nào
          </p>
        </div>
      )}

      {modalData && (
        <ModalSuaChamCong
          maNV={modalData.maNV}
          hoTen={modalData.hoTen}
          ngay={modalData.ngay}
          onClose={() => setModalData(null)}
          onSaved={() => mutate()}
        />
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

function LegendItem({ ky, mo, mau }) {
  const mauMap = {
    green: 'text-green-600 border-green-200 bg-green-50',
    orange: 'text-orange-500 border-orange-200 bg-orange-50',
    gray: 'text-gray-500 border-gray-200 bg-gray-50',
    blue: 'text-blue-500 border-blue-200 bg-blue-50',
    purple: 'text-purple-500 border-purple-200 bg-purple-50',
    red: 'text-red-500 border-red-200 bg-red-50',
  };
  const c = mauMap[mau] || mauMap.gray;
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${c}`}>
      <span className="font-extrabold text-base">{ky}</span>
      <span className="text-xs font-semibold">{mo}</span>
    </div>
  );
}