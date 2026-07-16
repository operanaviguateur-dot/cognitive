/**
 * lib/auth/middleware.js — Auth middleware for API routes
 */
import { verifyToken, COOKIE_NAME } from './jwt.js';
import { findById } from '../repositories/userRepo.js';

/**
 * Parse cookies from request headers (compatible with Vercel Functions)
 */
function parseCookies(req) {
  // If cookie-parser middleware already ran (Express dev server)
  if (req.cookies) return req.cookies;
  // Manual parse for Vercel
  const cookieHeader = req.headers.cookie || '';
  return Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [k, ...v] = c.trim().split('=');
      return [k, decodeURIComponent(v.join('='))];
    }).filter(([k]) => k)
  );
}

/**
 * Extract JWT from cookie or Authorization Bearer header
 */
function extractToken(req) {
  const cookies = parseCookies(req);
  if (cookies[COOKIE_NAME]) return cookies[COOKIE_NAME];
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7);
  return null;
}

/**
 * Require authentication — attaches req.user or returns 401
 */
export async function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  try {
    const payload = verifyToken(token);
    const user = await findById(payload.id);
    if (!user) return res.status(401).json({ message: 'User not found' });
    req.user = user;
    if (next) next();
    return true;
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

/**
 * Optional auth — attaches req.user if valid token present, never fails
 */
export async function optionalAuth(req, res, next) {
  const token = extractToken(req);
  if (token) {
    try {
      const payload = verifyToken(token);
      req.user = await findById(payload.id);
    } catch {
      req.user = null;
    }
  }
  if (next) next();
}

/**
 * Check admin access: JWT role=admin OR X-Admin-Code header matches env var
 */
export function isAdmin(req) {
  const adminCode = process.env.ADMIN_CODE;
  const headerCode = req.headers['x-admin-code'] || '';
  if (adminCode && headerCode === adminCode) return true;
  if (req.user && req.user.role === 'admin') return true;
  return false;
}
