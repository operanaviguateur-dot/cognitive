/**
 * api/articles/[id].js — GET|PUT|DELETE /api/articles/:id
 */
import { getById, update, deleteById } from '../../lib/repositories/articleRepo.js';
import { optionalAuth, isAdmin } from '../../lib/auth/middleware.js';

export default async function handler(req, res) {
  await optionalAuth(req, res, null);

  // Extract id from URL path: /api/articles/[id]
  const urlParts = req.url?.split('?')[0].split('/').filter(Boolean);
  const id = urlParts?.[urlParts.length - 1];

  if (!id || id === 'index') {
    return res.status(400).json({ message: 'Article ID is required' });
  }

  if (req.method === 'GET') {
    try {
      const article = await getById(id);
      if (!article) return res.status(404).json({ message: 'Article not found' });
      return res.status(200).json(article);
    } catch (err) {
      console.error('[articles/[id] GET]', err);
      return res.status(500).json({ message: 'Failed to fetch article' });
    }
  }

  if (req.method === 'PUT') {
    if (!isAdmin(req)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const article = await update(id, req.body);
      if (!article) return res.status(404).json({ message: 'Article not found' });
      return res.status(200).json(article);
    } catch (err) {
      console.error('[articles/[id] PUT]', err);
      return res.status(500).json({ message: 'Failed to update article' });
    }
  }

  if (req.method === 'DELETE') {
    if (!isAdmin(req)) return res.status(403).json({ message: 'Admin access required' });
    try {
      await deleteById(id);
      return res.status(200).json({ message: 'Article deleted' });
    } catch (err) {
      console.error('[articles/[id] DELETE]', err);
      return res.status(500).json({ message: 'Failed to delete article' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
