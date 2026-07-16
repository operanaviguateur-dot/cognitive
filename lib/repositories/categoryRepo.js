/**
 * lib/repositories/categoryRepo.js — Category CRUD operations
 */
import { query } from '../db.js';

function mapCategory(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    sort_order: row.sort_order,
    created_date: row.created_date,
  };
}

function buildOrderBy(sort) {
  if (!sort) return 'ORDER BY sort_order ASC';
  const desc = sort.startsWith('-');
  const col = sort.replace(/^-/, '');
  const safe = ['name', 'slug', 'sort_order', 'created_date'].includes(col) ? col : 'sort_order';
  return `ORDER BY ${safe} ${desc ? 'DESC' : 'ASC'}`;
}

export async function list(sort = 'sort_order', limit = 100) {
  const order = buildOrderBy(sort);
  const { rows } = await query(
    `SELECT * FROM categories ${order} LIMIT $1`,
    [Math.min(parseInt(limit) || 100, 500)]
  );
  return rows.map(mapCategory);
}

export async function getById(id) {
  const { rows } = await query('SELECT * FROM categories WHERE id = $1', [id]);
  return mapCategory(rows[0]);
}

export async function create(data) {
  const { rows } = await query(
    'INSERT INTO categories (name, slug, sort_order) VALUES ($1, $2, $3) RETURNING *',
    [data.name, data.slug, data.sort_order ?? 0]
  );
  return mapCategory(rows[0]);
}

export async function update(id, data) {
  const fields = [];
  const values = [];
  let i = 1;

  if (data.name !== undefined) { fields.push(`name = $${i++}`); values.push(data.name); }
  if (data.slug !== undefined) { fields.push(`slug = $${i++}`); values.push(data.slug); }
  if (data.sort_order !== undefined) { fields.push(`sort_order = $${i++}`); values.push(data.sort_order); }

  if (fields.length === 0) return getById(id);

  values.push(id);
  const { rows } = await query(
    `UPDATE categories SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
    values
  );
  return mapCategory(rows[0]);
}

export async function deleteById(id) {
  await query('DELETE FROM categories WHERE id = $1', [id]);
}
