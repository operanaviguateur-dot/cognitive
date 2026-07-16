/**
 * api/articles/index.js — GET /api/articles | POST /api/articles
 */
import { filter, create } from '../../lib/repositories/articleRepo.js';
import { optionalAuth, isAdmin } from '../../lib/auth/middleware.js';

export default async function handler(req, res) {
  await optionalAuth(req, res, null);

  if (req.method === 'GET') {
    try {
      const { status, category, sort = '-created_date', limit = '50' } = req.query || {};
      const filterObj = {};
      if (status) filterObj.status = status;
      if (category) filterObj.category = category;

      const articles = await filter(filterObj, sort, parseInt(limit));
      return res.status(200).json(articles);
    } catch (err) {
      console.error('[articles/index GET]', err);
      return res.status(500).json({ message: 'Failed to fetch articles' });
    }
  }

  if (req.method === 'POST') {
    if (!isAdmin(req)) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    try {
      const article = await create(req.body);
      return res.status(201).json(article);
    } catch (err) {
      console.error('[articles/index POST]', err);
      return res.status(500).json({ message: 'Failed to create article' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
