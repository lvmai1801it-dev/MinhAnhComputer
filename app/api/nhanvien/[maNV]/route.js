/**
 * API Nhân viên theo mã — PUT (update) + DELETE
 * ============================================================
 * ⚠️ Next.js 15: `params` là Promise → phải await
 * ============================================================
 */

import { NextResponse } from 'next/server';
import { capNhatNhanVien, xoaNhanVien } from '@/lib/nhanvien';
import { getUserFromRequest } from '@/lib/auth';

// ==================== PUT (UPDATE) ====================
export async function PUT(request, context) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json(
      { success: false, message: 'Chưa đăng nhập' },
      { status: 401 }
    );
  }
  if (user.role !== 'admin') {
    return NextResponse.json(
      { success: false, message: '⛔ Chỉ admin được sửa nhân viên' },
      { status: 403 }
    );
  }

  try {
    // ⭐ Next.js 15: await params
    const { maNV } = await context.params;
    const info = await request.json();

    const result = await capNhatNhanVien(maNV, info);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: 'Lỗi: ' + err.message },
      { status: 500 }
    );
  }
}

// ==================== DELETE ====================
export async function DELETE(request, context) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json(
      { success: false, message: 'Chưa đăng nhập' },
      { status: 401 }
    );
  }
  if (user.role !== 'admin') {
    return NextResponse.json(
      { success: false, message: '⛔ Chỉ admin được xóa nhân viên' },
      { status: 403 }
    );
  }

  try {
    // ⭐ Next.js 15: await params
    const { maNV } = await context.params;
    const result = await xoaNhanVien(maNV);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: 'Lỗi: ' + err.message },
      { status: 500 }
    );
  }
}