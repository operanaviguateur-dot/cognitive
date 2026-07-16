/**
 * api/auth/forgot-password.js — POST /api/auth/forgot-password
 */
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { findByEmail, update } from '../../lib/repositories/userRepo.js';

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email } = req.body || {};
  if (!email) return res.status(400).json({ message: 'Email is required' });

  // Always return 200 to not reveal if email exists
  try {
    const user = await findByEmail(email.toLowerCase().trim());

    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await update(user.id, { reset_token: token, reset_token_expires_at: expiry });

      const appUrl = process.env.APP_URL || 'http://localhost:5173';
      const resetLink = `${appUrl}/reset-password?token=${token}`;

      if (process.env.SMTP_USER) {
        const transporter = getTransporter();
        await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: user.email,
          subject: 'Réinitialisation de mot de passe — Cognitive Chronicle',
          html: `
            <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto;">
              <h2 style="color: #1a1a2e;">Réinitialiser votre mot de passe</h2>
              <p>Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe. Ce lien expire dans 1 heure.</p>
              <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">
                Réinitialiser le mot de passe
              </a>
              <p style="color: #666; font-size: 12px;">Si vous n'avez pas demandé ce changement, ignorez cet email.</p>
            </div>
          `,
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
