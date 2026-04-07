/**
 * Interface de monitoring web pour le scraper Éric
 * Lance avec: node monitor.js
 * Accessible sur: http://localhost:3847
 */

import http from 'http';
import fs from 'fs/promises';
import Database from 'better-sqlite3';
import { runScraper } from './scraper.js';

const PORT = process.env.PORT || 3847;
const db = new Database('./jobs.sqlite');

// Prépare les requêtes SQL
const stmts = {
  totalJobs: db.prepare('SELECT COUNT(*) as count FROM jobs'),
  bySources: db.prepare('SELECT source, COUNT(*) as count FROM jobs GROUP BY source ORDER BY count DESC'),
  recentJobs: db.prepare('SELECT * FROM jobs ORDER BY created_at DESC LIMIT ?'),
  jobsBySource: db.prepare('SELECT * FROM jobs WHERE source = ? ORDER BY created_at DESC LIMIT ?'),
  searchJobs: db.prepare("SELECT * FROM jobs WHERE title LIKE ? OR company LIKE ? OR location LIKE ? ORDER BY created_at DESC LIMIT 50"),
  franceJobs: db.prepare("SELECT * FROM jobs WHERE location LIKE '%paris%' OR location LIKE '%lyon%' OR location LIKE '%france%' OR location LIKE '%marseille%' OR location LIKE '%toulouse%' OR location LIKE '%bordeaux%' OR location LIKE '%lille%' OR location LIKE '%nantes%' OR location LIKE '%rennes%' ORDER BY created_at DESC LIMIT ?"),
};

let scraperRunning = false;
let lastRunResult = null;

async function loadReport() {
  try {
    const data = await fs.readFile('scraper_report.json', 'utf-8');
    return JSON.parse(data);
  } catch { return null; }
}

function apiResponse(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(data));
}

async function handleApi(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;

  if (path === '/api/stats') {
    const total = stmts.totalJobs.get().count;
    const sources = stmts.bySources.all();
    const report = await loadReport();
    return apiResponse(res, { total, sources, lastRun: report?.generatedAt || null, report: report?.summary || null, sourceHealth: report?.sourceHealth || [] });
  }

  if (path === '/api/jobs') {
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);
    const source = url.searchParams.get('source');
    const search = url.searchParams.get('q');
    let jobs;
    if (search) {
      const q = `%${search}%`;
      jobs = stmts.searchJobs.all(q, q, q);
    } else if (source) {
      jobs = stmts.jobsBySource.all(source, limit);
    } else {
      jobs = stmts.recentJobs.all(limit);
    }
    jobs = jobs.map(j => ({ ...j, stack: tryParse(j.stack) }));
    return apiResponse(res, { count: jobs.length, jobs });
  }

  if (path === '/api/france') {
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);
    const jobs = stmts.franceJobs.all(limit).map(j => ({ ...j, stack: tryParse(j.stack) }));
    return apiResponse(res, { count: jobs.length, jobs });
  }

  if (path === '/api/run' && req.method === 'POST') {
    if (scraperRunning) return apiResponse(res, { status: 'already_running' }, 409);
    scraperRunning = true;
    lastRunResult = { status: 'running', startedAt: new Date().toISOString() };
    apiResponse(res, { status: 'started' });
    try {
      await runScraper();
      lastRunResult = { status: 'completed', completedAt: new Date().toISOString() };
    } catch (e) {
      lastRunResult = { status: 'error', error: e.message };
    } finally {
      scraperRunning = false;
    }
    return;
  }

  if (path === '/api/status') {
    return apiResponse(res, { scraperRunning, lastRunResult });
  }

  return apiResponse(res, { error: 'Not found' }, 404);
}

function tryParse(s) {
  try { return JSON.parse(s); } catch { return []; }
}

