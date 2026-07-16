/**
 * lib/repositories/userRepo.js — User CRUD operations
 */
import { query } from '../db.js';

function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    password_hash: row.password_hash,
    role: row.role,
    email_verified: row.email_verified,
    otp_code: row.otp_code,
    otp_expires_at: row.otp_expires_at,
    reset_token: row.reset_token,
    reset_token_expires_at: row.reset_token_expires_at,
    google_id: row.google_id,
    created_date: row.created_date,
  };
}

export async function findByEmail(email) {
  const { rows } = await query('SELECT * FROM users WHERE email = $1', [email]);
  return mapUser(rows[0]);
}

export async function findById(id) {
  const { rows } = await query('SELECT * FROM users WHERE id = $1', [id]);
  return mapUser(rows[0]);
}

export async function findByGoogleId(googleId) {
  const { rows } = await query('SELECT * FROM users WHERE google_id = $1', [googleId]);
  return mapUser(rows[0]);
}

export async function findByResetToken(token) {
  const { rows } = await query(
    'SELECT * FROM users WHERE reset_token = $1 AND reset_token_expires_at > NOW()',
    [token]
  );
  return mapUser(rows[0]);
}

export async function create(data) {
  const { rows } = await query(
    `INSERT INTO users (email, password_hash, role, email_verified, google_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      data.email,
      data.password_hash || null,
      data.role || 'user',
      data.email_verified || false,
      data.google_id || null,
    ]
  );
  return mapUser(rows[0]);
}

export async function update(id, data) {
  const fields = [];
  const values = [];
  let i = 1;

  const allowed = [
    'password_hash', 'role', 'email_verified', 'otp_code', 'otp_expires_at',
    'reset_token', 'reset_token_expires_at', 'google_id',
  ];

  for (const key of allowed) {
    if (key in data) {
      fields.push(`${key} = $${i++}`);
      values.push(data[key]);
    }
  }

  if (fields.length === 0) return findById(id);

  values.push(id);
  const { rows } = await query(
    `UPDATE users SET ${fields.join(', ')}, updated_date = NOW() WHERE id = $${i} RETURNING *`,
    values
  );
  return mapUser(rows[0]);
}
