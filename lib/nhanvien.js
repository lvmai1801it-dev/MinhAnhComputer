/**
 * ============================================================
 * NHANVIEN — Business logic CRUD nhân viên
 * ============================================================
 * Cấu trúc cột (1-indexed):
 *   A:MaNV | B:HoTen | C:PhongBan | D:ChucVu | E:LuongCoBan
 *   F:PhuCap | G:NgayVaoLam | H:TrangThai | I:PhuCapTheoNgay
 * ============================================================
 */

import { readRange, appendRow, updateRange, deleteRow } from './sheets';
import { getConfig } from './config';
import { parseSo, parseNgay, formatNgayVN } from './utils';

const COL = {
  MA_NV: 1, HO_TEN: 2, PHONG_BAN: 3, CHUC_VU: 4,
  LUONG_CB: 5, PHU_CAP: 6, NGAY_VAO: 7, TRANG_THAI: 8, PC_THEO_NGAY: 9,
};


/** Lấy toàn bộ danh sách nhân viên */
export async function getDanhSachNhanVien() {
  const cfg = await getConfig();
  const rows = await readRange(cfg.TEN_SHEET_NHANVIEN);
  const ds = [];

  for (let i = 1; i < rows.length; i++) {
    if (!rows[i][COL.MA_NV - 1] || String(rows[i][COL.MA_NV - 1]).trim() === '') continue;

    ds.push({
      maNV: String(rows[i][COL.MA_NV - 1]),
      hoTen: rows[i][COL.HO_TEN - 1] || '',
      phongBan: rows[i][COL.PHONG_BAN - 1] || '',
      chucVu: rows[i][COL.CHUC_VU - 1] || '',
      luongCoBan: parseSo(rows[i][COL.LUONG_CB - 1]),
      phuCap: parseSo(rows[i][COL.PHU_CAP - 1]),
      ngayVaoLam: formatNgayVN(parseNgay(rows[i][COL.NGAY_VAO - 1])),
      trangThai: rows[i][COL.TRANG_THAI - 1] || cfg.TRANG_THAI_DANG_LAM,
      phuCapTheoNgay: rows[i][COL.PC_THEO_NGAY - 1] || cfg.CO_KHONG_KHONG,
    });
  }
  return ds;
}


/** Danh sách NV đang làm — dùng cho dropdown */
export async function getDanhSachNVChoChon() {
  const cfg = await getConfig();
  const all = await getDanhSachNhanVien();
  return all
    .filter((r) => r.trangThai !== cfg.TRANG_THAI_DA_NGHI)
    .map((r) => ({ maNV: r.maNV, hoTen: r.hoTen, phongBan: r.phongBan }));
}


/** Tìm NV theo mã */
export async function timNV(maNV) {
  const cfg = await getConfig();
  const rows = await readRange(cfg.TEN_SHEET_NHANVIEN);

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][COL.MA_NV - 1]) === String(maNV)) {
      return {
        found: true,
        dong: i + 1,
        maNV: rows[i][COL.MA_NV - 1],
        hoTen: rows[i][COL.HO_TEN - 1],
        phongBan: rows[i][COL.PHONG_BAN - 1],
        chucVu: rows[i][COL.CHUC_VU - 1],
        luongCoBan: parseSo(rows[i][COL.LUONG_CB - 1]),
        phuCap: parseSo(rows[i][COL.PHU_CAP - 1]),
        ngayVaoLam: parseNgay(rows[i][COL.NGAY_VAO - 1]),
        trangThai: rows[i][COL.TRANG_THAI - 1] || cfg.TRANG_THAI_DANG_LAM,
        phuCapTheoNgay: rows[i][COL.PC_THEO_NGAY - 1] || cfg.CO_KHONG_KHONG,
      };
    }
  }
  return { found: false };
}


