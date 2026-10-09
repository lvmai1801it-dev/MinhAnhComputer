import { NextResponse } from 'next/server';
import { getBangCongThang } from '@/lib/bangcong';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ success: false, message: 'Chưa đăng nhập' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const thang = searchParams.get('thang');
    const nam = searchParams.get('nam');
    const data = await getBangCongThang(thang, nam);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Lỗi: ' + err.message }, { status: 500 });
  }
}