const DASHBOARD_HTML = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Éric Job Scraper - Monitoring</title>
<style>
  :root { --bg: #0f172a; --card: #1e293b; --border: #334155; --text: #e2e8f0; --muted: #94a3b8; --accent: #3b82f6; --green: #22c55e; --red: #ef4444; --orange: #f59e0b; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: var(--bg); color: var(--text); line-height: 1.6; }
  .container { max-width: 1400px; margin: 0 auto; padding: 20px; }
  header { display: flex; justify-content: space-between; align-items: center; padding: 20px 0; border-bottom: 1px solid var(--border); margin-bottom: 24px; }
  header h1 { font-size: 1.5rem; }
  header h1 span { color: var(--accent); }
  .btn { background: var(--accent); color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 0.9rem; font-weight: 600; transition: opacity 0.2s; }
  .btn:hover { opacity: 0.85; }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-outline { background: transparent; border: 1px solid var(--border); color: var(--text); }
  .btn-outline.active { background: var(--accent); border-color: var(--accent); }
  .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
  .stat-card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 20px; }
  .stat-card .label { color: var(--muted); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; }
  .stat-card .value { font-size: 2rem; font-weight: 700; margin-top: 4px; }
  .stat-card .value.green { color: var(--green); }
  .stat-card .value.orange { color: var(--orange); }
  .stat-card .value.blue { color: var(--accent); }
  .panels { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
  @media (max-width: 900px) { .panels { grid-template-columns: 1fr; } }
  .panel { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 20px; }
  .panel h2 { font-size: 1rem; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
  .source-list { list-style: none; }
  .source-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--border); cursor: pointer; transition: background 0.15s; padding-left: 8px; padding-right: 8px; border-radius: 6px; }
  .source-item:hover { background: rgba(59,130,246,0.1); }
  .source-item:last-child { border-bottom: none; }
  .source-name { font-weight: 500; }
  .source-count { background: var(--accent); color: white; padding: 2px 10px; border-radius: 999px; font-size: 0.8rem; font-weight: 600; }
  .health-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 8px; }
  .health-dot.ok { background: var(--green); }
  .health-dot.error { background: var(--red); }
  .health-dot.empty { background: var(--orange); }
  .search-bar { display: flex; gap: 12px; margin-bottom: 24px; }
  .search-bar input { flex: 1; background: var(--card); border: 1px solid var(--border); color: var(--text); padding: 12px 16px; border-radius: 8px; font-size: 0.95rem; outline: none; }
  .search-bar input:focus { border-color: var(--accent); }
  .tabs { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
  .jobs-table { width: 100%; border-collapse: collapse; }
  .jobs-table th, .jobs-table td { text-align: left; padding: 12px; border-bottom: 1px solid var(--border); }
  .jobs-table th { color: var(--muted); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
  .jobs-table tr:hover { background: rgba(59,130,246,0.05); }
  .jobs-table a { color: var(--accent); text-decoration: none; }
  .jobs-table a:hover { text-decoration: underline; }
  .tag { background: rgba(59,130,246,0.15); color: var(--accent); padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; margin-right: 4px; display: inline-block; margin-bottom: 2px; }
  .status-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 999px; font-size: 0.8rem; font-weight: 500; }
  .status-badge.running { background: rgba(59,130,246,0.15); color: var(--accent); }
  .status-badge.idle { background: rgba(34,197,94,0.15); color: var(--green); }
  .spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(59,130,246,0.3); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .empty { color: var(--muted); text-align: center; padding: 40px; }
  .time-ago { color: var(--muted); font-size: 0.8rem; }
</style>
</head>
<body>
<div class="container">
  <header>
    <h1><span>Éric</span> Job Scraper — Monitoring</h1>
    <div style="display:flex;align-items:center;gap:16px;">
      <div id="scraper-status"></div>
      <button class="btn" id="run-btn" onclick="launchScraper()">Lancer le scraper</button>
    </div>
  </header>

  <div class="stats-grid" id="stats-grid"></div>

  <div class="panels">
    <div class="panel">
      <h2>Sources actives</h2>
      <ul class="source-list" id="source-list"></ul>
    </div>
    <div class="panel">
      <h2>Santé des parsers</h2>
      <ul class="source-list" id="health-list"></ul>
    </div>
  </div>

  <div class="search-bar">
    <input type="text" id="search-input" placeholder="Rechercher une offre (titre, entreprise, ville)..." />
    <button class="btn" onclick="searchJobs()">Rechercher</button>
  </div>

  <div class="tabs" id="tabs">
    <button class="btn btn-outline active" data-tab="all" onclick="switchTab('all')">Toutes</button>
    <button class="btn btn-outline" data-tab="france" onclick="switchTab('france')">France</button>
  </div>

  <div id="jobs-container">
    <table class="jobs-table">
      <thead><tr><th>Poste</th><th>Entreprise</th><th>Lieu</th><th>Source</th><th>Stack</th><th>Type</th></tr></thead>
      <tbody id="jobs-tbody"></tbody>
    </table>
  </div>
</div>

<script>
const API = '';
let currentTab = 'all';
let pollInterval = null;

async function fetchJSON(url) {
  const res = await fetch(API + url);
  return res.json();
}

async function loadStats() {
  const data = await fetchJSON('/api/stats');
  document.getElementById('stats-grid').innerHTML = [
    statCard('Total offres', data.total, 'blue'),
    statCard('Sources actives', data.sources.length, 'green'),
    statCard('Dernier run', data.lastRun ? timeAgo(data.lastRun) : 'Jamais', 'orange'),
    statCard('Candidats France', data.report?.franceCandidates ?? '—', 'green'),
    statCard('Parsers OK', data.report?.successCount ?? '—', 'green'),
    statCard('Offres brutes', data.report?.totalFound ?? '—', 'blue'),
  ].join('');

  document.getElementById('source-list').innerHTML = data.sources.map(s =>
    '<li class="source-item" onclick="filterBySource(\\'' + esc(s.source) + '\\')">' +
    '<span class="source-name">' + esc(s.source) + '</span>' +
    '<span class="source-count">' + s.count + '</span></li>'
  ).join('') || '<li class="empty">Aucune source</li>';

  document.getElementById('health-list').innerHTML = (data.sourceHealth || []).map(s =>
    '<li class="source-item">' +
    '<span><span class="health-dot ' + s.status + '"></span>' + esc(s.parser) + '</span>' +
    '<span style="font-size:0.85rem;color:var(--muted)">' + s.saved + '/' + s.found + ' (' + Math.round(s.efficiency * 100) + '%)</span></li>'
  ).join('') || '<li class="empty">Lancez le scraper pour voir la santé</li>';
}

async function loadJobs(source, search) {
  let url = '/api/jobs?limit=100';
  if (currentTab === 'france') url = '/api/france?limit=100';
  if (source) url = '/api/jobs?source=' + encodeURIComponent(source) + '&limit=100';
  if (search) url = '/api/jobs?q=' + encodeURIComponent(search);
  const data = await fetchJSON(url);
  renderJobs(data.jobs);
}

function renderJobs(jobs) {
  const tbody = document.getElementById('jobs-tbody');
  if (!jobs.length) { tbody.innerHTML = '<tr><td colspan="6" class="empty">Aucune offre trouvée</td></tr>'; return; }
  tbody.innerHTML = jobs.map(j => {
    const stack = (Array.isArray(j.stack) ? j.stack : []).slice(0, 4).map(s => '<span class="tag">' + esc(s) + '</span>').join('');
    return '<tr>' +
      '<td><a href="' + esc(j.url) + '" target="_blank">' + esc(j.title) + '</a></td>' +
      '<td>' + esc(j.company) + '</td>' +
      '<td>' + esc(j.location) + '</td>' +
      '<td>' + esc(j.source) + '</td>' +
      '<td>' + (stack || '<span style="color:var(--muted)">—</span>') + '</td>' +
      '<td>' + esc(j.type) + '</td></tr>';
  }).join('');
}

function statCard(label, value, color) {
  return '<div class="stat-card"><div class="label">' + label + '</div><div class="value ' + color + '">' + value + '</div></div>';
}

function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  loadJobs();
}

