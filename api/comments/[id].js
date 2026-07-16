/**
 * api/comments/[id].js — PUT|DELETE /api/comments/:id
 */
import { update, deleteById } from '../../lib/repositories/commentRepo.js';
import { optionalAuth, isAdmin } from '../../lib/auth/middleware.js';

export default async function handler(req, res) {
  await optionalAuth(req, res, null);

  const urlParts = req.url?.split('?')[0].split('/').filter(Boolean);
  const id = urlParts?.[urlParts.length - 1];

  if (!id || id === 'index') {
    return res.status(400).json({ message: 'Comment ID is required' });
  }

  if (req.method === 'PUT') {
    // Allow public flagging (is_flagged only), admin can do anything
    const { is_flagged, ai_sentiment, content } = req.body || {};
    // Public users can only flag
    if ((ai_sentiment !== undefined || content !== undefined) && !isAdmin(req)) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    try {
      const comment = await update(id, req.body);
      return res.status(200).json(comment || { message: 'Updated' });
    } catch (err) {
      console.error('[comments/[id] PUT]', err);
      return res.status(500).json({ message: 'Failed to update comment' });
    }
  }

  if (req.method === 'DELETE') {
    if (!isAdmin(req)) return res.status(403).json({ message: 'Admin access required' });
    try {
      await deleteById(id);
      return res.status(200).json({ message: 'Comment deleted' });
    } catch (err) {
      console.error('[comments/[id] DELETE]', err);
      return res.status(500).json({ message: 'Failed to delete comment' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
