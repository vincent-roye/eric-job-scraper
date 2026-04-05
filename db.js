import Database from 'better-sqlite3';

const _db = new Database('./jobs.sqlite');

// Initialisation de la base
_db.exec(`
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

// Préparation des requêtes pour la vitesse
const insertStmt = _db.prepare(
  `INSERT OR IGNORE INTO jobs (title, company, location, url, source, published_at, stack, type) 
   VALUES (@title, @company, @location, @url, @source, @publishedAt, @stack, @type)`
);
const countStmt = _db.prepare('SELECT COUNT(*) as count FROM jobs');

export async function saveJob(job) {
  try {
    insertStmt.run({
      title: job.title,
      company: job.company,
      location: job.location,
      url: job.url,
      source: job.source,
      publishedAt: job.publishedAt,
      stack: JSON.stringify(job.stack),
      type: job.type
    });
  } catch (e) {
    console.error(`Erreur sauvegarde job ${job.url}:`, e.message);
  }
}

export async function getJobCount() {
  return countStmt.get().count;
}

export async function getDb() {
  return _db;
}
