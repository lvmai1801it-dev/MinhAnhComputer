/**
 * ============================================================
 * CONFIG — Đọc cấu hình từ Sheet CauHinh + DanhMuc
 * ============================================================
 * Cache trong 60 giây để tránh gọi Sheets API liên tục.
 * ============================================================
 */

import { readRange } from './sheets';

// Cache đơn giản
let _cfgCache = null;
let _cfgCacheTime = 0;
const CACHE_TTL = 60 * 1000;   // 60 giây

let _dmCache = null;
let _dmCacheTime = 0;

// ==================== GIÁ TRỊ MẶC ĐỊNH ====================
const DEFAULTS = {
  TEN_CONG_TY: 'Công ty',
  MUI_GIO: 'Asia/Ho_Chi_Minh',
  FORMAT_NGAY: 'yyyy-MM-dd',
  FORMAT_GIO: 'HH:mm',
  GIO_NGHI: 1,
  SO_GIO_LAM_CHUAN: 8,
  SO_NGAY_CONG_CHUAN: 26,
  LOAI_DI_LAM: 'Đi làm',
  KY_HIEU_DU_GIO: 'X',
  KY_HIEU_NUA_NGAY: '½',
  KY_HIEU_THIEU_GIO: 'x',
  KY_HIEU_NGHI_PHEP: 'P',
  KY_HIEU_NGHI_LE: 'L',
  KY_HIEU_NGHI_KHONG_LUONG: 'K',
  TRANG_THAI_DANG_LAM: 'Đang làm',
  TRANG_THAI_DA_NGHI: 'Đã nghỉ',
  TRANG_THAI_TK_HOAT_DONG: 'Hoạt động',
  TRANG_THAI_TK_KHOA: 'Khóa',
  CO_KHONG_CO: 'Có',
  CO_KHONG_KHONG: 'Không',
  MA_NV_PREFIX: 'NV',
  MA_NV_LENGTH: 3,
  MIN_LEN_PASS_ADMIN: 6,
  MIN_LEN_PASS_NV: 4,
  SO_THAP_PHAN: 2,
  TEN_SHEET_NHANVIEN: 'NhanVien',
  TEN_SHEET_CHAMCONG: 'ChamCong',
  TEN_SHEET_BANGLUONG: 'BangLuong',
  TEN_SHEET_TAIKHOAN: 'TaiKhoan',
  TEN_SHEET_DANHMUC: 'DanhMuc',
};

/**
 * Đọc toàn bộ config từ sheet CauHinh.
 * @returns {Promise<Object>}
 */
export async function getConfig() {
  const now = Date.now();
  if (_cfgCache && now - _cfgCacheTime < CACHE_TTL) return _cfgCache;

  const rows = await readRange('CauHinh');
  const cfg = { ...DEFAULTS };

  // rows[0] là header, bắt đầu từ rows[1]
  for (let i = 1; i < rows.length; i++) {
    const key = String(rows[i][0] || '').trim();
    if (key) cfg[key] = rows[i][1];
  }

  // Ép kiểu số
  cfg.GIO_NGHI = Number(cfg.GIO_NGHI) || 1;
  cfg.SO_GIO_LAM_CHUAN = Number(cfg.SO_GIO_LAM_CHUAN) || 8;
  cfg.SO_NGAY_CONG_CHUAN = Number(cfg.SO_NGAY_CONG_CHUAN) || 26;
  cfg.MA_NV_LENGTH = Number(cfg.MA_NV_LENGTH) || 3;
  cfg.MIN_LEN_PASS_ADMIN = Number(cfg.MIN_LEN_PASS_ADMIN) || 6;
  cfg.MIN_LEN_PASS_NV = Number(cfg.MIN_LEN_PASS_NV) || 4;
  cfg.SO_THAP_PHAN = Number(cfg.SO_THAP_PHAN) || 2;
  cfg.NGUONG_NUA_NGAY = cfg.SO_GIO_LAM_CHUAN / 2;

  _cfgCache = cfg;
  _cfgCacheTime = now;
  return cfg;
}

/**
 * Đọc danh mục các loại chấm công.
 * @returns {Promise<Object>} Map loai → { kyHieu, tinhVaoLuong, ... }
 */
export async function getDanhMuc() {
  const now = Date.now();
  if (_dmCache && now - _dmCacheTime < CACHE_TTL) return _dmCache;

  const cfg = await getConfig();
  const dm = {};

  try {
    const rows = await readRange(cfg.TEN_SHEET_DANHMUC);

    for (let i = 1; i < rows.length; i++) {
      const loai = String(rows[i][0] || '').trim();
      if (!loai) continue;
      dm[loai] = {
        loai,
        tinhNgayCong: String(rows[i][1] || '').trim() === cfg.CO_KHONG_CO,
        tinhVaoLuong: String(rows[i][2] || '').trim() === cfg.CO_KHONG_CO,
        kyHieu: String(rows[i][3] || '').trim(),
        ghiChu: String(rows[i][4] || ''),
      };
    }
  } catch (err) {
    // ⭐ Sheet DanhMuc không tồn tại → dùng mặc định
    console.warn('Không đọc được sheet DanhMuc, dùng giá trị mặc định:', err.message);
    dm['Đi làm'] = {
      loai: 'Đi làm',
      tinhNgayCong: true,
      tinhVaoLuong: true,
      kyHieu: cfg.KY_HIEU_DU_GIO || 'X',
      ghiChu: '',
    };
    dm['Nghỉ phép'] = {
      loai: 'Nghỉ phép',
      tinhNgayCong: false,
      tinhVaoLuong: true,
      kyHieu: cfg.KY_HIEU_NGHI_PHEP || 'P',
      ghiChu: '',
    };
    dm['Nghỉ lễ'] = {
      loai: 'Nghỉ lễ',
      tinhNgayCong: false,
      tinhVaoLuong: true,
      kyHieu: cfg.KY_HIEU_NGHI_LE || 'L',
      ghiChu: '',
    };
    dm['Nghỉ không lương'] = {
      loai: 'Nghỉ không lương',
      tinhNgayCong: false,
      tinhVaoLuong: false,
      kyHieu: cfg.KY_HIEU_NGHI_KHONG_LUONG || 'K',
      ghiChu: '',
    };
  }

  _dmCache = dm;
  _dmCacheTime = now;
  return dm;
}

/** Xóa cache (gọi khi cần reload config) */
export function clearConfigCache() {
  _cfgCache = null;
  _dmCache = null;
}