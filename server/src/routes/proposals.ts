import { Router, Request, Response } from 'express';
import pool from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

async function getUserFamilyId(userId: string): Promise<string | null> {
  const result = await pool.query('SELECT family_id FROM users WHERE id = $1', [userId]);
  return result.rows[0]?.family_id || null;
}

// GET /api/proposals
router.get('/', async (req: Request, res: Response) => {
  try {
    const familyId = await getUserFamilyId(req.userId!);
    if (!familyId) {
      res.json([]);
      return;
    }

    const result = await pool.query(
      'SELECT * FROM task_proposals WHERE family_id = $1 ORDER BY created_at DESC',
      [familyId]
    );

    res.json(result.rows.map(p => ({
      id: p.id,
      familyId: p.family_id,
      title: p.title,
      description: p.description,
      suggestedPoints: p.suggested_points,
      proposedBy: p.proposed_by,
      createdAt: new Date(p.created_at).getTime(),
    })));
  } catch (err) {
    console.error('Get proposals error:', err);
    res.status(500).json({ error: 'Serverfel' });
  }
});

// POST /api/proposals
router.post('/', async (req: Request, res: Response) => {
  const { title, description, suggestedPoints } = req.body;
  if (!title || suggestedPoints == null) {
    res.status(400).json({ error: 'Titel och poäng krävs' });
    return;
  }

  try {
    const familyId = await getUserFamilyId(req.userId!);
    if (!familyId) {
      res.status(400).json({ error: 'Du måste tillhöra en familj' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO task_proposals (family_id, title, description, suggested_points, proposed_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [familyId, title, description || '', suggestedPoints, req.userId]
    );

    const p = result.rows[0];
    res.status(201).json({
      id: p.id,
      familyId: p.family_id,
      title: p.title,
      description: p.description,
      suggestedPoints: p.suggested_points,
      proposedBy: p.proposed_by,
      createdAt: new Date(p.created_at).getTime(),
    });
  } catch (err) {
    console.error('Create proposal error:', err);
    res.status(500).json({ error: 'Serverfel' });
  }
});

// DELETE /api/proposals/:id - Reject/delete
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await pool.query('DELETE FROM task_proposals WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete proposal error:', err);
    res.status(500).json({ error: 'Serverfel' });
  }
});

// POST /api/proposals/:id/approve - Approve proposal and create task
router.post('/:id/approve', async (req: Request, res: Response) => {
  const { finalPoints, userPointsOverride } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const proposalResult = await client.query(
      'SELECT * FROM task_proposals WHERE id = $1',
      [req.params.id]
    );
    if (proposalResult.rows.length === 0) {
      res.status(404).json({ error: 'Förslaget hittades inte' });
      await client.query('ROLLBACK');
      return;
    }

    const proposal = proposalResult.rows[0];

    // Create task from proposal
    await client.query(
      `INSERT INTO tasks (family_id, title, description, base_points, user_points_override, created_by, booking_deadline, completion_deadline)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        proposal.family_id,
        proposal.title,
        proposal.description,
        finalPoints ?? proposal.suggested_points,
        JSON.stringify(userPointsOverride || {}),
        req.userId,
        Date.now() + 86400000,
        Date.now() + 172800000,
      ]
    );

    // Delete proposal
    await client.query('DELETE FROM task_proposals WHERE id = $1', [req.params.id]);

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Approve proposal error:', err);
    res.status(500).json({ error: 'Serverfel' });
  } finally {
    client.release();
  }
});

export default router;
