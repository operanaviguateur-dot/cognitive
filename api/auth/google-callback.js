/**
 * api/auth/google-callback.js — GET /api/auth/google-callback
 * Handles Google OAuth2 callback, creates or finds user, sets JWT cookie
 */
import { findByGoogleId, findByEmail, create, update } from '../../lib/repositories/userRepo.js';
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
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { code, error } = req.query || {};

  if (error) {
    return res.redirect(302, '/login?error=oauth_denied');
  }

  if (!code) {
    return res.redirect(302, '/login?error=oauth_failed');
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const appUrl = process.env.APP_URL || 'http://localhost:3001';
    const redirectUri = `${appUrl}/api/auth/google-callback`;

    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      console.error('[google-callback] Token exchange failed:', await tokenRes.text());
      return res.redirect(302, '/login?error=oauth_failed');
    }

    const tokens = await tokenRes.json();

    // Get user profile from Google
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!profileRes.ok) {
      return res.redirect(302, '/login?error=oauth_failed');
    }

    const profile = await profileRes.json();
    const { id: googleId, email, name } = profile;

    // Find or create user
    let user = await findByGoogleId(googleId);

    if (!user) {
      // Check if email already exists (link accounts)
      user = await findByEmail(email);
      if (user) {
        await update(user.id, { google_id: googleId, email_verified: true });
        user = { ...user, google_id: googleId, email_verified: true };
      } else {
        user = await create({
          email,
          google_id: googleId,
          email_verified: true,
          role: 'user',
        });
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