/** Sinh mã NV mới */
async function taoMaNVMoi() {
  const cfg = await getConfig();
  const prefix = cfg.MA_NV_PREFIX;
  const len = cfg.MA_NV_LENGTH;
  const rows = await readRange(cfg.TEN_SHEET_NHANVIEN);

  let max = 0;
  for (let i = 1; i < rows.length; i++) {
    const s = String(rows[i][COL.MA_NV - 1] || '');
    if (s.indexOf(prefix) === 0) {
      const n = parseInt(s.substring(prefix.length), 10);
      if (!isNaN(n) && n > max) max = n;
    }
  }
  const so = max + 1;
  return prefix + String(so).padStart(len, '0');
}


/** Thêm nhân viên mới */
export async function themNhanVien(info) {
  try {
    if (!info.hoTen || !info.hoTen.trim()) {
      return { success: false, message: 'Chưa nhập họ tên' };
    }
    if (!info.ngayVaoLam) {
      return { success: false, message: 'Chưa chọn ngày vào làm' };
    }

    const cfg = await getConfig();
    const maNV = await taoMaNVMoi();

    await appendRow(cfg.TEN_SHEET_NHANVIEN, [
      maNV,
      info.hoTen.trim(),
      info.phongBan || '',
      info.chucVu || '',
      Number(info.luongCoBan) || 0,
      Number(info.phuCap) || 0,
      info.ngayVaoLam,
      info.trangThai || cfg.TRANG_THAI_DANG_LAM,
      info.phuCapTheoNgay || cfg.CO_KHONG_KHONG,
    ]);

    return {
      success: true,
      message: `✅ Đã thêm ${info.hoTen} (${maNV})`,
      maNV,
    };
  } catch (err) {
    return { success: false, message: 'Lỗi: ' + err.message };
  }
}


/** Cập nhật nhân viên (không đổi mã NV) */
export async function capNhatNhanVien(maNV, info) {
  try {
    const cfg = await getConfig();
    const nv = await timNV(maNV);
    if (!nv.found) {
      return { success: false, message: 'Không tìm thấy: ' + maNV };
    }

    const d = nv.dong;
    const sheetName = cfg.TEN_SHEET_NHANVIEN;

    // ⭐ Chuẩn bị dữ liệu đúng định dạng
    // - Number: ép về số, nếu không phải số → giữ giá trị cũ
    // - Date: format chuẩn yyyy-MM-dd
    // - Text: giữ nguyên
    const luongMoi = info.luongCoBan !== undefined && info.luongCoBan !== ''
      ? Number(info.luongCoBan)
      : nv.luongCoBan;

    const phuCapMoi = info.phuCap !== undefined && info.phuCap !== ''
      ? Number(info.phuCap)
      : nv.phuCap;

    const ngayVaoMoi = info.ngayVaoLam
      ? formatNgayVN(parseNgay(info.ngayVaoLam))
      : formatNgayVN(nv.ngayVaoLam);

    // ⭐ Ghi đè 8 cột từ B → I (1 lần gọi API)
    await updateRange(sheetName, `B${d}:I${d}`, [[
      info.hoTen || nv.hoTen,
      info.phongBan || '',
      info.chucVu || '',
      luongMoi,
      phuCapMoi,
      ngayVaoMoi,
      info.trangThai || cfg.TRANG_THAI_DANG_LAM,
      info.phuCapTheoNgay || cfg.CO_KHONG_KHONG,
    ]]);

    return { success: true, message: '✅ Đã cập nhật ' + (info.hoTen || maNV) };
  } catch (err) {
    return { success: false, message: 'Lỗi: ' + err.message };
  }
}


/** Xóa nhân viên */
export async function xoaNhanVien(maNV) {
  try {
    const cfg = await getConfig();
    const nv = await timNV(maNV);
    if (!nv.found) return { success: false, message: 'Không tìm thấy: ' + maNV };

    await deleteRow(cfg.TEN_SHEET_NHANVIEN, nv.dong);
    return { success: true, message: '🗑 Đã xóa ' + nv.hoTen };
  } catch (err) {
    return { success: false, message: 'Lỗi: ' + err.message };
  }
}