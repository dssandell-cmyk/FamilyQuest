import 'dotenv/config';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pool from './db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function initDb() {
  const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
  try {
    await pool.query(schema);
    console.log('Database schema initialized successfully.');
  } catch (err) {
    console.error('Failed to initialize database:', err);
  } finally {
    await pool.end();
  }
}

initDb();
