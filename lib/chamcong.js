/**
 * ============================================================
 * CHAMCONG — Nghiệp vụ chấm công (chuẩn múi giờ VN)
 * ============================================================
 * Sheet ChamCong:
 *   A:Ngay (DD/MM/YYYY) | B:MaNV | C:GioVao (HH:mm) | D:GioRa (HH:mm)
 *   E:GioNghi | F:GioLam | G:Loai | H:GhiChu
 * ============================================================
 */

import { readRange, appendRow, updateRange, deleteRow } from './sheets';
import { getConfig } from './config';
import {
  parseGio, parseSo,
  formatNgayVN, formatGioVN,
  cungNgay, lamTron, taoDateVN,
} from './utils';
import { timNV } from './nhanvien';

const COL = {
  NGAY: 1, MA_NV: 2, GIO_VAO: 3, GIO_RA: 4,
  GIO_NGHI: 5, GIO_LAM: 6, LOAI: 7, GHI_CHU: 8,
};

// ==================== CHECK IN ====================
export async function checkIn(maNV) {
  try {
    if (!maNV || !String(maNV).trim()) {
      return { success: false, message: 'Chưa nhập mã NV' };
    }

    const cfg = await getConfig();
    const nv = await timNV(maNV);
    if (!nv.found) return { success: false, message: '❌ Không tìm thấy: ' + maNV };
    if (nv.trangThai === cfg.TRANG_THAI_DA_NGHI) {
      return { success: false, message: '⚠️ NV đã nghỉ việc' };
    }

    const rows = await readRange(cfg.TEN_SHEET_CHAMCONG);
    const gioVao = new Date();

    // Kiểm tra đã check-in hôm nay chưa (theo giờ VN)
    for (let i = 1; i < rows.length; i++) {
      if (cungNgay(rows[i][COL.NGAY - 1], gioVao)
          && String(rows[i][COL.MA_NV - 1]) === String(maNV)) {
        if (rows[i][COL.GIO_VAO - 1]) {
          const gioCu = parseGio(rows[i][COL.GIO_VAO - 1]);
          return {
            success: false,
            message: `⚠️ ${nv.hoTen} đã check-in lúc ${gioCu}`,
          };
        }
      }
    }

    // Ghi dòng mới với giờ VN
    await appendRow(cfg.TEN_SHEET_CHAMCONG, [
      formatNgayVN(gioVao),    // "09/10/2026"
      maNV,
      formatGioVN(gioVao),     // "16:38"
      '', '', '',
      cfg.LOAI_DI_LAM,
      '',
    ]);

    return {
      success: true,
      message: `✅ ${nv.hoTen} check-in lúc ${formatGioVN(gioVao)}`,
    };
  } catch (err) {
    return { success: false, message: 'Lỗi: ' + err.message };
  }
}

// ==================== CHECK OUT ====================
export async function checkOut(maNV) {
  try {
    if (!maNV || !String(maNV).trim()) {
      return { success: false, message: 'Chưa nhập mã NV' };
    }

    const cfg = await getConfig();
    const nv = await timNV(maNV);
    if (!nv.found) return { success: false, message: '❌ Không tìm thấy: ' + maNV };

    const rows = await readRange(cfg.TEN_SHEET_CHAMCONG);
    const gioRa = new Date();

    // Tìm dòng hôm nay
    let dong = -1;
    for (let i = 1; i < rows.length; i++) {
      if (cungNgay(rows[i][COL.NGAY - 1], gioRa)
          && String(rows[i][COL.MA_NV - 1]) === String(maNV)) {
        dong = i;
        break;
      }
    }
    if (dong === -1) {
      return { success: false, message: `⚠️ ${nv.hoTen} chưa check-in` };
    }
    if (rows[dong][COL.GIO_RA - 1]) {
      const gioCu = parseGio(rows[dong][COL.GIO_RA - 1]);
      return { success: false, message: `⚠️ ${nv.hoTen} đã check-out lúc ${gioCu}` };
    }

    // ⭐ Tính giờ làm: chuyển giờ vào VN → Date UTC → so với gioRa
    const gioVaoStr = parseGio(rows[dong][COL.GIO_VAO - 1]);       // "16:38"
    const ngayStr = formatNgayVN(rows[dong][COL.NGAY - 1]);        // "09/10/2026"
    const gioVao = taoDateVN(ngayStr, gioVaoStr);                  // UTC equivalent

    const chenhLech = (gioRa.getTime() - gioVao.getTime()) / 3600000;
    const gioNghi = cfg.GIO_NGHI;
    let gioLam = chenhLech - gioNghi;
    if (gioLam < 0) gioLam = 0;
    gioLam = await lamTron(gioLam);

    const soDong = dong + 1;
    await updateRange(cfg.TEN_SHEET_CHAMCONG, `D${soDong}:F${soDong}`, [[
      formatGioVN(gioRa),      // giờ VN
      gioNghi,
      gioLam,
    ]]);

    return {
      success: true,
      message: `✅ ${nv.hoTen} check-out lúc ${formatGioVN(gioRa)} — ${gioLam} giờ`,
    };
  } catch (err) {
    return { success: false, message: 'Lỗi: ' + err.message };
  }
}

