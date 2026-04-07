import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'jobs.sqlite');

let _db = null;

async function initDb() {
  if (_db) return _db;

  const SQL = await initSqlJs();

  // Charger la base existante si elle existe
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    _db = new SQL.Database(buffer);
  } else {
    _db = new SQL.Database();
  }

  _db.run(`
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
    )
  `);
  _db.run('CREATE INDEX IF NOT EXISTS idx_url ON jobs(url)');

  persist();
  return _db;
}

function persist() {
  if (!_db) return;
  const data = _db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// Sauvegarder sur disque toutes les 30 secondes et à la sortie du process
let persistTimer = null;
function startAutoPersist() {
  if (persistTimer) return;
  persistTimer = setInterval(() => persist(), 30000);
  process.on('exit', () => persist());
  process.on('SIGINT', () => { persist(); process.exit(); });
  process.on('SIGTERM', () => { persist(); process.exit(); });
}

export async function saveJob(job) {
  const db = await initDb();
  startAutoPersist();
  try {
    db.run(
      `INSERT OR IGNORE INTO jobs (title, company, location, url, source, published_at, stack, type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [job.title, job.company, job.location, job.url, job.source, job.publishedAt, JSON.stringify(job.stack), job.type]
    );
  } catch (e) {
    console.error(`Erreur sauvegarde job ${job.url}:`, e.message);
  }
}

export async function getJobCount() {
  const db = await initDb();
  const result = db.exec('SELECT COUNT(*) as count FROM jobs');
  return result[0]?.values[0]?.[0] || 0;
}

export async function getDb() {
  const db = await initDb();
  startAutoPersist();
  return db;
}

// Helper pour exécuter des requêtes et récupérer des objets (comme better-sqlite3 .all())
export async function queryAll(sql, params = []) {
  const db = await initDb();
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

export async function queryGet(sql, params = []) {
  const rows = await queryAll(sql, params);
  return rows[0] || null;
}

export async function persistNow() {
  persist();
}
