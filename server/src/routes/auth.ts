import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import pool from '../db.js';
import { signToken, authMiddleware } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  const { name, password } = req.body;
  if (!name || !password) {
    res.status(400).json({ error: 'Namn och lösenord krävs' });
    return;
  }

  try {
    // Check if username taken
    const existing = await pool.query('SELECT id FROM users WHERE LOWER(name) = LOWER($1)', [name]);
    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'Användarnamnet är upptaget' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const avatar = `https://picsum.photos/seed/${Date.now()}/100/100`;

    const result = await pool.query(
      `INSERT INTO users (name, password_hash, avatar) VALUES ($1, $2, $3) RETURNING id, name, role, score, avatar, level, family_id`,
      [name, passwordHash, avatar]
    );

    const user = result.rows[0];
    const token = signToken(user.id);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        score: user.score,
        avatar: user.avatar,
        level: user.level,
        familyId: user.family_id,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Serverfel vid registrering' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const { name, password } = req.body;
  if (!name || !password) {
    res.status(400).json({ error: 'Namn och lösenord krävs' });
    return;
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE LOWER(name) = LOWER($1)', [name]);
    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Fel användarnamn eller lösenord' });
      return;
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ error: 'Fel användarnamn eller lösenord' });
      return;
    }

    const token = signToken(user.id);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        score: user.score,
        avatar: user.avatar,
        level: user.level,
        familyId: user.family_id,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Serverfel vid inloggning' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT id, name, role, score, avatar, level, family_id FROM users WHERE id = $1',
      [req.userId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Användare hittades inte' });
      return;
    }

    const user = result.rows[0];
    res.json({
      id: user.id,
      name: user.name,
      role: user.role,
      score: user.score,
      avatar: user.avatar,
      level: user.level,
      familyId: user.family_id,
    });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Serverfel' });
  }
});

export default router;
