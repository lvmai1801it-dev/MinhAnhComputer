/**
 * ============================================================
 * UTILS — Helper format ngày/giờ/số theo múi giờ Việt Nam
 * ============================================================
 * Vercel server chạy UTC → mọi hàm format PHẢI dùng
 * Intl.DateTimeFormat với timeZone: 'Asia/Ho_Chi_Minh'.
 *
 * ⚠️ QUAN TRỌNG: KHÔNG dùng `new Date(string)` cho chuỗi DD/MM/YYYY
 * vì JS parse nhầm thành MM/DD/YYYY. Phải match regex thủ công.
 * ============================================================
 */

const TZ = 'Asia/Ho_Chi_Minh';

// ==================== FORMAT THEO GIỜ VN ====================
/**
 * Format Date/string → "DD/MM/YYYY".
 * - Nếu input là string DD/MM/YYYY → chuẩn hóa và trả về luôn
 * - Nếu input là string YYYY-MM-DD → chuyển sang DD/MM/YYYY
 * - Nếu input là Date → dùng Intl format theo VN
 */
export function formatNgayVN(val) {
  if (!val) return '';

  // ⭐ Nếu là string → match thủ công, KHÔNG dùng new Date()
  if (typeof val === 'string') {
    const s = val.trim();

    // DD/MM/YYYY (có thể kèm giờ)
    const vnMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (vnMatch) {
      const d = String(vnMatch[1]).padStart(2, '0');
      const m = String(vnMatch[2]).padStart(2, '0');
      return `${d}/${m}/${vnMatch[3]}`;
    }

    // YYYY-MM-DD (có thể kèm giờ)
    const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
    }

    // Fallback: thử new Date
    const d = new Date(s);
    if (isNaN(d.getTime())) return '';
    return formatDateObjVN_(d);
  }

  // Nếu là Date object
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return '';
    return formatDateObjVN_(val);
  }

  return '';
}

/** Helper: format Date object → DD/MM/YYYY theo VN */
function formatDateObjVN_(d) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).formatToParts(d);

  const map = {};
  parts.forEach((p) => { map[p.type] = p.value; });
  return `${map.day}/${map.month}/${map.year}`;
}

/**
 * Format Date/string → "HH:mm".
 * - Nếu là string "HH:mm" → chuẩn hóa và trả về luôn
 * - Nếu là Date → dùng Intl format theo VN
 */
export function formatGioVN(val) {
  if (!val) return '';

  // String "HH:mm" → trả về luôn
  if (typeof val === 'string') {
    const s = val.trim();
    const m = s.match(/(\d{1,2}):(\d{2})/);
    if (m) {
      return String(m[1]).padStart(2, '0') + ':' + m[2];
    }
    return '';
  }

  // Date → format theo VN
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return '';
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: TZ,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(val);
    const map = {};
    parts.forEach((p) => { map[p.type] = p.value; });
    const h = map.hour === '24' ? '00' : map.hour;
    return `${h}:${map.minute}`;
  }

  return '';
}

// ==================== PARSE ====================
/**
 * Parse ngày → Date object (UTC midnight).
 */
export function parseNgay(val) {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;

  const s = String(val).trim();

  // DD/MM/YYYY
  const vnMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (vnMatch) {
    const d = Number(vnMatch[1]);
    const m = Number(vnMatch[2]) - 1;
    const y = Number(vnMatch[3]);
    return new Date(Date.UTC(y, m, d));
  }

  // YYYY-MM-DD
  const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const y = Number(isoMatch[1]);
    const m = Number(isoMatch[2]) - 1;
    const d = Number(isoMatch[3]);
    return new Date(Date.UTC(y, m, d));
  }

  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Parse giờ → chuỗi "HH:mm".
 */
export function parseGio(val) {
  if (!val) return '';
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return '';
    return formatGioVN(val);
  }
  const s = String(val).trim();
  const m = s.match(/(\d{1,2}):(\d{2})/);
  if (m) return String(m[1]).padStart(2, '0') + ':' + m[2];
  return '';
}

/** Parse số VN → number. */
export function parseSo(val) {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;

  let s = String(val).trim();
  if (!s) return 0;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(/,/g, '.');
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

// ==================== SO SÁNH NGÀY ====================
/**
 * Kiểm tra 2 giá trị có cùng ngày (theo VN) không.
 * So sánh bằng chuỗi "DD/MM/YYYY" → an toàn múi giờ.
 */
export function cungNgay(a, b) {
  const s1 = formatNgayVN(a);
  const s2 = formatNgayVN(b);
  return s1 && s2 && s1 === s2;
}

// ==================== TẠO DATE TỪ NGÀY + GIỜ VN ====================
/**
 * Tạo Date object từ ngày VN + giờ VN.
 * VN = UTC+7 → giờ UTC = giờ VN - 7.
 */
export function taoDateVN(ngay, gio) {
  let dStr;
  if (ngay instanceof Date) {
    dStr = formatNgayVN(ngay);
  } else {
    dStr = String(ngay);
  }

  const [d, m, y] = dStr.split('/').map(Number);
  const [h, mi] = String(gio || '00:00').split(':').map(Number);

  return new Date(Date.UTC(y, m - 1, d, (h || 0) - 7, mi || 0));
}

// ==================== LÀM TRÒN ====================
export async function lamTron(x) {
  const { getConfig } = await import('./config');
  const cfg = await getConfig();
  const heSo = Math.pow(10, cfg.SO_THAP_PHAN || 2);
  return Math.round(x * heSo) / heSo;
}