function filterBySource(source) { loadJobs(source); }

function searchJobs() {
  const q = document.getElementById('search-input').value.trim();
  if (q) loadJobs(null, q); else loadJobs();
}
document.getElementById('search-input').addEventListener('keydown', e => { if (e.key === 'Enter') searchJobs(); });

async function launchScraper() {
  const btn = document.getElementById('run-btn');
  btn.disabled = true;
  btn.textContent = 'En cours...';
  try {
    await fetch(API + '/api/run', { method: 'POST' });
    startPolling();
  } catch (e) { btn.disabled = false; btn.textContent = 'Lancer le scraper'; }
}

function startPolling() {
  if (pollInterval) return;
  updateStatus();
  pollInterval = setInterval(updateStatus, 3000);
}

async function updateStatus() {
  const data = await fetchJSON('/api/status');
  const el = document.getElementById('scraper-status');
  const btn = document.getElementById('run-btn');
  if (data.scraperRunning) {
    el.innerHTML = '<span class="status-badge running"><span class="spinner"></span> Scraping en cours...</span>';
    btn.disabled = true;
    btn.textContent = 'En cours...';
  } else {
    el.innerHTML = '<span class="status-badge idle">En attente</span>';
    btn.disabled = false;
    btn.textContent = 'Lancer le scraper';
    if (pollInterval) { clearInterval(pollInterval); pollInterval = null; loadStats(); loadJobs(); }
  }
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'À l\\'instant';
  if (m < 60) return m + ' min';
  const h = Math.floor(m / 60);
  if (h < 24) return h + 'h';
  return Math.floor(h / 24) + 'j';
}

function esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }

// Init
loadStats();
loadJobs();
updateStatus();
</script>
</body>
</html>`;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname.startsWith('/api/')) {
    return handleApi(req, res);
  }

  // Serve dashboard
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(DASHBOARD_HTML);
});

server.listen(PORT, () => {
  console.log(`\n🖥️  Monitoring Éric Job Scraper`);
  console.log(`   Dashboard: http://localhost:${PORT}`);
  console.log(`   API Stats: http://localhost:${PORT}/api/stats`);
  console.log(`   API Jobs:  http://localhost:${PORT}/api/jobs`);
  console.log(`   API France: http://localhost:${PORT}/api/france`);
  console.log(`\n   Cliquez "Lancer le scraper" dans le dashboard pour démarrer une collecte.\n`);
});
