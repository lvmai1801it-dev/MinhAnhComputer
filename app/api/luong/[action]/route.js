/**
 * API Lương — Dynamic route
 * POST /api/luong/tinh   { thang, nam }
 * POST /api/luong/luu    { thang, nam, danhSach }  (admin)
 */

import { NextResponse } from 'next/server';
import { tinhLuongThang, luuBangLuong } from '@/lib/luong';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request, context) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ success: false, message: 'Chưa đăng nhập' }, { status: 401 });
  }

  const { action } = await context.params;
  const body = await request.json().catch(() => ({}));

  if (action === 'luu' && user.role !== 'admin') {
    return NextResponse.json({ success: false, message: '⛔ Chỉ admin' }, { status: 403 });
  }

  try {
    let result;
    if (action === 'tinh') result = await tinhLuongThang(body.thang, body.nam);
    else if (action === 'luu') result = await luuBangLuong(body.thang, body.nam, body.danhSach);
    else return NextResponse.json({ success: false, message: 'Action không hợp lệ' }, { status: 404 });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Lỗi: ' + err.message }, { status: 500 });
  }
}