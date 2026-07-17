/**
 * api/articles.js — GET /api/articles | POST /api/articles | GET/PUT/DELETE /api/articles/:id
 * Collection & individual endpoint (unified).
 */
import { filter, getById, create, update, deleteById } from '../lib/repositories/articleRepo.js';
import { optionalAuth, isAdmin } from '../lib/auth/middleware.js';

function isInvalidUUID(err) {
  return err?.code === '22P02' || err?.message?.includes('invalid input syntax for type uuid');
}

export default async function handler(req, res) {
  await optionalAuth(req, res, null);

  const id = req.query?.id; // populated by Vercel rewrite or local server.js

  if (req.method === 'GET') {
    if (id) {
      try {
        const article = await getById(id);
        if (!article) return res.status(404).json({ message: 'Article not found' });
        return res.status(200).json(article);
      } catch (err) {
        if (isInvalidUUID(err)) return res.status(404).json({ message: 'Article not found' });
        console.error('[articles/:id GET]', err);
        return res.status(500).json({ message: 'Failed to fetch article' });
      }
    } else {
      try {
        const { status, category, q, sort = '-created_date', limit = '50' } = req.query || {};
        const filterObj = {};
        if (status) filterObj.status = status;
        if (category) filterObj.category = category;
        if (q) filterObj.q = q;

        const articles = await filter(filterObj, sort, parseInt(limit));
        return res.status(200).json(articles);
      } catch (err) {
        console.error('[articles GET]', err);
        return res.status(500).json({ message: 'Failed to fetch articles' });
      }
    }
  }

  if (req.method === 'POST') {
    if (!isAdmin(req)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const article = await create(req.body);
      return res.status(201).json(article);
    } catch (err) {
      console.error('[articles POST]', err);
      return res.status(500).json({ message: 'Failed to create article' });
    }
  }

  if (req.method === 'PUT') {
    if (!isAdmin(req)) return res.status(403).json({ message: 'Admin access required' });
    if (!id) return res.status(400).json({ message: 'Article ID is required' });
    try {
      const article = await update(id, req.body);
      return res.status(200).json(article);
    } catch (err) {
      if (isInvalidUUID(err)) return res.status(404).json({ message: 'Article not found' });
      console.error('[articles/:id PUT]', err);
      return res.status(500).json({ message: 'Failed to update article' });
    }
  }

  if (req.method === 'DELETE') {
    if (!isAdmin(req)) return res.status(403).json({ message: 'Admin access required' });
    if (!id) return res.status(400).json({ message: 'Article ID is required' });
    try {
      await deleteById(id);
      return res.status(200).json({ message: 'Article deleted' });
    } catch (err) {
      if (isInvalidUUID(err)) return res.status(404).json({ message: 'Article not found' });
      console.error('[articles/:id DELETE]', err);
      return res.status(500).json({ message: 'Failed to delete article' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
