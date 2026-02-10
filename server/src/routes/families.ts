import { Router, Request, Response } from 'express';
import pool from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// POST /api/families - Create family
router.post('/', async (req: Request, res: Response) => {
  const { name } = req.body;
  if (!name) {
    res.status(400).json({ error: 'Familjenamn krävs' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const inviteCode = generateCode();
    const familyResult = await client.query(
      'INSERT INTO families (name, invite_code) VALUES ($1, $2) RETURNING *',
      [name, inviteCode]
    );
    const family = familyResult.rows[0];

    // Make creator admin and assign to family
    await client.query(
      'UPDATE users SET family_id = $1, role = $2 WHERE id = $3',
      [family.id, 'ADMIN', req.userId]
    );

    await client.query('COMMIT');

    // Fetch updated user
    const userResult = await client.query(
      'SELECT id, name, role, score, avatar, level, family_id FROM users WHERE id = $1',
      [req.userId]
    );

    res.status(201).json({
      family: {
        id: family.id,
        name: family.name,
        inviteCode: family.invite_code,
      },
      user: {
        id: userResult.rows[0].id,
        name: userResult.rows[0].name,
        role: userResult.rows[0].role,
        score: userResult.rows[0].score,
        avatar: userResult.rows[0].avatar,
        level: userResult.rows[0].level,
        familyId: userResult.rows[0].family_id,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create family error:', err);
    res.status(500).json({ error: 'Serverfel' });
  } finally {
    client.release();
  }
});

// POST /api/families/join - Join family by invite code
router.post('/join', async (req: Request, res: Response) => {
  const { code } = req.body;
  if (!code) {
    res.status(400).json({ error: 'Kod krävs' });
    return;
  }

  try {
    const familyResult = await pool.query(
      'SELECT * FROM families WHERE invite_code = $1',
      [code.toUpperCase()]
    );
    if (familyResult.rows.length === 0) {
      res.status(404).json({ error: 'Ingen familj med den koden hittades' });
      return;
    }

    const family = familyResult.rows[0];

    // Check if there are existing members; if none, make this user admin
    const memberCount = await pool.query(
      'SELECT COUNT(*) FROM users WHERE family_id = $1',
      [family.id]
    );
    const role = parseInt(memberCount.rows[0].count) === 0 ? 'ADMIN' : 'MEMBER';

    await pool.query(
      'UPDATE users SET family_id = $1, role = $2 WHERE id = $3',
      [family.id, role, req.userId]
    );

    const userResult = await pool.query(
      'SELECT id, name, role, score, avatar, level, family_id FROM users WHERE id = $1',
      [req.userId]
    );

    res.json({
      family: {
        id: family.id,
        name: family.name,
        inviteCode: family.invite_code,
      },
      user: {
        id: userResult.rows[0].id,
        name: userResult.rows[0].name,
        role: userResult.rows[0].role,
        score: userResult.rows[0].score,
        avatar: userResult.rows[0].avatar,
        level: userResult.rows[0].level,
        familyId: userResult.rows[0].family_id,
      },
    });
  } catch (err) {
    console.error('Join family error:', err);
    res.status(500).json({ error: 'Serverfel' });
  }
});

// GET /api/families/current - Get current user's family
router.get('/current', async (req: Request, res: Response) => {
  try {
    const userResult = await pool.query('SELECT family_id FROM users WHERE id = $1', [req.userId]);
    const familyId = userResult.rows[0]?.family_id;
    if (!familyId) {
      res.json({ family: null });
      return;
    }

    const familyResult = await pool.query('SELECT * FROM families WHERE id = $1', [familyId]);
    if (familyResult.rows.length === 0) {
      res.json({ family: null });
      return;
    }

    const family = familyResult.rows[0];
    const membersResult = await pool.query(
      'SELECT id, name, role, score, avatar, level, family_id FROM users WHERE family_id = $1',
      [familyId]
    );

    res.json({
      family: {
        id: family.id,
        name: family.name,
        inviteCode: family.invite_code,
      },
      members: membersResult.rows.map(u => ({
        id: u.id,
        name: u.name,
        role: u.role,
        score: u.score,
        avatar: u.avatar,
        level: u.level,
        familyId: u.family_id,
      })),
    });
  } catch (err) {
    console.error('Get family error:', err);
    res.status(500).json({ error: 'Serverfel' });
  }
});

// PUT /api/families/users/:userId/role - Update user role
router.put('/users/:userId/role', async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { role } = req.body;

  if (!role || !['ADMIN', 'MEMBER'].includes(role)) {
    res.status(400).json({ error: 'Ogiltig roll' });
    return;
  }

  try {
    // Verify requester is admin in the same family
    const requester = await pool.query('SELECT family_id, role FROM users WHERE id = $1', [req.userId]);
    if (requester.rows[0]?.role !== 'ADMIN') {
      res.status(403).json({ error: 'Bara admin kan ändra roller' });
      return;
    }

    const target = await pool.query('SELECT family_id FROM users WHERE id = $1', [userId]);
    if (target.rows[0]?.family_id !== requester.rows[0]?.family_id) {
      res.status(403).json({ error: 'Användaren tillhör inte din familj' });
      return;
    }

    await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, userId]);
    res.json({ success: true });
  } catch (err) {
    console.error('Update role error:', err);
    res.status(500).json({ error: 'Serverfel' });
  }
});

export default router;
