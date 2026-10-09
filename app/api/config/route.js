/**
 * GET /api/config
 * Trả config cho UI (không trả password).
 */

import { NextResponse } from 'next/server';
import { getConfig, getDanhMuc } from '@/lib/config';


export async function GET() {
  try {
    const cfg = await getConfig();
    const dm = await getDanhMuc();

    return NextResponse.json({
      success: true,
      data: {
        TEN_CONG_TY: cfg.TEN_CONG_TY,
        SO_GIO_LAM_CHUAN: cfg.SO_GIO_LAM_CHUAN,
        SO_NGAY_CONG_CHUAN: cfg.SO_NGAY_CONG_CHUAN,
        GIO_NGHI: cfg.GIO_NGHI,
        KY_HIEU_DU_GIO: cfg.KY_HIEU_DU_GIO,
        KY_HIEU_NUA_NGAY: cfg.KY_HIEU_NUA_NGAY,
        KY_HIEU_THIEU_GIO: cfg.KY_HIEU_THIEU_GIO,
        KY_HIEU_NGHI_PHEP: cfg.KY_HIEU_NGHI_PHEP,
        KY_HIEU_NGHI_LE: cfg.KY_HIEU_NGHI_LE,
        KY_HIEU_NGHI_KHONG_LUONG: cfg.KY_HIEU_NGHI_KHONG_LUONG,
        LOAI_DI_LAM: cfg.LOAI_DI_LAM,
        CO_KHONG_CO: cfg.CO_KHONG_CO,
        CO_KHONG_KHONG: cfg.CO_KHONG_KHONG,
        TRANG_THAI_DANG_LAM: cfg.TRANG_THAI_DANG_LAM,
        TRANG_THAI_DA_NGHI: cfg.TRANG_THAI_DA_NGHI,
        TRANG_THAI_TK_HOAT_DONG: cfg.TRANG_THAI_TK_HOAT_DONG,
        TRANG_THAI_TK_KHOA: cfg.TRANG_THAI_TK_KHOA,
        NGUONG_NUA_NGAY: cfg.NGUONG_NUA_NGAY,
        FORMAT_NGAY: cfg.FORMAT_NGAY,
        FORMAT_GIO: cfg.FORMAT_GIO,
        danhMuc: Object.keys(dm),
      },
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: 'Lỗi: ' + err.message },
      { status: 500 }
    );
  }
}