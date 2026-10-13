/**
 * ============================================================
 * BANGCONG — Tổng hợp công theo tháng
 * ============================================================
 * 2 chế độ tính công (cấu hình qua CHE_DO_TINH_CONG):
 *
 *   THEO_TY_LE (mặc định):
 *     - Ngày công = giờ làm / giờ chuẩn (max 1.0)
 *     - VD: làm 7h, chuẩn 8h → 0.88 công
 *     - Hiển thị: "X" nếu đủ, "0.88" nếu thiếu
 *
 *   LAM_TRON:
 *     - ≥ 8h → 1 công (X)
 *     - ≥ 4h → 0.5 công (½)
 *     - < 4h → 0 công (x)
 * ============================================================
 */

import { readRange } from './sheets';
import { getConfig, getDanhMuc } from './config';
import { formatNgayVN, parseSo } from './utils';

const COL_NV = {
  MA_NV: 1, HO_TEN: 2, PHONG_BAN: 3,
  LUONG_CB: 5, PHU_CAP: 6, TRANG_THAI: 8, PC_THEO_NGAY: 9,
};
const COL_CC = { NGAY: 1, MA_NV: 2, GIO_LAM: 6, LOAI: 7 };

export async function getBangCongThang(thang, nam) {
  const cfg = await getConfig();
  const dm = await getDanhMuc();
  const cheDo = cfg.CHE_DO_TINH_CONG || 'THEO_TY_LE';

  // ============ 1. Khởi tạo danh sách NV ============
  const nvRows = await readRange(cfg.TEN_SHEET_NHANVIEN);
  const dsNV = [];
  for (let i = 1; i < nvRows.length; i++) {
    if (!nvRows[i][COL_NV.MA_NV - 1]) continue;
    if (nvRows[i][COL_NV.TRANG_THAI - 1] === cfg.TRANG_THAI_DA_NGHI) continue;

    dsNV.push({
      maNV: String(nvRows[i][COL_NV.MA_NV - 1]),
      hoTen: nvRows[i][COL_NV.HO_TEN - 1],
      phongBan: nvRows[i][COL_NV.PHONG_BAN - 1],
      luongCoBan: parseSo(nvRows[i][COL_NV.LUONG_CB - 1]),
      phuCap: parseSo(nvRows[i][COL_NV.PHU_CAP - 1]),
      phuCapTheoNgay: nvRows[i][COL_NV.PC_THEO_NGAY - 1] || cfg.CO_KHONG_KHONG,
      chiTiet: {},
      soNgayCong: 0,
      soNgayNghi: 0,
      tongGio: 0,
    });
  }

  // ============ 2. Duyệt chấm công ============
  const ccRows = await readRange(cfg.TEN_SHEET_CHAMCONG);

  for (let j = 1; j < ccRows.length; j++) {
    const ngayStr = formatNgayVN(ccRows[j][COL_CC.NGAY - 1]);
    if (!ngayStr) continue;

    const [d, m, y] = ngayStr.split('/').map(Number);
    if (m !== Number(thang) || y !== Number(nam)) continue;

    const maNV = String(ccRows[j][COL_CC.MA_NV - 1]);
    const ngayTrongThang = d;
    const loai = ccRows[j][COL_CC.LOAI - 1] || cfg.LOAI_DI_LAM;
    const gioLam = parseSo(ccRows[j][COL_CC.GIO_LAM - 1]);

    for (let k = 0; k < dsNV.length; k++) {
      if (dsNV[k].maNV !== maNV) continue;

      if (loai === cfg.LOAI_DI_LAM) {
        // ============ NGÀY ĐI LÀM ============
        let ngayCong = 0;
        let kyHieu = '';

        if (cheDo === 'THEO_TY_LE') {
          // ⭐ Tính theo tỷ lệ
          ngayCong = gioLam / cfg.SO_GIO_LAM_CHUAN;
          if (ngayCong > 1) ngayCong = 1;
          ngayCong = Math.round(ngayCong * 100) / 100;

          if (ngayCong >= 1) {
            kyHieu = cfg.KY_HIEU_DU_GIO;                 // "X"
          } else if (ngayCong > 0) {
            kyHieu = ngayCong.toFixed(2);                // "0.88", "0.63"...
          } else {
            kyHieu = cfg.KY_HIEU_THIEU_GIO;              // "x"
          }
        } else {
          // Chế độ LAM_TRON (cũ)
          if (gioLam >= cfg.SO_GIO_LAM_CHUAN) {
            ngayCong = 1;
            kyHieu = cfg.KY_HIEU_DU_GIO;
          } else if (gioLam >= cfg.NGUONG_NUA_NGAY) {
            ngayCong = 0.5;
            kyHieu = cfg.KY_HIEU_NUA_NGAY;
          } else if (gioLam > 0) {
            ngayCong = 0;
            kyHieu = cfg.KY_HIEU_THIEU_GIO;
          }
        }

        dsNV[k].chiTiet[ngayTrongThang] = kyHieu;
        dsNV[k].soNgayCong += ngayCong;
        dsNV[k].tongGio += gioLam;
      } else {
        // ============ NGÀY NGHỈ ============
        const item = dm[loai];
        const kyHieuNghi = (item && item.kyHieu)
          ? item.kyHieu
          : loai.substring(0, 1).toUpperCase();

        dsNV[k].chiTiet[ngayTrongThang] = kyHieuNghi;
        if (item && !item.tinhVaoLuong) dsNV[k].soNgayNghi++;
      }
      break;
    }
  }

  // Làm tròn soNgayCong
  dsNV.forEach((nv) => {
    nv.soNgayCong = Math.round(nv.soNgayCong * 100) / 100;
    nv.tongGio = Math.round(nv.tongGio * 10) / 10;
  });

  return {
    thang: Number(thang),
    nam: Number(nam),
    soNgayTrongThang: new Date(nam, thang, 0).getDate(),
    cheDo,
    danhSach: dsNV,
  };
}