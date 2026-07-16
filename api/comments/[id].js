/**
 * api/comments/[id].js — PUT|DELETE /api/comments/:id
 * Individual comment management.
 */
import { update, deleteById } from '../../lib/repositories/commentRepo.js';
import { optionalAuth, isAdmin } from '../../lib/auth/middleware.js';

export default async function handler(req, res) {
  await optionalAuth(req, res, null);

  const id = req.query?.id || req.params?.id || req.url?.split('?')[0].split('/').filter(Boolean).pop();
  if (!id) return res.status(400).json({ message: 'Comment ID is required' });

  if (req.method === 'PUT') {
    // Public users can only flag comments; admins can update anything
    const { ai_sentiment, content } = req.body || {};
    if ((ai_sentiment !== undefined || content !== undefined) && !isAdmin(req)) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    try {
      const comment = await update(id, req.body);
      return res.status(200).json(comment || { message: 'Updated' });
    } catch (err) {
      console.error('[comments/:id PUT]', err);
      return res.status(500).json({ message: 'Failed to update comment' });
    }
  }

  if (req.method === 'DELETE') {
    if (!isAdmin(req)) return res.status(403).json({ message: 'Admin access required' });
    try {
      await deleteById(id);
      return res.status(200).json({ message: 'Comment deleted' });
    } catch (err) {
      console.error('[comments/:id DELETE]', err);
      return res.status(500).json({ message: 'Failed to delete comment' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
