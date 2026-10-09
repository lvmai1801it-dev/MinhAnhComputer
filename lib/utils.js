/**
 * ============================================================
 * UTILS — Helper format ngày/giờ/số
 * ============================================================
 * Format chuẩn toàn hệ thống:
 *   - Ngày:  DD/MM/YYYY    (VD: 18/09/2026)
 *   - Giờ:   HH:mm         (VD: 08:30)
 *   - Số:    raw number    (VD: 8000000)
 *
 * Code đọc được cả VN và EN format,
 * nhưng khi ghi vào Sheet luôn dùng format chuẩn trên.
 * ============================================================
 */

// ==================== HẰNG SỐ FORMAT ====================
export const FORMAT_NGAY = 'DD/MM/YYYY';
export const FORMAT_GIO = 'HH:mm';

// ==================== PARSE NGÀY ====================
/**
 * Parse ngày từ bất kỳ format → Date object.
 * Hỗ trợ:
 *   "18/09/2026"          → Date(2026, 8, 18)
 *   "18/09/2026 8:30:00"  → Date(2026, 8, 18)
 *   "2026-09-18"          → Date(2026, 8, 18)
 *   Date object           → chính nó
 */
export function parseNgay(val) {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;

  const s = String(val).trim();

  // Format DD/MM/YYYY (có thể kèm giờ)
  const vnMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (vnMatch) {
    const d = Number(vnMatch[1]);
    const m = Number(vnMatch[2]) - 1;
    const y = Number(vnMatch[3]);
    return new Date(y, m, d);
  }

  // Format YYYY-MM-DD (có thể kèm giờ)
  const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const y = Number(isoMatch[1]);
    const m = Number(isoMatch[2]) - 1;
    const d = Number(isoMatch[3]);
    return new Date(y, m, d);
  }

  return null;
}

// ==================== PARSE GIỜ ====================
/**
 * Parse giờ từ bất kỳ format → chuỗi "HH:mm".
 * Hỗ trợ:
 *   "08:30"                → "08:30"
 *   "8:30"                 → "08:30"
 *   "18/09/2026 8:30:00"   → "08:30"
 *   Date object            → "HH:mm"
 */
export function parseGio(val) {
  if (!val) return '';

  if (val instanceof Date) {
    if (isNaN(val.getTime())) return '';
    const h = String(val.getHours()).padStart(2, '0');
    const m = String(val.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }

  const s = String(val).trim();
  if (!s) return '';

  // Match HH:mm ở bất kỳ đâu trong chuỗi
  const m = s.match(/(\d{1,2}):(\d{2})/);
  if (m) {
    return String(m[1]).padStart(2, '0') + ':' + m[2];
  }

  return '';
}

// ==================== PARSE SỐ ====================
/**
 * Parse số từ bất kỳ format → number.
 * Hỗ trợ:
 *   "8.000.000"      → 8000000
 *   "300.000,00"     → 300000
 *   "10.000.000,50"  → 10000000.5
 *   "8000000"        → 8000000
 *   "2,00"           → 2
 *   8000000          → 8000000
 *   "" / null        → 0
 */
export function parseSo(val) {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;

  let s = String(val).trim();
  if (!s) return 0;

  // Bỏ dấu . (ngăn nghìn VN), đổi , thành . (thập phân VN)
  // VD: "8.000.000,50" → "8000000.50"
  if (s.includes(',')) {
    s = s.replace(/\./g, '').replace(/,/g, '.');
  }

  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

// ==================== FORMAT NGÀY ĐỂ GHI SHEET ====================
/**
 * Date → chuỗi "DD/MM/YYYY" (format VN).
 */
export function formatNgayVN(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';

  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * Date → chuỗi "HH:mm".
 */
export function formatGioVN(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';

  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mi}`;
}

// ==================== SO SÁNH NGÀY ====================
/**
 * Kiểm tra 2 giá trị ngày có cùng ngày không.
 */
export function cungNgay(a, b) {
  const d1 = parseNgay(a);
  const d2 = parseNgay(b);
  if (!d1 || !d2) return false;
  return d1.getFullYear() === d2.getFullYear()
    && d1.getMonth() === d2.getMonth()
    && d1.getDate() === d2.getDate();
}

// ==================== LÀM TRÒN ====================
export async function lamTron(x) {
  const { getConfig } = await import('./config');
  const cfg = await getConfig();
  const heSo = Math.pow(10, cfg.SO_THAP_PHAN || 2);
  return Math.round(x * heSo) / heSo;
}