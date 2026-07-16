/**
 * api/auth/[action].js
 * Single Serverless Function for ALL /api/auth/* routes.
 * Routes by extracting the action from the URL path.
 * Compatible with Vercel Hobby (counts as 1 function).
 */
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import {
  findByEmail,
  findById,
  findByGoogleId,
  findByResetToken,
  create,
  update,
} from '../../lib/repositories/userRepo.js';
import { signToken, verifyToken, COOKIE_NAME, COOKIE_OPTIONS } from '../../lib/auth/jwt.js';

// ─── Helpers ────────────────────────────────────────────────────────────────

function serializeCookie(name, value, options) {
  let cookie = `${name}=${encodeURIComponent(value)}`;
  if (options.httpOnly) cookie += '; HttpOnly';
  if (options.secure) cookie += '; Secure';
  if (options.sameSite) cookie += `; SameSite=${options.sameSite}`;
  if (options.path) cookie += `; Path=${options.path}`;
  if (options.maxAge) cookie += `; Max-Age=${Math.floor(options.maxAge / 1000)}`;
  return cookie;
}

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

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

async function sendOTPEmail(email, otp) {
  if (!process.env.SMTP_USER) {
    console.warn('[auth] SMTP not configured. OTP:', otp);
    return;
  }
  const transporter = getTransporter();
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: 'Votre code de vérification – Cognitive Chronicle',
    html: `
      <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">Vérifiez votre email</h2>
        <p>Votre code de vérification est :</p>
        <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #6366f1; margin: 20px 0;">
          ${otp}
        </div>
        <p style="color: #666;">Ce code expire dans 15 minutes.</p>
      </div>
    `,
  });
}

// ─── Route Handlers ──────────────────────────────────────────────────────────

