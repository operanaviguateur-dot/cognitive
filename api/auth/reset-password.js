/**
 * api/auth/reset-password.js — POST /api/auth/reset-password
 */
import bcrypt from 'bcryptjs';
import { findByResetToken, update } from '../../lib/repositories/userRepo.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { token, newPassword } = req.body || {};

  if (!token || !newPassword) {
    return res.status(400).json({ message: 'Token and new password are required' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }

  try {
    const user = await findByResetToken(token);

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset link. Please request a new one.' });
    }

    const password_hash = await bcrypt.hash(newPassword, 10);

    await update(user.id, {
      password_hash,
      reset_token: null,
      reset_token_expires_at: null,
    });

    return res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('[auth/reset-password]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
