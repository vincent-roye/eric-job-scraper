import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

let _db = null;

export async function getDb() {
  if (_db) return _db;

  _db = await open({
    filename: './jobs.sqlite',
    driver: sqlite3.Database
  });

  // Création de la table si elle n'existe pas
  await _db.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      company TEXT,
      location TEXT,
      url TEXT UNIQUE,
      source TEXT,
      published_at TEXT,
      stack TEXT,
      type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_url ON jobs(url);
  `);

  return _db;
}

export async function saveJob(job) {
  const db = await getDb();
  try {
    await db.run(
      `INSERT OR IGNORE INTO jobs (title, company, location, url, source, published_at, stack, type) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [job.title, job.company, job.location, job.url, job.source, job.publishedAt, JSON.stringify(job.stack), job.type]
    );
  } catch (e) {
    console.error(`Erreur sauvegarde job ${job.url}:`, e.message);
  }
}

export async function getJobCount() {
  const db = await getDb();
  const res = await db.get('SELECT COUNT(*) as count FROM jobs');
  return res.count;
}
