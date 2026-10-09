/**
 * ============================================================
 * CUSTOM HOOKS (SWR)
 * ============================================================
 */

'use client';
import useSWR from 'swr';
import { fetcher } from './fetcher';

// ==================== CONFIG ====================
export function useConfig() {
  return useSWR('/config', fetcher);
}

// ==================== NHÂN VIÊN ====================
export function useNhanVien() {
  return useSWR('/nhanvien', fetcher);
}

export function useNhanVienChoChon() {
  return useSWR('/nhanvien?mode=cc', fetcher);
}

// ==================== CHẤM CÔNG ====================
export function useChamCongHomNay() {
  return useSWR('/chamcong/homnay', fetcher);
}

export function useTrangThaiHomNay(maNV) {
  return useSWR(maNV ? `/chamcong/trangthai?maNV=${maNV}` : null, fetcher);
}

export function useChamCongThang(thang, nam, maNV = '') {
  const key = thang && nam
    ? `/chamcong/thang?thang=${thang}&nam=${nam}&maNV=${maNV}`
    : null;
  return useSWR(key, fetcher);
}

/** Lấy chấm công 1 ngày của 1 NV (cho admin sửa) */
export function useChamCongNgay(maNV, ngay) {
  const key = maNV && ngay ? `/chamcong/ngay?maNV=${maNV}&ngay=${encodeURIComponent(ngay)}` : null;
  return useSWR(key, fetcher);
}

/** Danh sách loại chấm công */
export function useLoaiChamCong() {
  return useSWR('/chamcong/loai', fetcher);
}

// ==================== BẢNG CÔNG ====================
export function useBangCong(thang, nam) {
  const key = thang && nam ? `/bangcong?thang=${thang}&nam=${nam}` : null;
  return useSWR(key, fetcher);
}

// ==================== TÀI KHOẢN ====================
export function useTaiKhoan() {
  return useSWR('/taikhoan/list', fetcher);
}