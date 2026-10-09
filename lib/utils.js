/**
 * ============================================================
 * UTILS — Helper format ngày/giờ/số
 * ============================================================
 * Luôn dùng múi giờ Việt Nam (Asia/Ho_Chi_Minh) để format.
 * Vercel server chạy UTC → phải dùng Intl.DateTimeFormat.
 * ============================================================
 */

const TZ = 'Asia/Ho_Chi_Minh';

// ==================== PARSE ====================
/** Parse ngày từ bất kỳ format → Date (UTC midnight). */
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

/** Parse giờ → chuỗi "HH:mm". */
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

// ==================== FORMAT (theo múi giờ VN) ====================
/** Format Date → "DD/MM/YYYY" theo múi giờ VN. */
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

/** Format Date → "HH:mm" theo múi giờ VN. */
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

// ==================== SO SÁNH NGÀY ====================
/** Kiểm tra 2 giá trị có cùng ngày (theo VN) không. */
export function cungNgay(a, b) {
  const s1 = formatNgayVN(a);
  const s2 = formatNgayVN(b);
  return s1 && s2 && s1 === s2;
}

// ==================== TẠO DATE TỪ NGÀY + GIỜ VN ====================
/**
 * Tạo Date từ ngày VN + giờ VN.
 * VN = UTC+7 → trừ 7 giờ để ra UTC.
 *
 * @param {string|Date} ngay "DD/MM/YYYY" hoặc Date
 * @param {string} gio "HH:mm"
 * @returns {Date} Date ở UTC equivalent
 */
export function taoDateVN(ngay, gio) {
  // Lấy Y/M/D
  let y, m, d;
  if (ngay instanceof Date) {
    const p = formatNgayVN(ngay).split('/').map(Number);
    [d, m, y] = p;
  } else {
    const p = String(ngay).split('/').map(Number);
    [d, m, y] = p;
  }

  // Lấy H:mm
  const [h, mi] = String(gio || '00:00').split(':').map(Number);

  // VN 08:30 = UTC 01:30 → Date.UTC(..., h - 7, mi)
  return new Date(Date.UTC(y, m - 1, d, (h || 0) - 7, mi || 0));
}

// ==================== LÀM TRÒN ====================
export async function lamTron(x) {
  const { getConfig } = await import('./config');
  const cfg = await getConfig();
  const heSo = Math.pow(10, cfg.SO_THAP_PHAN || 2);
  return Math.round(x * heSo) / heSo;
}