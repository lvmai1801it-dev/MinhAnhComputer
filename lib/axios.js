/**
 * ============================================================
 * AXIOS INSTANCE
 * ============================================================
 * Cấu hình dùng chung toàn app:
 *   - baseURL = /api  (tự trỏ về Next.js API routes)
 *   - Tự gắn token vào header Authorization
 *   - Tự logout khi gặp 401
 * ============================================================
 */

import axios from 'axios';

const instance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ============ REQUEST INTERCEPTOR ============
// Trước khi gửi request → gắn token vào header
instance.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ============ RESPONSE INTERCEPTOR ============
// Nếu response 401 → xóa token, đá về /login
instance.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default instance;