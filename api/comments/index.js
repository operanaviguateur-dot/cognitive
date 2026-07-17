/**
 * api/comments.js — GET /api/comments | POST /api/comments
 * Collection endpoint: get comments for an article or post a new one.
 */
import { getByArticleId, create } from '../../lib/repositories/commentRepo.js';

function isInvalidUUID(err) {
  return err?.code === '22P02' || err?.message?.includes('invalid input syntax for type uuid');
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { article_id, sort = '-created_date', limit = '100' } = req.query || {};
    if (!article_id) return res.status(400).json({ message: 'article_id is required' });
    try {
      const comments = await getByArticleId(article_id, sort, parseInt(limit));
      return res.status(200).json(comments);
    } catch (err) {
      if (isInvalidUUID(err)) return res.status(200).json([]); // invalid UUID → no comments
      console.error('[comments GET]', err);
      return res.status(500).json({ message: 'Failed to fetch comments' });
    }
  }

  if (req.method === 'POST') {
    const { article_id, author_name, content, ai_sentiment } = req.body || {};
    if (!article_id || !author_name || !content) {
      return res.status(400).json({ message: 'article_id, author_name, and content are required' });
    }
    try {
      const comment = await create({ article_id, author_name, content, ai_sentiment });
      return res.status(201).json(comment);
    } catch (err) {
      console.error('[comments POST]', err);
      return res.status(500).json({ message: 'Failed to create comment' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
