import { Router, Request, Response } from 'express';
import pool from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// Helper: get user's family_id
async function getUserFamilyId(userId: string): Promise<string | null> {
  const result = await pool.query('SELECT family_id FROM users WHERE id = $1', [userId]);
  return result.rows[0]?.family_id || null;
}

// GET /api/tasks - Get family tasks
router.get('/', async (req: Request, res: Response) => {
  try {
    const familyId = await getUserFamilyId(req.userId!);
    if (!familyId) {
      res.json([]);
      return;
    }

    const result = await pool.query(
      'SELECT * FROM tasks WHERE family_id = $1 ORDER BY created_at DESC',
      [familyId]
    );

    res.json(result.rows.map(t => ({
      id: t.id,
      familyId: t.family_id,
      title: t.title,
      description: t.description,
      basePoints: t.base_points,
      userPointsOverride: t.user_points_override || {},
      status: t.status,
      assigneeId: t.assignee_id,
      createdBy: t.created_by,
      createdAt: new Date(t.created_at).getTime(),
      bookingDeadline: t.booking_deadline ? Number(t.booking_deadline) : 0,
      completionDeadline: t.completion_deadline ? Number(t.completion_deadline) : 0,
      isBossTask: t.is_boss_task || false,
    })));
  } catch (err) {
    console.error('Get tasks error:', err);
    res.status(500).json({ error: 'Serverfel' });
  }
});

// POST /api/tasks - Create task
router.post('/', async (req: Request, res: Response) => {
  const { title, description, basePoints, userPointsOverride, bookingDeadline, completionDeadline, isBossTask } = req.body;

  if (!title || basePoints == null) {
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
      `INSERT INTO tasks (family_id, title, description, base_points, user_points_override, created_by, booking_deadline, completion_deadline, is_boss_task)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [familyId, title, description || '', basePoints, JSON.stringify(userPointsOverride || {}), req.userId, bookingDeadline || 0, completionDeadline || 0, isBossTask || false]
    );

    const t = result.rows[0];
    res.status(201).json({
      id: t.id,
      familyId: t.family_id,
      title: t.title,
      description: t.description,
      basePoints: t.base_points,
      userPointsOverride: t.user_points_override || {},
      status: t.status,
      assigneeId: t.assignee_id,
      createdBy: t.created_by,
      createdAt: new Date(t.created_at).getTime(),
      bookingDeadline: Number(t.booking_deadline),
      completionDeadline: Number(t.completion_deadline),
      isBossTask: t.is_boss_task,
    });
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({ error: 'Serverfel' });
  }
});

// PUT /api/tasks/:id/claim - Claim task
router.put('/:id/claim', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `UPDATE tasks SET status = 'ASSIGNED', assignee_id = $1 WHERE id = $2 AND status = 'OPEN' RETURNING *`,
      [req.userId, req.params.id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Uppgiften finns inte eller är redan tagen' });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Claim task error:', err);
    res.status(500).json({ error: 'Serverfel' });
  }
});

// PUT /api/tasks/:id/complete - Complete task (marks as VERIFIED and awards points)
router.put('/:id/complete', async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const taskResult = await client.query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
    if (taskResult.rows.length === 0) {
      res.status(404).json({ error: 'Uppgiften hittades inte' });
      await client.query('ROLLBACK');
      return;
    }

    const task = taskResult.rows[0];
    await client.query(`UPDATE tasks SET status = 'VERIFIED' WHERE id = $1`, [req.params.id]);

    if (task.assignee_id) {
      const override = task.user_points_override || {};
      const points = override[task.assignee_id] ?? task.base_points;

      // Update score and recalculate level
      const LEVEL_THRESHOLDS = [0, 50, 100, 150, 200];
      const userResult = await client.query('SELECT score FROM users WHERE id = $1', [task.assignee_id]);
      const newScore = (userResult.rows[0]?.score || 0) + points;

      let newLevel = 1;
      for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
        if (newScore >= LEVEL_THRESHOLDS[i]) newLevel = i + 1;
      }

      await client.query(
        'UPDATE users SET score = $1, level = $2 WHERE id = $3',
        [newScore, newLevel, task.assignee_id]
      );
    }

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Complete task error:', err);
    res.status(500).json({ error: 'Serverfel' });
  } finally {
    client.release();
  }
});

// PUT /api/tasks/:id/verify - Verify task (admin action)
router.put('/:id/verify', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `UPDATE tasks SET status = 'VERIFIED' WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Uppgiften hittades inte' });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Verify task error:', err);
    res.status(500).json({ error: 'Serverfel' });
  }
});

// PUT /api/tasks/:id - Edit task (admin)
router.put('/:id', async (req: Request, res: Response) => {
  const { title, description, basePoints, userPointsOverride, bookingDeadline, completionDeadline } = req.body;

  try {
    const familyId = await getUserFamilyId(req.userId!);
    if (!familyId) {
      res.status(400).json({ error: 'Du måste tillhöra en familj' });
      return;
    }

    const existing = await pool.query('SELECT * FROM tasks WHERE id = $1 AND family_id = $2', [req.params.id, familyId]);
    if (existing.rows.length === 0) {
      res.status(404).json({ error: 'Uppgiften hittades inte' });
      return;
    }

    const result = await pool.query(
      `UPDATE tasks SET title = COALESCE($1, title), description = COALESCE($2, description),
       base_points = COALESCE($3, base_points), user_points_override = COALESCE($4, user_points_override),
       booking_deadline = COALESCE($5, booking_deadline), completion_deadline = COALESCE($6, completion_deadline)
       WHERE id = $7 RETURNING *`,
      [title, description, basePoints, userPointsOverride ? JSON.stringify(userPointsOverride) : null, bookingDeadline, completionDeadline, req.params.id]
    );

    const t = result.rows[0];
    res.json({
      id: t.id,
      familyId: t.family_id,
      title: t.title,
      description: t.description,
      basePoints: t.base_points,
      userPointsOverride: t.user_points_override || {},
      status: t.status,
      assigneeId: t.assignee_id,
      createdBy: t.created_by,
      createdAt: new Date(t.created_at).getTime(),
      bookingDeadline: Number(t.booking_deadline),
      completionDeadline: Number(t.completion_deadline),
      isBossTask: t.is_boss_task,
    });
  } catch (err) {
    console.error('Edit task error:', err);
    res.status(500).json({ error: 'Serverfel' });
  }
});

// DELETE /api/tasks/:id - Delete task (admin)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const familyId = await getUserFamilyId(req.userId!);
    if (!familyId) {
      res.status(400).json({ error: 'Du måste tillhöra en familj' });
      return;
    }

    const result = await pool.query(
      'DELETE FROM tasks WHERE id = $1 AND family_id = $2 RETURNING id',
      [req.params.id, familyId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Uppgiften hittades inte' });
      return;
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Delete task error:', err);
    res.status(500).json({ error: 'Serverfel' });
  }
});

export default router;
