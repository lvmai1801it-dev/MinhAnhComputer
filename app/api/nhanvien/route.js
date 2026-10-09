/**
 * API Nhân viên — GET (list) + POST (create)
 * ============================================================
 * GET  /api/nhanvien          → List tất cả NV
 * GET  /api/nhanvien?mode=cc  → Chỉ NV đang làm
 * POST /api/nhanvien          → Thêm NV (admin)
 * ============================================================
 */

import { NextResponse } from 'next/server';
import {
  getDanhSachNhanVien,
  getDanhSachNVChoChon,
  themNhanVien,
} from '@/lib/nhanvien';
import { getUserFromRequest } from '@/lib/auth';

// ==================== GET ====================
export async function GET(request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json(
      { success: false, message: 'Chưa đăng nhập' },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode');

    const data = mode === 'cc'
      ? await getDanhSachNVChoChon()
      : await getDanhSachNhanVien();

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: 'Lỗi: ' + err.message },
      { status: 500 }
    );
  }
}

// ==================== POST ====================
export async function POST(request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json(
      { success: false, message: 'Chưa đăng nhập' },
      { status: 401 }
    );
  }
  if (user.role !== 'admin') {
    return NextResponse.json(
      { success: false, message: '⛔ Chỉ admin được thêm nhân viên' },
      { status: 403 }
    );
  }

  try {
    const info = await request.json();
    const result = await themNhanVien(info);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: 'Lỗi: ' + err.message },
      { status: 500 }
    );
  }
}