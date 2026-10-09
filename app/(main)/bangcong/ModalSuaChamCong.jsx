'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { useChamCongNgay, useLoaiChamCong } from '@/lib/hooks';
import { useApiAction } from '@/lib/useApiAction';

export default function ModalSuaChamCong({ maNV, hoTen, ngay, onClose, onSaved }) {
  const { data: ccData, isLoading } = useChamCongNgay(maNV, ngay);
  const { data: loaiData } = useLoaiChamCong();
  const { run, loading, message } = useApiAction();

  const [form, setForm] = useState({
    gioVao: '',
    gioRa: '',
    gioNghi: 1,
    loai: 'Đi làm',
    ghiChu: '',
  });

  const dsLoai = loaiData?.data || [];
  const ccHienTai = ccData?.data;

  useEffect(() => {
    if (ccHienTai?.co) {
      setForm({
        gioVao: ccHienTai.gioVao || '',
        gioRa: ccHienTai.gioRa || '',
        gioNghi: ccHienTai.gioNghi || 1,
        loai: ccHienTai.loai || 'Đi làm',
        ghiChu: ccHienTai.ghiChu || '',
      });
    } else {
      setForm({
        gioVao: '08:30',
        gioRa: '18:30',
        gioNghi: 2,
        loai: 'Đi làm',
        ghiChu: '',
      });
    }
  }, [ccHienTai]);

  function updateField(k, v) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function handleSave() {
    const payload = {
      maNV,
      ngay,
      gioVao: form.gioVao,
      gioRa: form.gioRa,
      gioNghi: form.gioNghi,
      loai: form.loai,
      ghiChu: form.ghiChu,
    };

    const r = await run(() => api.post('/chamcong/sua', payload));
    if (r.success) {
      setTimeout(() => {
        onSaved();
        onClose();
      }, 700);
    }
  }

  async function handleXoa() {
    if (!confirm(`Xóa chấm công ${hoTen} ngày ${ngay}?`)) return;
    const r = await run(() => api.post('/chamcong/xoa', { ngay, maNV }));
    if (r.success) {
      setTimeout(() => {
        onSaved();
        onClose();
      }, 700);
    }
  }

  const laDiLam = form.loai === 'Đi làm';
  const dsLoaiHienThi = dsLoai.length > 0 ? dsLoai : ['Đi làm', 'Nghỉ phép', 'Nghỉ lễ', 'Nghỉ không lương'];

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-bold">
            {ccHienTai?.co ? '✏️ Sửa chấm công' : '➕ Thêm chấm công'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
          >
            ×
          </button>
        </div>

        <div className="p-5 space-y-3">
          <div className="bg-gray-50 p-3 rounded-lg text-sm">
            <div><b>{hoTen}</b> ({maNV})</div>
            <div className="text-gray-500">Ngày: <b>{ngay}</b></div>
          </div>

          {isLoading && (
            <div className="text-center text-gray-400 py-4">Đang tải...</div>
          )}

          {!isLoading && (
            <>
              <div>
                <label className="block text-sm font-semibold mb-1">Loại</label>
                <select
                  value={form.loai}
                  onChange={(e) => updateField('loai', e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-lg p-2.5 focus:border-indigo-500 outline-none"
                >
                  {dsLoaiHienThi.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>

              {laDiLam && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold mb-1">Giờ vào</label>
                      <input
                        type="time"
                        value={form.gioVao}
                        onChange={(e) => updateField('gioVao', e.target.value)}
                        className="w-full border-2 border-gray-200 rounded-lg p-2.5 focus:border-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1">Giờ ra</label>
                      <input
                        type="time"
                        value={form.gioRa}
                        onChange={(e) => updateField('gioRa', e.target.value)}
                        className="w-full border-2 border-gray-200 rounded-lg p-2.5 focus:border-indigo-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1">
                      Giờ nghỉ (giờ)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={form.gioNghi}
                      onChange={(e) => updateField('gioNghi', e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-lg p-2.5 focus:border-indigo-500 outline-none"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-semibold mb-1">Ghi chú</label>
                <input
                  type="text"
                  value={form.ghiChu}
                  onChange={(e) => updateField('ghiChu', e.target.value)}
                  placeholder="VD: Quên chấm công, sửa hộ"
                  className="w-full border-2 border-gray-200 rounded-lg p-2.5 focus:border-indigo-500 outline-none"
                />
              </div>

              {message && (
                <div
                  className={`p-3 rounded text-sm ${
                    message.type === 'success'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {message.text}
                </div>
              )}

              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg disabled:opacity-50"
                >
                  {loading ? 'Đang lưu...' : '💾 Lưu'}
                </button>

                {ccHienTai?.co && (
                  <button
                    onClick={handleXoa}
                    disabled={loading}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2.5 rounded-lg disabled:opacity-50"
                  >
                    🗑 Xóa
                  </button>
                )}

                <button
                  onClick={onClose}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold px-4 py-2.5 rounded-lg"
                >
                  Hủy
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}