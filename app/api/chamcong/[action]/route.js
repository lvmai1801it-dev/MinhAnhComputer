/**
 * API Chấm công — Dynamic route
 * ============================================================
 * POST /api/chamcong/checkin     { maNV }
 * POST /api/chamcong/checkout    { maNV }
 * POST /api/chamcong/them        {...}              (admin)
 * POST /api/chamcong/sua         {...}              (admin)
 * POST /api/chamcong/tinhlai     {}                 (admin)
 * POST /api/chamcong/xoa         { ngay, maNV }     (admin)
 * GET  /api/chamcong/homnay
 * GET  /api/chamcong/trangthai?maNV=NV001
 * GET  /api/chamcong/thang?thang=10&nam=2024&maNV=
 * GET  /api/chamcong/ngay?maNV=NV001&ngay=18/09/2026
 * GET  /api/chamcong/loai
 * ============================================================
 */

import { NextResponse } from 'next/server';
import {
  checkIn, checkOut, getChamCongHomNay,
  getTrangThaiHomNay, getChamCongThang,
  themChamCongThuCong, tinhLaiGioLam, xoaChamCong,
  getChamCongNgay, suaChamCong,
} from '@/lib/chamcong';
import { getDanhMuc } from '@/lib/config';
import { getUserFromRequest } from '@/lib/auth';

// ==================== GET ====================
export async function GET(request, context) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ success: false, message: 'Chưa đăng nhập' }, { status: 401 });
  }

  const { action } = await context.params;
  const { searchParams } = new URL(request.url);

  try {
    if (action === 'homnay') {
      return NextResponse.json({ success: true, data: await getChamCongHomNay() });
    }
    if (action === 'trangthai') {
      const maNV = searchParams.get('maNV');
      return NextResponse.json({ success: true, data: await getTrangThaiHomNay(maNV) });
    }
    if (action === 'thang') {
      const thang = searchParams.get('thang');
      const nam = searchParams.get('nam');
      const maNV = searchParams.get('maNV') || '';
      return NextResponse.json({ success: true, data: await getChamCongThang(thang, nam, maNV) });
    }
    if (action === 'ngay') {
      const maNV = searchParams.get('maNV');
      const ngay = searchParams.get('ngay');
      return NextResponse.json({ success: true, data: await getChamCongNgay(maNV, ngay) });
    }
    if (action === 'loai') {
      const dm = await getDanhMuc();
      return NextResponse.json({ success: true, data: Object.keys(dm) });
    }
    return NextResponse.json({ success: false, message: 'Action không hợp lệ: ' + action }, { status: 404 });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Lỗi: ' + err.message }, { status: 500 });
  }
}

// ==================== POST ====================
export async function POST(request, context) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ success: false, message: 'Chưa đăng nhập' }, { status: 401 });
  }

  const { action } = await context.params;
  const body = await request.json().catch(() => ({}));

  const ADMIN_ACTIONS = ['them', 'tinhlai', 'xoa', 'sua'];
  if (ADMIN_ACTIONS.includes(action) && user.role !== 'admin') {
    return NextResponse.json({ success: false, message: '⛔ Chỉ admin' }, { status: 403 });
  }

  try {
    let result;
    if (action === 'checkin') result = await checkIn(body.maNV);
    else if (action === 'checkout') result = await checkOut(body.maNV);
    else if (action === 'them') result = await themChamCongThuCong(body);
    else if (action === 'sua') result = await suaChamCong(body);
    else if (action === 'tinhlai') result = await tinhLaiGioLam();
    else if (action === 'xoa') result = await xoaChamCong(body.ngay, body.maNV);
    else return NextResponse.json({ success: false, message: 'Action không hợp lệ: ' + action }, { status: 404 });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Lỗi: ' + err.message }, { status: 500 });
  }
}