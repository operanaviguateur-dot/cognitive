/**
 * api/auth/verify-otp.js — POST /api/auth/verify-otp
 */
import { findByEmail, update } from '../../lib/repositories/userRepo.js';
import { signToken, COOKIE_NAME, COOKIE_OPTIONS } from '../../lib/auth/jwt.js';

function serializeCookie(name, value, options) {
  let cookie = `${name}=${encodeURIComponent(value)}`;
  if (options.httpOnly) cookie += '; HttpOnly';
  if (options.secure) cookie += '; Secure';
  if (options.sameSite) cookie += `; SameSite=${options.sameSite}`;
  if (options.path) cookie += `; Path=${options.path}`;
  if (options.maxAge) cookie += `; Max-Age=${Math.floor(options.maxAge / 1000)}`;
  return cookie;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, otpCode } = req.body || {};

  if (!email || !otpCode) {
    return res.status(400).json({ message: 'Email and OTP code are required' });
  }

  try {
    const user = await findByEmail(email.toLowerCase().trim());

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.otp_code !== otpCode.trim()) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    if (!user.otp_expires_at || new Date(user.otp_expires_at) < new Date()) {
      return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
    }

    // Verify user and clear OTP
    await update(user.id, {
      email_verified: true,
      otp_code: null,
      otp_expires_at: null,
    });

    const token = signToken({ id: user.id, email: user.email, role: user.role });
    res.setHeader('Set-Cookie', serializeCookie(COOKIE_NAME, token, COOKIE_OPTIONS));

    return res.status(200).json({
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('[auth/verify-otp]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
