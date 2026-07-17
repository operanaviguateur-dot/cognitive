/**
 * api/categories.js — GET /api/categories | POST /api/categories
 * Collection endpoint: list categories (public) or create (admin).
 */
import { list, create } from '../../lib/repositories/categoryRepo.js';
import { optionalAuth, isAdmin } from '../../lib/auth/middleware.js';

export default async function handler(req, res) {
  await optionalAuth(req, res, null);

  if (req.method === 'GET') {
    try {
      const { sort = 'sort_order', limit = '100' } = req.query || {};
      const categories = await list(sort, parseInt(limit));
      return res.status(200).json(categories);
    } catch (err) {
      console.error('[categories GET]', err);
      return res.status(500).json({ message: 'Failed to fetch categories' });
    }
  }

  if (req.method === 'POST') {
    if (!isAdmin(req)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const category = await create(req.body);
      return res.status(201).json(category);
    } catch (err) {
      console.error('[categories POST]', err);
      return res.status(500).json({ message: 'Failed to create category' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
