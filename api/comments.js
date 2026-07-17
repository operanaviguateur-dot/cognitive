/**
 * api/comments.js — GET /api/comments | POST /api/comments | PUT/DELETE /api/comments/:id
 * Collection & individual endpoint (unified).
 */
import { getByArticleId, create, update, deleteById } from '../lib/repositories/commentRepo.js';
import { optionalAuth, isAdmin } from '../lib/auth/middleware.js';

function isInvalidUUID(err) {
  return err?.code === '22P02' || err?.message?.includes('invalid input syntax for type uuid');
}

export default async function handler(req, res) {
  await optionalAuth(req, res, null);

  const id = req.query?.id; // populated by Vercel rewrite or local server.js

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

  if (req.method === 'PUT') {
    if (!isAdmin(req)) return res.status(403).json({ message: 'Admin access required' });
    if (!id) return res.status(400).json({ message: 'Comment ID is required' });
    try {
      const comment = await update(id, req.body);
      return res.status(200).json(comment);
    } catch (err) {
      if (isInvalidUUID(err)) return res.status(404).json({ message: 'Comment not found' });
      console.error('[comments/:id PUT]', err);
      return res.status(500).json({ message: 'Failed to update comment' });
    }
  }

  if (req.method === 'DELETE') {
    if (!isAdmin(req)) return res.status(403).json({ message: 'Admin access required' });
    if (!id) return res.status(400).json({ message: 'Comment ID is required' });
    try {
      await deleteById(id);
      return res.status(200).json({ message: 'Comment deleted' });
    } catch (err) {
      if (isInvalidUUID(err)) return res.status(404).json({ message: 'Comment not found' });
      console.error('[comments/:id DELETE]', err);
      return res.status(500).json({ message: 'Failed to delete comment' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