// ==================== TRẠNG THÁI HÔM NAY ====================
export async function getTrangThaiHomNay(maNV) {
  const cfg = await getConfig();
  const rows = await readRange(cfg.TEN_SHEET_CHAMCONG);
  const homNay = new Date();

  for (let i = 1; i < rows.length; i++) {
    if (cungNgay(rows[i][COL.NGAY - 1], homNay)
        && String(rows[i][COL.MA_NV - 1]) === String(maNV)) {
      return {
        co: true,
        gioVao: parseGio(rows[i][COL.GIO_VAO - 1]),
        gioRa: parseGio(rows[i][COL.GIO_RA - 1]),
        gioLam: parseSo(rows[i][COL.GIO_LAM - 1]),
        loai: rows[i][COL.LOAI - 1] || cfg.LOAI_DI_LAM,
      };
    }
  }
  return { co: false };
}

// ==================== DANH SÁCH HÔM NAY ====================
export async function getChamCongHomNay() {
  const cfg = await getConfig();
  const rows = await readRange(cfg.TEN_SHEET_CHAMCONG);
  const nvRows = await readRange(cfg.TEN_SHEET_NHANVIEN);
  const homNay = new Date();

  const mapTen = {};
  for (let k = 1; k < nvRows.length; k++) {
    mapTen[String(nvRows[k][0])] = nvRows[k][1];
  }

  const kq = [];
  for (let i = 1; i < rows.length; i++) {
    if (!cungNgay(rows[i][COL.NGAY - 1], homNay)) continue;

    const ma = rows[i][COL.MA_NV - 1];
    kq.push({
      maNV: ma,
      hoTen: mapTen[String(ma)] || '(?)',
      gioVao: parseGio(rows[i][COL.GIO_VAO - 1]),
      gioRa: parseGio(rows[i][COL.GIO_RA - 1]),
      gioNghi: parseSo(rows[i][COL.GIO_NGHI - 1]),
      gioLam: parseSo(rows[i][COL.GIO_LAM - 1]),
      loai: rows[i][COL.LOAI - 1] || cfg.LOAI_DI_LAM,
    });
  }
  return kq;
}

// ==================== LẤY CHẤM CÔNG 1 NGÀY ====================
export async function getChamCongNgay(maNV, ngayStr) {
  const cfg = await getConfig();
  const rows = await readRange(cfg.TEN_SHEET_CHAMCONG);

  for (let i = 1; i < rows.length; i++) {
    if (cungNgay(rows[i][COL.NGAY - 1], ngayStr)
        && String(rows[i][COL.MA_NV - 1]) === String(maNV)) {
      return {
        co: true,
        dong: i + 1,
        ngay: formatNgayVN(rows[i][COL.NGAY - 1]),
        maNV: rows[i][COL.MA_NV - 1],
        gioVao: parseGio(rows[i][COL.GIO_VAO - 1]),
        gioRa: parseGio(rows[i][COL.GIO_RA - 1]),
        gioNghi: parseSo(rows[i][COL.GIO_NGHI - 1]),
        gioLam: parseSo(rows[i][COL.GIO_LAM - 1]),
        loai: rows[i][COL.LOAI - 1] || cfg.LOAI_DI_LAM,
        ghiChu: rows[i][COL.GHI_CHU - 1] || '',
      };
    }
  }
  return { co: false };
}

