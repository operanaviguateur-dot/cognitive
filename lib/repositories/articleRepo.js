/**
 * lib/repositories/articleRepo.js — Article CRUD operations
 */
import { query } from '../db.js';

function mapArticle(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    content: row.content,
    summary: row.summary,
    category: row.category,
    tags: row.tags || [],
    image_url: row.image_url,
    status: row.status,
    priority: row.priority,
    ai_confidence_score: row.ai_confidence_score,
    ai_sentiment: row.ai_sentiment,
    ai_perspectives: row.ai_perspectives,
    ai_fact_checks: row.ai_fact_checks,
    views_count: row.views_count || 0,
    reading_time_min: row.reading_time_min,
    created_date: row.created_date,
    updated_date: row.updated_date,
  };
}

function buildOrderBy(sort) {
  if (!sort) return 'ORDER BY created_date DESC';
  const desc = sort.startsWith('-');
  const col = sort.replace(/^-/, '');
  const safe = ['created_date', 'updated_date', 'title', 'status', 'priority', 'views_count', 'sort_order'].includes(col)
    ? col : 'created_date';
  return `ORDER BY ${safe} ${desc ? 'DESC' : 'ASC'}`;
}

export async function filter(filterObj = {}, sort = '-created_date', limit = 50) {
  const conditions = [];
  const values = [];
  let i = 1;

  if (filterObj.status) { conditions.push(`status = $${i++}`); values.push(filterObj.status); }
  if (filterObj.category) { conditions.push(`category = $${i++}`); values.push(filterObj.category); }
  if (filterObj.priority) { conditions.push(`priority = $${i++}`); values.push(filterObj.priority); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const order = buildOrderBy(sort);
  values.push(Math.min(parseInt(limit) || 50, 200));

  const { rows } = await query(
    `SELECT * FROM articles ${where} ${order} LIMIT $${i}`,
    values
  );
  return rows.map(mapArticle);
}

export async function getById(id) {
  const { rows } = await query('SELECT * FROM articles WHERE id = $1', [id]);
  return mapArticle(rows[0]);
}

export async function create(data) {
  const { rows } = await query(
    `INSERT INTO articles
      (title, subtitle, content, summary, category, tags, image_url, status, priority,
       ai_confidence_score, ai_sentiment, ai_perspectives, ai_fact_checks, views_count, reading_time_min)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
     RETURNING *`,
    [
      data.title,
      data.subtitle || null,
      data.content,
      data.summary || null,
      data.category,
      JSON.stringify(data.tags || []),
      data.image_url || null,
      data.status || 'brouillon',
      data.priority || 'normale',
      data.ai_confidence_score || null,
      data.ai_sentiment || null,
      data.ai_perspectives ? JSON.stringify(data.ai_perspectives) : null,
      data.ai_fact_checks ? JSON.stringify(data.ai_fact_checks) : null,
      data.views_count || 0,
      data.reading_time_min || null,
    ]
  );
  return mapArticle(rows[0]);
}

export async function update(id, data) {
  const fields = [];
  const values = [];
  let i = 1;

  const jsonFields = new Set(['tags', 'ai_perspectives', 'ai_fact_checks']);
  const allowed = [
    'title', 'subtitle', 'content', 'summary', 'category', 'tags', 'image_url',
    'status', 'priority', 'ai_confidence_score', 'ai_sentiment', 'ai_perspectives',
    'ai_fact_checks', 'views_count', 'reading_time_min',
  ];

  for (const key of allowed) {
    if (key in data) {
      fields.push(`${key} = $${i++}`);
      values.push(jsonFields.has(key) ? JSON.stringify(data[key]) : data[key]);
    }
  }

  if (fields.length === 0) return getById(id);

  values.push(id);
  const { rows } = await query(
    `UPDATE articles SET ${fields.join(', ')}, updated_date = NOW() WHERE id = $${i} RETURNING *`,
    values
  );
  return mapArticle(rows[0]);
}

export async function deleteById(id) {
  await query('DELETE FROM articles WHERE id = $1', [id]);
}
