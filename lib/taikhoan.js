/**
 * ============================================================
 * TAIKHOAN — Quản lý tài khoản NV
 * ============================================================
 * Sheet TaiKhoan: A:MaNV | B:Password | C:TrangThai
 */

import { readRange, appendRow, updateRange, deleteRow } from './sheets';
import { getConfig } from './config';
import { timNV } from './nhanvien';

const COL = { MA_NV: 1, PASSWORD: 2, TRANG_THAI: 3 };

export async function getDanhSachTaiKhoan() {
  const cfg = await getConfig();
  const rows = await readRange(cfg.TEN_SHEET_TAIKHOAN);
  const nvRows = await readRange(cfg.TEN_SHEET_NHANVIEN);

  const mapTen = {};
  for (let k = 1; k < nvRows.length; k++) mapTen[String(nvRows[k][0])] = nvRows[k][1];

  const ds = [];
  for (let i = 1; i < rows.length; i++) {
    if (!rows[i][COL.MA_NV - 1]) continue;
    ds.push({
      maNV: String(rows[i][COL.MA_NV - 1]),
      hoTen: mapTen[String(rows[i][COL.MA_NV - 1])] || '(Không có trong DS NV)',
      password: String(rows[i][COL.PASSWORD - 1]),
      trangThai: String(rows[i][COL.TRANG_THAI - 1] || cfg.TRANG_THAI_TK_HOAT_DONG),
    });
  }
  return ds;
}

export async function taoTaiKhoanNV(maNV, password) {
  try {
    const cfg = await getConfig();
    const nv = await timNV(maNV);
    if (!nv.found) return { success: false, message: 'Không tìm thấy NV: ' + maNV };
    if (!password || password.length < cfg.MIN_LEN_PASS_NV) {
      return { success: false, message: `Mật khẩu từ ${cfg.MIN_LEN_PASS_NV} ký tự` };
    }

    const rows = await readRange(cfg.TEN_SHEET_TAIKHOAN);
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][COL.MA_NV - 1]) === String(maNV)) {
        return { success: false, message: '⚠️ NV đã có tài khoản' };
      }
    }

    await appendRow(cfg.TEN_SHEET_TAIKHOAN, [maNV, password, cfg.TRANG_THAI_TK_HOAT_DONG]);
    return { success: true, message: `✅ Đã tạo tài khoản cho ${nv.hoTen}` };
  } catch (err) {
    return { success: false, message: 'Lỗi: ' + err.message };
  }
}

export async function xoaTaiKhoanNV(maNV) {
  try {
    const cfg = await getConfig();
    const rows = await readRange(cfg.TEN_SHEET_TAIKHOAN);
    for (let i = rows.length - 1; i >= 1; i--) {
      if (String(rows[i][COL.MA_NV - 1]) === String(maNV)) {
        await deleteRow(cfg.TEN_SHEET_TAIKHOAN, i + 1);
        return { success: true, message: `🗑 Đã xóa tài khoản ${maNV}` };
      }
    }
    return { success: false, message: 'Không tìm thấy' };
  } catch (err) {
    return { success: false, message: 'Lỗi: ' + err.message };
  }
}

export async function doiTrangThaiTaiKhoan(maNV, trangThaiMoi) {
  try {
    const cfg = await getConfig();
    const rows = await readRange(cfg.TEN_SHEET_TAIKHOAN);
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][COL.MA_NV - 1]) === String(maNV)) {
        await updateRange(cfg.TEN_SHEET_TAIKHOAN, `C${i + 1}`, [[trangThaiMoi]]);
        return { success: true, message: '✅ Đã đổi trạng thái' };
      }
    }
    return { success: false, message: 'Không tìm thấy' };
  } catch (err) {
    return { success: false, message: 'Lỗi: ' + err.message };
  }
}