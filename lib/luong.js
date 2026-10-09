/**
 * ============================================================
 * LUONG — Tính lương tháng
 * ============================================================
 */

import { readRange, appendRow, deleteRow } from './sheets';
import { getConfig } from './config';
import { getBangCongThang } from './bangcong';
import { lamTron } from './utils';

export async function tinhLuongThang(thang, nam) {
  try {
    const cfg = await getConfig();
    const soNgayCongChuan = cfg.SO_NGAY_CONG_CHUAN;
    const bangCong = await getBangCongThang(thang, nam);

    const ketQua = [];

    // ⭐ Dùng for...of để có thể await bên trong
    for (const nv of bangCong.danhSach) {
      const luongTheoNgay = nv.luongCoBan / soNgayCongChuan;
      const luongThuc = Math.round(luongTheoNgay * nv.soNgayCong);

      let phuCapThucNhan = nv.phuCap;
      if (nv.phuCapTheoNgay === cfg.CO_KHONG_CO && soNgayCongChuan > 0) {
        let tyLe = nv.soNgayCong / soNgayCongChuan;
        if (tyLe > 1) tyLe = 1;
        phuCapThucNhan = Math.round(nv.phuCap * tyLe);
      }

      // Hướng 2: Không đi làm → không phụ cấp
      if (nv.soNgayCong === 0) phuCapThucNhan = 0;

      // ⭐ await hợp lệ vì đang trong for...of
      const tongGio = await lamTron(nv.tongGio);

      ketQua.push({
        maNV: nv.maNV,
        hoTen: nv.hoTen,
        ngayCong: nv.soNgayCong,
        luongCoBan: nv.luongCoBan,
        phuCap: nv.phuCap,
        phuCapThucNhan,
        phuCapTheoNgay: nv.phuCapTheoNgay,
        khauTru: 0,
        thucNhan: luongThuc + phuCapThucNhan,
        tongGio,
      });
    }

    return { success: true, thang: Number(thang), nam: Number(nam), danhSach: ketQua };
  } catch (err) {
    return { success: false, message: 'Lỗi: ' + err.message };
  }
}

export async function luuBangLuong(thang, nam, danhSach) {
  try {
    const cfg = await getConfig();
    const rows = await readRange(cfg.TEN_SHEET_BANGLUONG);

    // Xóa dòng cũ của tháng
    for (let i = rows.length - 1; i >= 1; i--) {
      const d = new Date(rows[i][8]);
      if (Number(rows[i][0]) === Number(thang) &&
          d.getFullYear() === Number(nam) &&
          d.getMonth() + 1 === Number(thang)) {
        await deleteRow(cfg.TEN_SHEET_BANGLUONG, i + 1);
      }
    }

    // Ghi mới
    const ngayTinh = new Date().toISOString();
    for (const r of danhSach) {
      const ghiChu = r.phuCapTheoNgay === cfg.CO_KHONG_CO
        ? `PC gốc: ${r.phuCap} × ${r.ngayCong}/${cfg.SO_NGAY_CONG_CHUAN}`
        : '';
      await appendRow(cfg.TEN_SHEET_BANGLUONG, [
        thang, r.maNV, r.hoTen, r.ngayCong,
        r.luongCoBan, r.phuCap, r.khauTru || 0, r.thucNhan, ngayTinh,
        r.phuCapThucNhan, ghiChu,
      ]);
    }

    return { success: true, message: `✅ Đã lưu bảng lương tháng ${thang}/${nam}` };
  } catch (err) {
    return { success: false, message: 'Lỗi: ' + err.message };
  }
}