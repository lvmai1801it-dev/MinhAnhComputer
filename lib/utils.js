/**
 * ============================================================
 * UTILS — Helper format ngày/giờ/số theo múi giờ Việt Nam
 * ============================================================
 * Vercel server chạy UTC → mọi hàm format PHẢI dùng
 * Intl.DateTimeFormat với timeZone: 'Asia/Ho_Chi_Minh'.
 * ============================================================
 */

const TZ = 'Asia/Ho_Chi_Minh';

// ==================== FORMAT THEO GIỜ VN ====================
/**
 * Format Date → "DD/MM/YYYY" theo múi giờ VN.
 * An toàn cho mọi nguồn Date (UTC, local, Sheet).
 */
export function formatNgayVN(val) {
  if (!val) return '';
  const d = val instanceof Date ? val : new Date(val);
  if (isNaN(d.getTime())) return '';

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
 * Format Date → "HH:mm" theo múi giờ VN.
 */
export function formatGioVN(val) {
  if (!val) return '';
  const d = val instanceof Date ? val : new Date(val);
  if (isNaN(d.getTime())) return '';

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d);

  const map = {};
  parts.forEach((p) => { map[p.type] = p.value; });
  const h = map.hour === '24' ? '00' : map.hour;
  return `${h}:${map.minute}`;
}

// ==================== PARSE ====================
/**
 * Parse ngày từ bất kỳ format → Date (UTC midnight).
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
 * Nếu là Date → format theo VN.
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
 *
 * VD: "09/10/2026" + "16:38" (VN) → Date tương đương 09:38 UTC.
 *
 * @param {string|Date} ngay "DD/MM/YYYY" hoặc Date
 * @param {string} gio "HH:mm"
 * @returns {Date}
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