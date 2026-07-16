/**
 * lib/repositories/commentRepo.js — ArticleComment CRUD operations
 */
import { query } from '../db.js';

function mapComment(row) {
  if (!row) return null;
  return {
    id: row.id,
    article_id: row.article_id,
    author_name: row.author_name,
    content: row.content,
    ai_sentiment: row.ai_sentiment,
    is_flagged: row.is_flagged,
    created_date: row.created_date,
  };
}

function buildOrderBy(sort) {
  if (!sort) return 'ORDER BY created_date DESC';
  const desc = sort.startsWith('-');
  const col = sort.replace(/^-/, '');
  const safe = ['created_date', 'author_name'].includes(col) ? col : 'created_date';
  return `ORDER BY ${safe} ${desc ? 'DESC' : 'ASC'}`;
}

export async function getByArticleId(articleId, sort = '-created_date', limit = 100) {
  const order = buildOrderBy(sort);
  const { rows } = await query(
    `SELECT * FROM article_comments WHERE article_id = $1 ${order} LIMIT $2`,
    [articleId, Math.min(parseInt(limit) || 100, 500)]
  );
  return rows.map(mapComment);
}

export async function create(data) {
  const { rows } = await query(
    `INSERT INTO article_comments (article_id, author_name, content, ai_sentiment, is_flagged)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [
      data.article_id,
      data.author_name,
      data.content,
      data.ai_sentiment || null,
      data.is_flagged || false,
    ]
  );
  return mapComment(rows[0]);
}

export async function update(id, data) {
  const fields = [];
  const values = [];
  let i = 1;

  if (data.ai_sentiment !== undefined) { fields.push(`ai_sentiment = $${i++}`); values.push(data.ai_sentiment); }
  if (data.is_flagged !== undefined) { fields.push(`is_flagged = $${i++}`); values.push(data.is_flagged); }
  if (data.content !== undefined) { fields.push(`content = $${i++}`); values.push(data.content); }

  if (fields.length === 0) return null;

  values.push(id);
  const { rows } = await query(
    `UPDATE article_comments SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
    values
  );
  return mapComment(rows[0]);
}

export async function deleteById(id) {
  await query('DELETE FROM article_comments WHERE id = $1', [id]);
}
