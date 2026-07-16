/**
 * api/auth/me.js — GET /api/auth/me
 */
import { verifyToken, COOKIE_NAME } from '../../lib/auth/jwt.js';
import { findById } from '../../lib/repositories/userRepo.js';

function parseCookies(req) {
  if (req.cookies) return req.cookies;
  const cookieHeader = req.headers.cookie || '';
  return Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [k, ...v] = c.trim().split('=');
      return [k, decodeURIComponent(v.join('='))];
    }).filter(([k]) => k)
  );
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const cookies = parseCookies(req);
  const token = cookies[COOKIE_NAME];

  if (!token) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const payload = verifyToken(token);
    const user = await findById(payload.id);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    return res.status(200).json({
      id: user.id,
      email: user.email,
      role: user.role,
    });
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}
