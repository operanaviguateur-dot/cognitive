/**
 * api/auth/google.js — GET /api/auth/google
 * Redirects to Google OAuth2 authorization page
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({ message: 'Google OAuth is not configured (GOOGLE_CLIENT_ID missing)' });
  }

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
