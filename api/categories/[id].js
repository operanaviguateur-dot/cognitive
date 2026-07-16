/**
 * api/categories/[id].js — PUT|DELETE /api/categories/:id
 */
import { update, deleteById } from '../../lib/repositories/categoryRepo.js';
import { optionalAuth, isAdmin } from '../../lib/auth/middleware.js';

export default async function handler(req, res) {
  await optionalAuth(req, res, null);

  const urlParts = req.url?.split('?')[0].split('/').filter(Boolean);
  const id = urlParts?.[urlParts.length - 1];

  if (!id || id === 'index') {
    return res.status(400).json({ message: 'Category ID is required' });
  }

  if (!isAdmin(req)) return res.status(403).json({ message: 'Admin access required' });

  if (req.method === 'PUT') {
    try {
      const category = await update(id, req.body);
      return res.status(200).json(category);
    } catch (err) {
      console.error('[categories/[id] PUT]', err);
      return res.status(500).json({ message: 'Failed to update category' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await deleteById(id);
      return res.status(200).json({ message: 'Category deleted' });
    } catch (err) {
      console.error('[categories/[id] DELETE]', err);
      return res.status(500).json({ message: 'Failed to delete category' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
