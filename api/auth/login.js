/**
 * api/auth/login.js — POST /api/auth/login
 */
import bcrypt from 'bcryptjs';
import { findByEmail } from '../../lib/repositories/userRepo.js';
import { signToken, COOKIE_NAME, COOKIE_OPTIONS } from '../../lib/auth/jwt.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const user = await findByEmail(email.toLowerCase().trim());

    if (!user || !user.password_hash) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.email_verified) {
      return res.status(403).json({ message: 'Please verify your email before logging in', code: 'EMAIL_NOT_VERIFIED' });
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role });

    res.setHeader('Set-Cookie', serializeCookie(COOKIE_NAME, token, COOKIE_OPTIONS));

    return res.status(200).json({
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('[auth/login]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

function serializeCookie(name, value, options) {
  let cookie = `${name}=${encodeURIComponent(value)}`;
  if (options.httpOnly) cookie += '; HttpOnly';
  if (options.secure) cookie += '; Secure';
  if (options.sameSite) cookie += `; SameSite=${options.sameSite}`;
  if (options.path) cookie += `; Path=${options.path}`;
  if (options.maxAge) cookie += `; Max-Age=${Math.floor(options.maxAge / 1000)}`;
  return cookie;
}
