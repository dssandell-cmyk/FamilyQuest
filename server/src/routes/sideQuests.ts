import { Router, Request, Response } from 'express';
import pool from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

async function getUserFamilyId(userId: string): Promise<string | null> {
  const result = await pool.query('SELECT family_id FROM users WHERE id = $1', [userId]);
  return result.rows[0]?.family_id || null;
}

// GET /api/side-quests
router.get('/', async (req: Request, res: Response) => {
  try {
    const familyId = await getUserFamilyId(req.userId!);
    if (!familyId) {
      res.json([]);
      return;
    }

    const result = await pool.query(
      'SELECT * FROM side_quests WHERE family_id = $1 ORDER BY created_at DESC',
      [familyId]
    );

    res.json(result.rows.map(sq => ({
      id: sq.id,
      familyId: sq.family_id,
      assignedTo: sq.assigned_to,
      title: sq.title,
      description: sq.description,
      status: sq.status,
      createdAt: Number(sq.created_at),
      expiresAt: Number(sq.expires_at),
    })));
  } catch (err) {
    console.error('Get side quests error:', err);
    res.status(500).json({ error: 'Serverfel' });
  }
});

// POST /api/side-quests
router.post('/', async (req: Request, res: Response) => {
  const { assignedTo, title, description, durationHours } = req.body;
  if (!assignedTo || !title || !durationHours) {
    res.status(400).json({ error: 'assignedTo, title och durationHours krävs' });
    return;
  }

  try {
    const familyId = await getUserFamilyId(req.userId!);
    if (!familyId) {
      res.status(400).json({ error: 'Du måste tillhöra en familj' });
      return;
    }

    const now = Date.now();
    const result = await pool.query(
      `INSERT INTO side_quests (family_id, assigned_to, title, description, created_at, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [familyId, assignedTo, title, description || '', now, now + (durationHours * 60 * 60 * 1000)]
    );

    const sq = result.rows[0];
    res.status(201).json({
      id: sq.id,
      familyId: sq.family_id,
      assignedTo: sq.assigned_to,
      title: sq.title,
      description: sq.description,
      status: sq.status,
      createdAt: Number(sq.created_at),
      expiresAt: Number(sq.expires_at),
    });
  } catch (err) {
    console.error('Create side quest error:', err);
    res.status(500).json({ error: 'Serverfel' });
  }
});

// PUT /api/side-quests/:id/respond
router.put('/:id/respond', async (req: Request, res: Response) => {
  const { accepted } = req.body;
  const newStatus = accepted ? 'ACTIVE' : 'REJECTED';

  try {
    const result = await pool.query(
      `UPDATE side_quests SET status = $1 WHERE id = $2 RETURNING *`,
      [newStatus, req.params.id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Side quest hittades inte' });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Respond side quest error:', err);
    res.status(500).json({ error: 'Serverfel' });
  }
});

// PUT /api/side-quests/:id/complete
router.put('/:id/complete', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `UPDATE side_quests SET status = 'COMPLETED' WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Side quest hittades inte' });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Complete side quest error:', err);
    res.status(500).json({ error: 'Serverfel' });
  }
});

// DELETE /api/side-quests/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await pool.query('DELETE FROM side_quests WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete side quest error:', err);
    res.status(500).json({ error: 'Serverfel' });
  }
});

export default router;
