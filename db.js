/**
 * Module base de données — PostgreSQL (Neon)
 */

import pg from 'pg';

const DATABASE_URL = process.env.DATABASE_URL
  || 'postgresql://neondb_owner:npg_TkJy7aXfbx2U@ep-old-queen-ab6doj1b.eu-west-2.aws.neon.tech/neondb?sslmode=require';

const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: { rejectUnauthorized: false },
});

let initialized = false;

async function initDb() {
  if (initialized) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS jobs (
      id SERIAL PRIMARY KEY,
      title TEXT,
      company TEXT,
      location TEXT,
      url TEXT UNIQUE,
      source TEXT,
      published_at TEXT,
      stack TEXT,
      type TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await pool.query('CREATE INDEX IF NOT EXISTS idx_jobs_url ON jobs(url)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_jobs_source ON jobs(source)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_jobs_created ON jobs(created_at DESC)');

  initialized = true;
}

export async function saveJob(job) {
  await initDb();
  try {
    await pool.query(
      `INSERT INTO jobs (title, company, location, url, source, published_at, stack, type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (url) DO NOTHING`,
      [job.title, job.company, job.location, job.url, job.source, job.publishedAt, JSON.stringify(job.stack), job.type]
    );
  } catch (e) {
    console.error(`Erreur sauvegarde job ${job.url}:`, e.message);
  }
}

export async function getJobCount() {
  await initDb();
  const result = await pool.query('SELECT COUNT(*) as count FROM jobs');
  return parseInt(result.rows[0].count, 10);
}

export async function queryAll(sql, params = []) {
  await initDb();
  // Convertir les placeholders ? en $1, $2, ... pour pg
  let i = 0;
  const pgSql = sql.replace(/\?/g, () => `$${++i}`);
  const result = await pool.query(pgSql, params);
  return result.rows;
}

export async function queryGet(sql, params = []) {
  const rows = await queryAll(sql, params);
  return rows[0] || null;
}

export async function persistNow() {
  // No-op pour PostgreSQL (auto-commit)
}

export async function checkConnection() {
  try {
    const t0 = Date.now();
    const res = await pool.query('SELECT version()');
    const latency = Date.now() - t0;
    const version = res.rows[0].version.split(' ').slice(0, 2).join(' ');
    return { connected: true, latency, version, host: DATABASE_URL.match(/@([^/]+)\//)?.[1] || 'unknown' };
  } catch (e) {
    return { connected: false, error: e.message };
  }
}

export async function closeDb() {
  await pool.end();
}
