/**
 * POST /api/auth/login
 * Body: { user, pass }
 * Response: { success, data: { token, role, maNV, hoTen } }
 */

import { NextResponse } from 'next/server';
import { readRange } from '@/lib/sheets';
import { getConfig } from '@/lib/config';
import { signToken } from '@/lib/auth';


export async function POST(request) {
  try {
    const body = await request.json();
    const { user, pass } = body;

    if (!user || !pass) {
      return NextResponse.json({
        success: false,
        message: 'Vui lòng nhập đủ tên và mật khẩu',
      });
    }

    const cfg = await getConfig();

    // ============ BƯỚC 1: Kiểm tra admin (từ env) ============
    const adminUser = process.env.ADMIN_USERNAME || 'admin';
    const adminPass = process.env.ADMIN_PASSWORD || '123456';

    if (String(user).trim() === adminUser && String(pass) === adminPass) {
      const token = await signToken({ role: 'admin', maNV: '', hoTen: 'Quản lý' });
      return NextResponse.json({
        success: true,
        data: { token, role: 'admin', maNV: '', hoTen: 'Quản lý' },
      });
    }

    // ============ BƯỚC 2: Kiểm tra nhân viên ============
    const tkRows = await readRange(cfg.TEN_SHEET_TAIKHOAN);

    for (let i = 1; i < tkRows.length; i++) {
      const maNV = String(tkRows[i][0] || '').trim();
      if (maNV !== String(user).trim()) continue;

      const pw = String(tkRows[i][1] || '');
      const tt = String(tkRows[i][2] || '').trim();

      if (tt === cfg.TRANG_THAI_TK_KHOA) {
        return NextResponse.json({
          success: false,
          message: '⚠️ Tài khoản đã bị khóa',
        });
      }
      if (pw !== String(pass)) {
        return NextResponse.json({
          success: false,
          message: 'Sai mật khẩu',
        });
      }

      // Lấy họ tên từ sheet NhanVien
      const nvRows = await readRange(cfg.TEN_SHEET_NHANVIEN);
      let hoTen = maNV;
      for (let j = 1; j < nvRows.length; j++) {
        if (String(nvRows[j][0]) === maNV) {
          hoTen = nvRows[j][1];
          break;
        }
      }

      const token = await signToken({ role: 'user', maNV, hoTen });
      return NextResponse.json({
        success: true,
        data: { token, role: 'user', maNV, hoTen },
      });
    }

    return NextResponse.json({
      success: false,
      message: 'Sai tên hoặc mật khẩu',
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: 'Lỗi server: ' + err.message },
      { status: 500 }
    );
  }
}