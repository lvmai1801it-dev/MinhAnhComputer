/**
 * ============================================================
 * API CLIENT
 * ============================================================
 * Wrapper gọi API — ngắn gọn, chuẩn hóa response.
 *
 * Mọi hàm đều trả về: { success, data?, message? }
 * Không cần try/catch ở component.
 *
 * Ví dụ:
 *   const r = await api.post('/nhanvien', { hoTen: 'A' });
 *   if (r.success) console.log(r.data);
 * ============================================================
 */

import axios from './axios';

/**
 * Xử lý response — trả về data hoặc message lỗi.
 */
async function handle(promise) {
  try {
    const res = await promise;
    return res.data;
  } catch (err) {
    // Lỗi HTTP đã có response body
    if (err.response?.data) return err.response.data;
    // Lỗi network / timeout
    return { success: false, message: 'Lỗi kết nối: ' + err.message };
  }
}

export const api = {
  /** GET /api<url>?params */
  get: (url, params) => handle(axios.get(url, { params })),

  /** POST /api<url> với body JSON */
  post: (url, data) => handle(axios.post(url, data)),

  /** PUT /api<url> với body JSON */
  put: (url, data) => handle(axios.put(url, data)),

  /** DELETE /api<url> */
  del: (url) => handle(axios.delete(url)),
};