// ==================== NHẬP CHẤM CÔNG THỦ CÔNG ====================
export async function themChamCongThuCong(info) {
  try {
    if (!info.ngay) return { success: false, message: 'Chưa chọn ngày' };
    if (!info.maNV) return { success: false, message: 'Chưa nhập mã NV' };

    const cfg = await getConfig();
    const nv = await timNV(info.maNV);
    if (!nv.found) return { success: false, message: 'Không tìm thấy: ' + info.maNV };

    const loai = info.loai || cfg.LOAI_DI_LAM;
    const laDiLam = loai === cfg.LOAI_DI_LAM;
    const gioNghi = parseSo(info.gioNghi) || cfg.GIO_NGHI;
    let gioLam = 0;

    if (laDiLam && info.gioVao && info.gioRa) {
      // ⭐ Dùng taoDateVN để chuẩn múi giờ
      const v = taoDateVN(info.ngay, info.gioVao);
      let r = taoDateVN(info.ngay, info.gioRa);
      if (r.getTime() < v.getTime()) {
        r = new Date(r.getTime() + 24 * 3600000);
      }

      const ch = (r.getTime() - v.getTime()) / 3600000;
      gioLam = ch - gioNghi;
      if (gioLam < 0) gioLam = 0;
      gioLam = await lamTron(gioLam);
    }

    // Kiểm tra trùng
    const rows = await readRange(cfg.TEN_SHEET_CHAMCONG);
    for (let i = 1; i < rows.length; i++) {
      if (cungNgay(rows[i][COL.NGAY - 1], info.ngay)
          && String(rows[i][COL.MA_NV - 1]) === String(info.maNV)) {
        return { success: false, message: `⚠️ Đã có chấm công ngày ${info.ngay}` };
      }
    }

    await appendRow(cfg.TEN_SHEET_CHAMCONG, [
      formatNgayVN(info.ngay),
      info.maNV,
      laDiLam ? parseGio(info.gioVao) : '',
      laDiLam ? parseGio(info.gioRa) : '',
      laDiLam ? gioNghi : '',
      gioLam,
      loai,
      info.ghiChu || '',
    ]);

    return {
      success: true,
      message: `✅ Đã thêm ${nv.hoTen} ngày ${formatNgayVN(info.ngay)}${gioLam > 0 ? ' — ' + gioLam + ' giờ' : ''}`,
    };
  } catch (err) {
    return { success: false, message: 'Lỗi: ' + err.message };
  }
}

// ==================== SỬA CHẤM CÔNG ====================
export async function suaChamCong(info) {
  try {
    if (!info.maNV) return { success: false, message: 'Chưa có mã NV' };
    if (!info.ngay) return { success: false, message: 'Chưa có ngày' };

    const cfg = await getConfig();
    const nv = await timNV(info.maNV);
    if (!nv.found) return { success: false, message: 'Không tìm thấy NV: ' + info.maNV };

    const loai = info.loai || cfg.LOAI_DI_LAM;
    const laDiLam = loai === cfg.LOAI_DI_LAM;
    const gioNghi = parseSo(info.gioNghi) || cfg.GIO_NGHI;

    let gioLam = 0;
    if (laDiLam && info.gioVao && info.gioRa) {
      const v = taoDateVN(info.ngay, info.gioVao);
      let r = taoDateVN(info.ngay, info.gioRa);
      if (r.getTime() < v.getTime()) {
        r = new Date(r.getTime() + 24 * 3600000);
      }

      const ch = (r.getTime() - v.getTime()) / 3600000;
      gioLam = ch - gioNghi;
      if (gioLam < 0) gioLam = 0;
      gioLam = await lamTron(gioLam);
    }

    const rows = await readRange(cfg.TEN_SHEET_CHAMCONG);
    let dong = -1;
    for (let i = 1; i < rows.length; i++) {
      if (cungNgay(rows[i][COL.NGAY - 1], info.ngay)
          && String(rows[i][COL.MA_NV - 1]) === String(info.maNV)) {
        dong = i + 1;
        break;
      }
    }

    const ngayChuan = formatNgayVN(info.ngay);

    if (dong === -1) {
      await appendRow(cfg.TEN_SHEET_CHAMCONG, [
        ngayChuan,
        info.maNV,
        laDiLam ? parseGio(info.gioVao) : '',
        laDiLam ? parseGio(info.gioRa) : '',
        laDiLam ? gioNghi : '',
        gioLam,
        loai,
        info.ghiChu || '',
      ]);
      return {
        success: true,
        message: `✅ Đã thêm chấm công ${nv.hoTen} ngày ${ngayChuan}`,
      };
    } else {
      await updateRange(cfg.TEN_SHEET_CHAMCONG, `A${dong}:H${dong}`, [[
        ngayChuan,
        info.maNV,
        laDiLam ? parseGio(info.gioVao) : '',
        laDiLam ? parseGio(info.gioRa) : '',
        laDiLam ? gioNghi : '',
        gioLam,
        loai,
        info.ghiChu || '',
      ]]);
      return {
        success: true,
        message: `✅ Đã sửa chấm công ${nv.hoTen} ngày ${ngayChuan}`,
      };
    }
  } catch (err) {
    return { success: false, message: 'Lỗi: ' + err.message };
  }
}