async function handleLogin(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

  try {
    const user = await findByEmail(email.toLowerCase().trim());
    if (!user || !user.password_hash) return res.status(401).json({ message: 'Invalid email or password' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ message: 'Invalid email or password' });

    if (!user.email_verified) {
      return res.status(403).json({ message: 'Please verify your email before logging in', code: 'EMAIL_NOT_VERIFIED' });
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role });
    res.setHeader('Set-Cookie', serializeCookie(COOKIE_NAME, token, COOKIE_OPTIONS));
    return res.status(200).json({ user: { id: user.id, email: user.email, role: user.role } });
  } catch (err) {
    console.error('[auth/login]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function handleRegister(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });
  if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters' });

  try {
    const existing = await findByEmail(email.toLowerCase().trim());
    if (existing) return res.status(409).json({ message: 'An account with this email already exists' });

    const password_hash = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000);

    const user = await create({ email: email.toLowerCase().trim(), password_hash, role: 'user', email_verified: false });
    await update(user.id, { otp_code: otp, otp_expires_at: otpExpiry });
    await sendOTPEmail(user.email, otp);

    return res.status(201).json({ message: 'Account created. Please check your email for the verification code.' });
  } catch (err) {
    console.error('[auth/register]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function handleMe(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });
  const cookies = parseCookies(req);
  const token = cookies[COOKIE_NAME];
  if (!token) return res.status(401).json({ message: 'Not authenticated' });

  try {
    const payload = verifyToken(token);
    const user = await findById(payload.id);
    if (!user) return res.status(401).json({ message: 'User not found' });
    return res.status(200).json({ id: user.id, email: user.email, role: user.role });
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

async function handleLogout(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict`);
  return res.status(200).json({ message: 'Logged out successfully' });
}

async function handleVerifyOtp(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  const { email, otpCode } = req.body || {};
  if (!email || !otpCode) return res.status(400).json({ message: 'Email and OTP code are required' });

  try {
    const user = await findByEmail(email.toLowerCase().trim());
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.otp_code !== otpCode.trim()) return res.status(400).json({ message: 'Invalid verification code' });
    if (!user.otp_expires_at || new Date(user.otp_expires_at) < new Date()) {
      return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
    }

    await update(user.id, { email_verified: true, otp_code: null, otp_expires_at: null });
    const token = signToken({ id: user.id, email: user.email, role: user.role });
    res.setHeader('Set-Cookie', serializeCookie(COOKIE_NAME, token, COOKIE_OPTIONS));
    return res.status(200).json({ user: { id: user.id, email: user.email, role: user.role } });
  } catch (err) {
    console.error('[auth/verify-otp]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function handleResendOtp(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    const user = await findByEmail(email.toLowerCase().trim());
    if (!user) return res.status(200).json({ message: 'If the account exists, a new code has been sent.' });
    if (user.email_verified) return res.status(400).json({ message: 'Email is already verified' });

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000);
    await update(user.id, { otp_code: otp, otp_expires_at: otpExpiry });
    await sendOTPEmail(user.email, otp);
    return res.status(200).json({ message: 'A new verification code has been sent.' });
  } catch (err) {
    console.error('[auth/resend-otp]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function handleForgotPassword(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    const user = await findByEmail(email.toLowerCase().trim());
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      const expiry = new Date(Date.now() + 60 * 60 * 1000);
      await update(user.id, { reset_token: token, reset_token_expires_at: expiry });

      const appUrl = process.env.APP_URL || 'http://localhost:5173';
      const resetLink = `${appUrl}/reset-password?token=${token}`;

      if (process.env.SMTP_USER) {
        const transporter = getTransporter();
        await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: user.email,
          subject: 'Réinitialisation de mot de passe – Cognitive Chronicle',
          html: `<div style="font-family:sans-serif;max-width:400px;margin:0 auto;"><h2>Réinitialiser votre mot de passe</h2><a href="${resetLink}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:white;text-decoration:none;border-radius:8px;margin:20px 0;">Réinitialiser</a><p style="color:#666;font-size:12px;">Ce lien expire dans 1 heure.</p></div>`,
        });
      } else {
        console.log('[forgot-password] Reset link (SMTP not configured):', resetLink);
      }
    }
  } catch (err) {
    console.error('[auth/forgot-password]', err);
  }
  return res.status(200).json({ message: 'If an account exists with that email, you will receive a reset link shortly.' });
}

async function handleResetPassword(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  const { token, newPassword } = req.body || {};
  if (!token || !newPassword) return res.status(400).json({ message: 'Token and new password are required' });
  if (newPassword.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters' });

  try {
    const user = await findByResetToken(token);
    if (!user) return res.status(400).json({ message: 'Invalid or expired reset link. Please request a new one.' });

    const password_hash = await bcrypt.hash(newPassword, 10);
    await update(user.id, { password_hash, reset_token: null, reset_token_expires_at: null });
    return res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('[auth/reset-password]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function handleGoogle(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return res.status(500).json({ message: 'Google OAuth is not configured' });

  const appUrl = process.env.APP_URL || 'http://localhost:3001';
  const redirectUri = `${appUrl}/api/auth/google-callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
  });
  return res.redirect(302, `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}

async function handleGoogleCallback(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });
  const { code, error } = req.query || {};
  if (error) return res.redirect(302, '/login?error=oauth_denied');
  if (!code) return res.redirect(302, '/login?error=oauth_failed');

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const appUrl = process.env.APP_URL || 'http://localhost:3001';
    const redirectUri = `${appUrl}/api/auth/google-callback`;

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: 'authorization_code' }),
    });
    if (!tokenRes.ok) return res.redirect(302, '/login?error=oauth_failed');

    const tokens = await tokenRes.json();
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!profileRes.ok) return res.redirect(302, '/login?error=oauth_failed');

    const profile = await profileRes.json();
    const { id: googleId, email } = profile;

    let user = await findByGoogleId(googleId);
    if (!user) {
      user = await findByEmail(email);
      if (user) {
        await update(user.id, { google_id: googleId, email_verified: true });
        user = { ...user, google_id: googleId };
      } else {
        user = await create({ email, google_id: googleId, email_verified: true, role: 'user' });
      }
    }

    const jwtToken = signToken({ id: user.id, email: user.email, role: user.role });
    res.setHeader('Set-Cookie', serializeCookie(COOKIE_NAME, jwtToken, COOKIE_OPTIONS));
    return res.redirect(302, '/');
  } catch (err) {
    console.error('[auth/google-callback]', err);
    return res.redirect(302, '/login?error=oauth_failed');
  }
}

// ─── Main Router ─────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  // Extract the action from URL: /api/auth/<action>
  const urlPath = (req.url || '').split('?')[0].replace(/\/$/, '');
  const action = urlPath.split('/').pop();

  switch (action) {
    case 'login':          return handleLogin(req, res);
    case 'register':       return handleRegister(req, res);
    case 'me':             return handleMe(req, res);
    case 'logout':         return handleLogout(req, res);
    case 'verify-otp':     return handleVerifyOtp(req, res);
    case 'resend-otp':     return handleResendOtp(req, res);
    case 'forgot-password':return handleForgotPassword(req, res);
    case 'reset-password': return handleResetPassword(req, res);
    case 'google':         return handleGoogle(req, res);
    case 'google-callback':return handleGoogleCallback(req, res);
    default:               return res.status(404).json({ message: `Unknown auth route: ${action}` });
  }
}
