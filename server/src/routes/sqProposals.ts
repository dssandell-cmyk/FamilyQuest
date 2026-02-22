import { Router, Request, Response } from 'express';
import pool from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

async function getUserFamilyId(userId: string): Promise<string | null> {
  const result = await pool.query('SELECT family_id FROM users WHERE id = $1', [userId]);
  return result.rows[0]?.family_id || null;
}

// GET /api/sq-proposals
router.get('/', async (req: Request, res: Response) => {
  try {
    const familyId = await getUserFamilyId(req.userId!);
    if (!familyId) {
      res.json([]);
      return;
    }

    const result = await pool.query(
      'SELECT * FROM side_quest_proposals WHERE family_id = $1 ORDER BY created_at DESC',
      [familyId]
    );

    res.json(result.rows.map(p => ({
      id: p.id,
      familyId: p.family_id,
      title: p.title,
      description: p.description,
      suggestedFor: p.suggested_for,
      proposedBy: p.proposed_by,
      createdAt: new Date(p.created_at).getTime(),
    })));
  } catch (err) {
    console.error('Get sq proposals error:', err);
    res.status(500).json({ error: 'Serverfel' });
  }
});

// POST /api/sq-proposals
router.post('/', async (req: Request, res: Response) => {
  const { title, description, suggestedFor } = req.body;
  if (!title) {
    res.status(400).json({ error: 'Titel krävs' });
    return;
  }

  try {
    const familyId = await getUserFamilyId(req.userId!);
    if (!familyId) {
      res.status(400).json({ error: 'Du måste tillhöra en familj' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO side_quest_proposals (family_id, title, description, suggested_for, proposed_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [familyId, title, description || '', suggestedFor || null, req.userId]
    );

    const p = result.rows[0];
    res.status(201).json({
      id: p.id,
      familyId: p.family_id,
      title: p.title,
      description: p.description,
      suggestedFor: p.suggested_for,
      proposedBy: p.proposed_by,
      createdAt: new Date(p.created_at).getTime(),
    });
  } catch (err) {
    console.error('Create sq proposal error:', err);
    res.status(500).json({ error: 'Serverfel' });
  }
});

// DELETE /api/sq-proposals/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await pool.query('DELETE FROM side_quest_proposals WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete sq proposal error:', err);
    res.status(500).json({ error: 'Serverfel' });
  }
});

export default router;
