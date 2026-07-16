/**
 * api/auth/logout.js — POST /api/auth/logout
 */
import { COOKIE_NAME } from '../../lib/auth/jwt.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Clear the auth cookie by setting it to expire immediately
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict`
  );

  return res.status(200).json({ message: 'Logged out successfully' });
}
