/**
 * api/auth/resend-otp.js — POST /api/auth/resend-otp
 */
import { findByEmail, update } from '../../lib/repositories/userRepo.js';
import { sendOTPEmail } from './register.js';

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email } = req.body || {};
  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    const user = await findByEmail(email.toLowerCase().trim());
    if (!user) return res.status(200).json({ message: 'If the account exists, a new code has been sent.' });

    if (user.email_verified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

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
