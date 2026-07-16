/**
 * api/auth/register.js — POST /api/auth/register
 */
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { findByEmail, create } from '../../lib/repositories/userRepo.js';
import { update } from '../../lib/repositories/userRepo.js';

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendOTPEmail(email, otp) {
  if (!process.env.SMTP_USER) {
    console.warn('[register] SMTP not configured. OTP:', otp);
    return;
  }
  const transporter = getTransporter();
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: 'Votre code de vérification — Cognitive Chronicle',
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }

  try {
    const existing = await findByEmail(email.toLowerCase().trim());
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    const user = await create({
      email: email.toLowerCase().trim(),
      password_hash,
      role: 'user',
      email_verified: false,
    });

    // Store OTP
    await update(user.id, { otp_code: otp, otp_expires_at: otpExpiry });

    // Send OTP email
    await sendOTPEmail(user.email, otp);

    return res.status(201).json({ message: 'Account created. Please check your email for the verification code.' });
  } catch (err) {
    console.error('[auth/register]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
