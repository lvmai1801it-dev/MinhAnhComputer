/**
 * Hook cho các action thay đổi dữ liệu (POST/PUT/DELETE).
 * Tự quản lý loading + message.
 *
 * Cách dùng:
 *   const { run, loading } = useApiAction();
 *   const r = await run(() => api.post('/nhanvien', info));
 *   if (r.success) alert(r.message);
 */

'use client';
import { useState, useCallback } from 'react';

export function useApiAction() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const run = useCallback(async (apiCallFn) => {
    setLoading(true);
    setMessage(null);
    const result = await apiCallFn();
    setLoading(false);

    setMessage({
      type: result.success ? 'success' : 'error',
      text: result.message || (result.success ? 'Thành công' : 'Lỗi'),
    });

    // Tự ẩn sau 4s
    setTimeout(() => setMessage(null), 4000);

    return result;
  }, []);

  return { run, loading, message };
}