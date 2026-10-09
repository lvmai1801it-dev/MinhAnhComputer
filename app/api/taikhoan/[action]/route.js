/**
 * API Tài khoản — Dynamic route
 * GET  /api/taikhoan/list              → list (admin)
 * POST /api/taikhoan/tao               → { maNV, password } (admin)
 * POST /api/taikhoan/xoa               → { maNV } (admin)
 * POST /api/taikhoan/doitt             → { maNV, trangThai } (admin)
 * POST /api/taikhoan/doimknv           → { cu, moi } (NV tự đổi)
 */

import { NextResponse } from 'next/server';
import {
  getDanhSachTaiKhoan, taoTaiKhoanNV,
  xoaTaiKhoanNV, doiTrangThaiTaiKhoan,
} from '@/lib/taikhoan';
import { getUserFromRequest } from '@/lib/auth';
import { readRange, updateRange } from '@/lib/sheets';
import { getConfig } from '@/lib/config';

// ==================== GET ====================
export async function GET(request, context) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ success: false, message: 'Chưa đăng nhập' }, { status: 401 });
  if (user.role !== 'admin') return NextResponse.json({ success: false, message: '⛔ Chỉ admin' }, { status: 403 });

  const { action } = await context.params;

  try {
    if (action === 'list' || action === 'get') {
      return NextResponse.json({ success: true, data: await getDanhSachTaiKhoan() });
    }
    return NextResponse.json({ success: false, message: 'Action không hợp lệ' }, { status: 404 });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Lỗi: ' + err.message }, { status: 500 });
  }
}

// ==================== POST ====================
export async function POST(request, context) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ success: false, message: 'Chưa đăng nhập' }, { status: 401 });

  const { action } = await context.params;
  const body = await request.json().catch(() => ({}));
  const cfg = await getConfig();

  try {
    // ============ NV tự đổi MK ============
    if (action === 'doimknv') {
      if (user.role !== 'user') {
        return NextResponse.json({ success: false, message: 'Không hợp lệ' }, { status: 403 });
      }
      if (!body.moi || body.moi.length < cfg.MIN_LEN_PASS_NV) {
        return NextResponse.json({ success: false, message: `MK từ ${cfg.MIN_LEN_PASS_NV} ký tự` });
      }
      const rows = await readRange(cfg.TEN_SHEET_TAIKHOAN);
      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][0]) === String(user.maNV)) {
          if (String(rows[i][1]) !== String(body.cu)) {
            return NextResponse.json({ success: false, message: 'MK cũ sai' });
          }
          await updateRange(cfg.TEN_SHEET_TAIKHOAN, `B${i + 1}`, [[body.moi]]);
          return NextResponse.json({ success: true, message: '✅ Đổi MK thành công' });
        }
      }
      return NextResponse.json({ success: false, message: 'Không tìm thấy' });
    }

    // ============ Các action còn lại chỉ admin ============
    if (user.role !== 'admin') {
      return NextResponse.json({ success: false, message: '⛔ Chỉ admin' }, { status: 403 });
    }

    let result;
    if (action === 'tao') result = await taoTaiKhoanNV(body.maNV, body.password);
    else if (action === 'xoa') result = await xoaTaiKhoanNV(body.maNV);
    else if (action === 'doitt') result = await doiTrangThaiTaiKhoan(body.maNV, body.trangThai);
    else return NextResponse.json({ success: false, message: 'Action không hợp lệ' }, { status: 404 });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Lỗi: ' + err.message }, { status: 500 });
  }
}