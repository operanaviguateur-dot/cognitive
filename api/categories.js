/**
 * api/categories.js — GET /api/categories | POST /api/categories | PUT/DELETE /api/categories/:id
 * Collection & individual endpoint (unified).
 */
import { list, create, update, deleteById } from '../lib/repositories/categoryRepo.js';
import { optionalAuth, isAdmin } from '../lib/auth/middleware.js';

export default async function handler(req, res) {
  await optionalAuth(req, res, null);

  const id = req.query?.id; // populated by Vercel rewrite or local server.js

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

  if (req.method === 'PUT') {
    if (!isAdmin(req)) return res.status(403).json({ message: 'Admin access required' });
    if (!id) return res.status(400).json({ message: 'Category ID is required' });
    try {
      const category = await update(id, req.body);
      return res.status(200).json(category);
    } catch (err) {
      console.error('[categories PUT]', err);
      return res.status(500).json({ message: 'Failed to update category' });
    }
  }

  if (req.method === 'DELETE') {
    if (!isAdmin(req)) return res.status(403).json({ message: 'Admin access required' });
    if (!id) return res.status(400).json({ message: 'Category ID is required' });
    try {
      await deleteById(id);
      return res.status(200).json({ message: 'Category deleted' });
    } catch (err) {
      console.error('[categories DELETE]', err);
      return res.status(500).json({ message: 'Failed to delete category' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
