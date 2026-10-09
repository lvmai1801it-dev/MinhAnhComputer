/**
 * API test — Kiểm tra kết nối Google Sheets.
 * Truy cập: http://localhost:3000/api/test
 */

import { NextResponse } from 'next/server';
import { readRange } from '@/lib/sheets';

export async function GET() {
  try {
    // Đọc sheet CauHinh — giả sử sheet này có cột Key/Value
    const data = await readRange('CauHinh');

    return NextResponse.json({
      success: true,
      message: 'Kết nối Google Sheets thành công!',
      soDong: data.length,
      duLieu: data.slice(0, 10),   // chỉ trả 10 dòng đầu cho gọn
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      message: 'Lỗi: ' + err.message,
    }, { status: 500 });
  }
}