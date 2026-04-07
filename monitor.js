/**
 * Interface de monitoring web pour le scraper Éric
 * Lance avec: node monitor.js
 * Accessible sur: http://localhost:3847
 */

import http from 'http';
import fs from 'fs/promises';
import { queryAll, queryGet, checkConnection } from './db.js';
import { runScraper } from './scraper.js';

const PORT = process.env.PORT || 3847;

let scraperRunning = false;
let lastRunResult = null;
let lastRunLogs = [];

async function loadReport() {
  try {
    const data = await fs.readFile('scraper_report.json', 'utf-8');
    return JSON.parse(data);
  } catch { return null; }
}

async function loadLogs() {
  try {
    const data = await fs.readFile('scraper_run.log', 'utf-8');
    return data.split('\n').filter(Boolean);
  } catch { return []; }
}

function apiResponse(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(data));
}

function tryParse(s) {
  try { return JSON.parse(s); } catch { return []; }
}

async function handleApi(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;

  if (path === '/api/stats') {
    const totalRow = await queryGet('SELECT COUNT(*) as count FROM jobs');
    const total = totalRow?.count || 0;
    const sources = await queryAll('SELECT source, COUNT(*) as count FROM jobs GROUP BY source ORDER BY count DESC');
    const report = await loadReport();
    return apiResponse(res, { total, sources, lastRun: report?.generatedAt || null, report: report?.summary || null, sourceHealth: report?.sourceHealth || [], durationSec: report?.durationSec || null });
  }

  if (path === '/api/jobs') {
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);
    const source = url.searchParams.get('source');
    const search = url.searchParams.get('q');
    let jobs;
    if (search) {
      const q = `%${search}%`;
      jobs = await queryAll("SELECT * FROM jobs WHERE title ILIKE ? OR company ILIKE ? OR location ILIKE ? ORDER BY created_at DESC LIMIT 50", [q, q, q]);
    } else if (source) {
      jobs = await queryAll('SELECT * FROM jobs WHERE source = ? ORDER BY created_at DESC LIMIT ?', [source, limit]);
    } else {
      jobs = await queryAll('SELECT * FROM jobs ORDER BY created_at DESC LIMIT ?', [limit]);
    }
    jobs = jobs.map(j => ({ ...j, stack: tryParse(j.stack) }));
    return apiResponse(res, { count: jobs.length, jobs });
  }

  if (path === '/api/france') {
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);
    const jobs = (await queryAll("SELECT * FROM jobs WHERE location ILIKE '%paris%' OR location ILIKE '%lyon%' OR location ILIKE '%france%' OR location ILIKE '%marseille%' OR location ILIKE '%toulouse%' OR location ILIKE '%bordeaux%' OR location ILIKE '%lille%' OR location ILIKE '%nantes%' OR location ILIKE '%rennes%' ORDER BY created_at DESC LIMIT ?", [limit]))
      .map(j => ({ ...j, stack: tryParse(j.stack) }));
    return apiResponse(res, { count: jobs.length, jobs });
  }

  if (path === '/api/logs') {
    const logs = lastRunLogs.length ? lastRunLogs : await loadLogs();
    return apiResponse(res, { lines: logs });
  }

  if (path === '/api/run' && req.method === 'POST') {
    if (scraperRunning) return apiResponse(res, { status: 'already_running' }, 409);
    scraperRunning = true;
    lastRunResult = { status: 'running', startedAt: new Date().toISOString() };
    lastRunLogs = [];
    apiResponse(res, { status: 'started' });
    try {
      const result = await runScraper();
      lastRunLogs = result?.logLines || [];
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

  if (path === '/api/db') {
    const info = await checkConnection();
    return apiResponse(res, info);
  }

  return apiResponse(res, { error: 'Not found' }, 404);
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
  header { display: flex; justify-content: space-between; align-items: center; padding: 20px 0; border-bottom: 1px solid var(--border); margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
  header h1 { font-size: 1.5rem; }
  header h1 span { color: var(--accent); }
  .btn { background: var(--accent); color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 0.9rem; font-weight: 600; transition: opacity 0.2s; }
  .btn:hover { opacity: 0.85; }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-outline { background: transparent; border: 1px solid var(--border); color: var(--text); }
  .btn-outline.active { background: var(--accent); border-color: var(--accent); }
  .btn-sm { padding: 6px 14px; font-size: 0.8rem; }
  .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px; }
  .stat-card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 20px; }
  .stat-card .label { color: var(--muted); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; }
  .stat-card .value { font-size: 2rem; font-weight: 700; margin-top: 4px; }
  .stat-card .value.green { color: var(--green); }
  .stat-card .value.orange { color: var(--orange); }
  .stat-card .value.blue { color: var(--accent); }
  .stat-card .value.red { color: var(--red); }
  .panels { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
  @media (max-width: 900px) { .panels { grid-template-columns: 1fr; } }
  .panel { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 20px; }
  .panel h2 { font-size: 1rem; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
  .source-list { list-style: none; }
  .source-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 8px; border-bottom: 1px solid var(--border); cursor: pointer; border-radius: 6px; transition: background 0.15s; }
  .source-item:hover { background: rgba(59,130,246,0.1); }
  .source-item:last-child { border-bottom: none; }
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

  /* Log viewer */
  .log-panel { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 20px; margin-bottom: 24px; display: none; }
  .log-panel.visible { display: block; }
  .log-panel h2 { font-size: 1rem; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; }
  .log-content { background: #0b1120; border-radius: 8px; padding: 16px; max-height: 500px; overflow-y: auto; font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace; font-size: 0.8rem; line-height: 1.7; white-space: pre-wrap; word-break: break-all; }
  .log-line { padding: 1px 0; }
  .log-line.error { color: var(--red); }
  .log-line.warn { color: var(--orange); }
  .log-line.ok { color: var(--green); }
  .log-line.debug { color: var(--muted); }
  .log-line.stat { color: #a78bfa; }
  .log-line.info { color: var(--text); }
  .log-filter { display: flex; gap: 6px; }
</style>
</head>
<body>
<div class="container">
  <header>
    <h1><span>Eric</span> Job Scraper — Monitoring</h1>
    <div style="display:flex;align-items:center;gap:16px;">
      <div id="db-status"></div>
      <div id="scraper-status"></div>
      <button class="btn" id="run-btn" onclick="launchScraper()">Lancer le scraper</button>
      <button class="btn btn-outline btn-sm" onclick="toggleLogs()">Logs</button>
    </div>
  </header>

  <div class="stats-grid" id="stats-grid"></div>

  <div class="log-panel" id="log-panel">
    <h2>
      <span>Logs du dernier run</span>
      <div class="log-filter">
        <button class="btn btn-outline btn-sm active" data-lf="all" onclick="filterLogs('all')">Tout</button>
        <button class="btn btn-outline btn-sm" data-lf="error" onclick="filterLogs('error')">Erreurs</button>
        <button class="btn btn-outline btn-sm" data-lf="warn" onclick="filterLogs('warn')">Warnings</button>
        <button class="btn btn-outline btn-sm" data-lf="stat" onclick="filterLogs('stat')">Stats</button>
      </div>
    </h2>
    <div class="log-content" id="log-content"></div>
  </div>

  <div class="panels">
    <div class="panel">
      <h2>Sources actives</h2>
      <ul class="source-list" id="source-list"></ul>
    </div>
    <div class="panel">
      <h2>Sante des parsers</h2>
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
let allLogLines = [];
let currentLogFilter = 'all';

async function fetchJSON(url) {
  const res = await fetch(API + url);
  return res.json();
}

async function loadStats() {
  const data = await fetchJSON('/api/stats');
  const errCount = (data.sourceHealth || []).filter(s => s.status === 'error').length;
  document.getElementById('stats-grid').innerHTML = [
    statCard('Total offres', data.total, 'blue'),
    statCard('Sources actives', data.sources.length, 'green'),
    statCard('Dernier run', data.lastRun ? timeAgo(data.lastRun) : 'Jamais', 'orange'),
    statCard('Duree run', data.durationSec ? data.durationSec + 's' : '—', 'blue'),
    statCard('Parsers OK', data.report?.successCount ?? '—', 'green'),
    statCard('Parsers erreur', errCount || '—', errCount > 0 ? 'red' : 'green'),
    statCard('Offres brutes', data.report?.totalFound ?? '—', 'blue'),
    statCard('Candidats France', data.report?.franceCandidates ?? '—', 'green'),
  ].join('');

  document.getElementById('source-list').innerHTML = data.sources.map(s =>
    '<li class="source-item" onclick="filterBySource(\\'' + esc(s.source) + '\\')">' +
    '<span>' + esc(s.source) + '</span>' +
    '<span class="source-count">' + s.count + '</span></li>'
  ).join('') || '<li class="empty">Aucune source</li>';

  document.getElementById('health-list').innerHTML = (data.sourceHealth || []).map(s => {
    const dur = s.durationMs ? (s.durationMs/1000).toFixed(1) + 's' : '-';
    const errTip = s.error ? ' title="' + esc(s.error) + '"' : '';
    return '<li class="source-item"' + errTip + '>' +
    '<span><span class="health-dot ' + s.status + '"></span>' + esc(s.parser) + '</span>' +
    '<span style="font-size:0.85rem;color:var(--muted)">' + s.saved + '/' + s.found + ' | ' + dur + '</span></li>';
  }).join('') || '<li class="empty">Lancez le scraper pour voir</li>';
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
  if (!jobs.length) { tbody.innerHTML = '<tr><td colspan="6" class="empty">Aucune offre trouvee</td></tr>'; return; }
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

// ─── Logs ────────────────────────
function toggleLogs() {
  const panel = document.getElementById('log-panel');
  panel.classList.toggle('visible');
  if (panel.classList.contains('visible')) refreshLogs();
}

async function refreshLogs() {
  const data = await fetchJSON('/api/logs');
  allLogLines = data.lines || [];
  renderLogs();
}

function filterLogs(filter) {
  currentLogFilter = filter;
  document.querySelectorAll('[data-lf]').forEach(b => b.classList.toggle('active', b.dataset.lf === filter));
  renderLogs();
}

function renderLogs() {
  const el = document.getElementById('log-content');
  let lines = allLogLines;
  if (currentLogFilter !== 'all') {
    const f = currentLogFilter.toUpperCase();
    lines = lines.filter(l => l.includes(f));
  }
  el.innerHTML = lines.map(l => {
    let cls = 'info';
    if (l.includes('ERROR')) cls = 'error';
    else if (l.includes('WARN')) cls = 'warn';
    else if (l.includes('OK')) cls = 'ok';
    else if (l.includes('DEBUG')) cls = 'debug';
    else if (l.includes('STAT')) cls = 'stat';
    return '<div class="log-line ' + cls + '">' + esc(l) + '</div>';
  }).join('');
  el.scrollTop = el.scrollHeight;
}

// ─── Scraper control ────────────
async function launchScraper() {
  const btn = document.getElementById('run-btn');
  btn.disabled = true; btn.textContent = 'En cours...';
  document.getElementById('log-panel').classList.add('visible');
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
    el.innerHTML = '<span class="status-badge running"><span class="spinner"></span> Scraping...</span>';
    btn.disabled = true; btn.textContent = 'En cours...';
    refreshLogs();
  } else {
    el.innerHTML = '<span class="status-badge idle">Pret</span>';
    btn.disabled = false; btn.textContent = 'Lancer le scraper';
    if (pollInterval) { clearInterval(pollInterval); pollInterval = null; loadStats(); loadJobs(); refreshLogs(); }
  }
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'A l\\'instant';
  if (m < 60) return m + ' min';
  const h = Math.floor(m / 60);
  if (h < 24) return h + 'h';
  return Math.floor(h / 24) + 'j';
}

function esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }

async function checkDb() {
  const el = document.getElementById('db-status');
  el.innerHTML = '<span class="status-badge running"><span class="spinner"></span> Neon...</span>';
  try {
    const data = await fetchJSON('/api/db');
    if (data.connected) {
      el.innerHTML = '<span class="status-badge idle" title="' + esc(data.version) + ' | ' + data.latency + 'ms">'
        + '<span class="health-dot ok" style="margin:0"></span> Neon ' + data.latency + 'ms</span>';
    } else {
      el.innerHTML = '<span class="status-badge" style="background:rgba(239,68,68,0.15);color:var(--red)" title="' + esc(data.error) + '">'
        + '<span class="health-dot error" style="margin:0"></span> Neon KO</span>';
    }
  } catch (e) {
    el.innerHTML = '<span class="status-badge" style="background:rgba(239,68,68,0.15);color:var(--red)"><span class="health-dot error" style="margin:0"></span> Neon KO</span>';
  }
}

checkDb(); loadStats(); loadJobs(); updateStatus();
</script>
</body>
</html>`;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (url.pathname.startsWith('/api/')) return handleApi(req, res);
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(DASHBOARD_HTML);
});

server.listen(PORT, () => {
  console.log('');
  console.log('  Eric Job Scraper - Monitoring');
  console.log('  ─────────────────────────────');
  console.log('  Dashboard : http://localhost:' + PORT);
  console.log('  API Stats : http://localhost:' + PORT + '/api/stats');
  console.log('  API Jobs  : http://localhost:' + PORT + '/api/jobs');
  console.log('  API France: http://localhost:' + PORT + '/api/france');
  console.log('  API Logs  : http://localhost:' + PORT + '/api/logs');
  console.log('');
});