// ==================== TÍNH LẠI GIỜ LÀM ====================
export async function tinhLaiGioLam() {
  try {
    const cfg = await getConfig();
    const rows = await readRange(cfg.TEN_SHEET_CHAMCONG);
    let soDong = 0;

    for (let i = 1; i < rows.length; i++) {
      const loai = rows[i][COL.LOAI - 1] || cfg.LOAI_DI_LAM;
      if (loai !== cfg.LOAI_DI_LAM) continue;

      const gioVaoStr = parseGio(rows[i][COL.GIO_VAO - 1]);
      const gioRaStr = parseGio(rows[i][COL.GIO_RA - 1]);
      if (!gioVaoStr || !gioRaStr) continue;

      const gioNghi = parseSo(rows[i][COL.GIO_NGHI - 1]) || cfg.GIO_NGHI;
      const ngayStr = formatNgayVN(rows[i][COL.NGAY - 1]);
      if (!ngayStr) continue;

      const v = taoDateVN(ngayStr, gioVaoStr);
      let r = taoDateVN(ngayStr, gioRaStr);
      if (r.getTime() < v.getTime()) {
        r = new Date(r.getTime() + 24 * 3600000);
      }

      const ch = (r.getTime() - v.getTime()) / 3600000;
      let gioLam = ch - gioNghi;
      if (gioLam < 0) gioLam = 0;
      gioLam = await lamTron(gioLam);

      const cu = parseSo(rows[i][COL.GIO_LAM - 1]);
      if (Math.abs(cu - gioLam) > 0.01) {
        const soDongSheet = i + 1;
        await updateRange(cfg.TEN_SHEET_CHAMCONG, `E${soDongSheet}:F${soDongSheet}`, [[gioNghi, gioLam]]);
        soDong++;
      }
    }

    return { success: true, message: `✅ Đã tính lại ${soDong} dòng` };
  } catch (err) {
    return { success: false, message: 'Lỗi: ' + err.message };
  }
}

// ==================== XÓA CHẤM CÔNG ====================
export async function xoaChamCong(ngayStr, maNV) {
  try {
    const cfg = await getConfig();
    const rows = await readRange(cfg.TEN_SHEET_CHAMCONG);

    for (let i = rows.length - 1; i >= 1; i--) {
      if (cungNgay(rows[i][COL.NGAY - 1], ngayStr)
          && String(rows[i][COL.MA_NV - 1]) === String(maNV)) {
        await deleteRow(cfg.TEN_SHEET_CHAMCONG, i + 1);
        return { success: true, message: `🗑 Đã xóa ${maNV} ngày ${ngayStr}` };
      }
    }
    return { success: false, message: 'Không tìm thấy' };
  } catch (err) {
    return { success: false, message: 'Lỗi: ' + err.message };
  }
}

// ==================== CHẤM CÔNG THÁNG ====================
export async function getChamCongThang(thang, nam, maNV) {
  const cfg = await getConfig();
  const rows = await readRange(cfg.TEN_SHEET_CHAMCONG);
  const nvRows = await readRange(cfg.TEN_SHEET_NHANVIEN);

  const mapTen = {};
  for (let k = 1; k < nvRows.length; k++) {
    mapTen[String(nvRows[k][0])] = nvRows[k][1];
  }

  const kq = [];
  const locTheoNV = maNV && maNV.trim() !== '';

  for (let i = 1; i < rows.length; i++) {
    const ngayStr = formatNgayVN(rows[i][COL.NGAY - 1]);
    if (!ngayStr) continue;

    const [d, m, y] = ngayStr.split('/').map(Number);
    if (m !== Number(thang) || y !== Number(nam)) continue;
    if (locTheoNV && String(rows[i][COL.MA_NV - 1]) !== String(maNV)) continue;

    const ma = rows[i][COL.MA_NV - 1];
    kq.push({
      ngay: ngayStr,
      maNV: ma,
      hoTen: mapTen[String(ma)] || '(?)',
      gioVao: parseGio(rows[i][COL.GIO_VAO - 1]),
      gioRa: parseGio(rows[i][COL.GIO_RA - 1]),
      gioNghi: parseSo(rows[i][COL.GIO_NGHI - 1]),
      gioLam: parseSo(rows[i][COL.GIO_LAM - 1]),
      loai: rows[i][COL.LOAI - 1] || cfg.LOAI_DI_LAM,
      ghiChu: rows[i][COL.GHI_CHU - 1] || '',
    });
  }

  // Sort mới nhất trước
  kq.sort((a, b) => {
    const [d1, m1, y1] = a.ngay.split('/').map(Number);
    const [d2, m2, y2] = b.ngay.split('/').map(Number);
    return new Date(y2, m2 - 1, d2) - new Date(y1, m1 - 1, d1);
  });

  return kq;
}