/**
 * ============================================================
 * AUTH — JWT token
 * ============================================================
 * Dùng `jose` (Edge + Node compatible).
 * Token sống 8 giờ.
 * ============================================================
 */

import { SignJWT, jwtVerify } from 'jose';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-do-not-use'
);

const TOKEN_TTL = '8h';

/**
 * Ký JWT với payload user.
 * @param {Object} user { role, maNV, hoTen }
 * @returns {Promise<string>} Token
 */
export async function signToken(user) {
  return await new SignJWT(user)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(secret);
}

/**
 * Verify token.
 * @param {string} token
 * @returns {Promise<Object|null>} payload hoặc null nếu invalid
 */
export async function verifyToken(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (err) {
    return null;
  }
}

/**
 * Lấy user từ request header.
 * Client gửi: Authorization: Bearer <token>
 * @param {Request} request
 * @returns {Promise<Object|null>}
 */
export async function getUserFromRequest(request) {
  const auth = request.headers.get('authorization') || '';
  const token = auth.replace('Bearer ', '').trim();
  return await verifyToken(token);
}