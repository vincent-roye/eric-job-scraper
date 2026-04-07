/**
 * Moteur principal du scraper Éric - V4 max-platforms
 */

import { saveJob, getJobCount, queryAll, persistNow } from './db.js';
import * as parsers from './parsers/index.js';
import { sleep, normalizeJob, isValidJob, isFranceLocation } from './parsers/utils.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_PATH = path.join(__dirname, 'scraper_run.log');

const TECH_KEYWORDS = [
  'dev', 'developer', 'développeur', 'engineer', 'ingénieur', 'fullstack', 'frontend', 'backend',
  'python', 'java', 'react', 'node', 'javascript', 'typescript', 'c#', 'ruby', 'go', 'rust',
  'cloud', 'aws', 'azure', 'docker', 'kubernetes', 'data', 'ai', 'machine learning', 'software',
  'web', 'mobile', 'ios', 'android', 'product engineer', 'sre', 'devops', 'qa', 'test automation',
  '.net', 'php', 'angular', 'spring', 'full stack', 'logiciel embarqué', 'c++'
];

const NON_TECH_TITLE_PATTERNS = [
  'copywriter', 'customer success', 'office assistant', 'content reviewer', 'inside sales',
  'customer support', 'project coordinator', 'retention manager', 'commercial', 'vendeur', 'comptable'
];

// ─── Logger détaillé ─────────────────────────────────────────────────
const logLines = [];

function log(level, parser, message, details = null) {
  const ts = new Date().toISOString();
  const prefix = { INFO: 'ℹ️', OK: '✅', WARN: '⚠️', ERROR: '❌', DEBUG: '🔍', STAT: '📊' }[level] || '•';
  const parserTag = parser ? `[${parser}]` : '';
  const line = `${ts} ${prefix} ${level.padEnd(5)} ${parserTag} ${message}`;
  logLines.push(line);
  console.log(line);
  if (details) {
    const detailLine = `${ts}         ${parserTag} └─ ${typeof details === 'string' ? details : JSON.stringify(details)}`;
    logLines.push(detailLine);
    console.log(detailLine);
  }
}

function isTechJob(title, stack) {
  const content = (title + ' ' + (stack || []).join(' ')).toLowerCase();
  if (NON_TECH_TITLE_PATTERNS.some(pattern => content.includes(pattern))) return false;
  return TECH_KEYWORDS.some(keyword => content.includes(keyword));
}

function dedupeJobs(jobs) {
  const seen = new Set();
  const out = [];
  for (const job of jobs) {
    const key = [job.url, job.title.toLowerCase(), job.company.toLowerCase()].join('::');
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(job);
  }
  return out;
}

function franceScore(job) {
  let score = 0;
  const location = (job.location || '').toLowerCase();
  const company = (job.company || '').toLowerCase();
  const title = (job.title || '').toLowerCase();

  if (isFranceLocation(location)) score += 5;
  if (/paris|lyon|nantes|bordeaux|lille|toulouse|rennes|strasbourg|montpellier|marseille|france|île-de-france|ile-de-france/.test(location)) score += 2;
  if (/france/.test(company)) score += 1;
  if (/remote france|full remote france|france entière/.test(location)) score += 3;
  if (/anglais|english/.test(title)) score -= 1;
  if (/worldwide|usa|emea|apac|europe/.test(location)) score -= 4;
  return score;
}

function techScore(job) {
  let score = 0;
  const content = ((job.title || '') + ' ' + (job.stack || []).join(' ')).toLowerCase();
  for (const kw of TECH_KEYWORDS) {
    if (content.includes(kw)) score += 1;
  }
  return score;
}

export async function runScraper() {
  const startTime = Date.now();
  logLines.length = 0;

  log('INFO', null, '═══════════════════════════════════════════════════');
  log('INFO', null, 'Démarrage du scraper Éric V4 max-platforms');
  log('INFO', null, `Date: ${new Date().toLocaleString('fr-FR')}`);
  log('INFO', null, `Node.js: ${process.version} | OS: ${process.platform} ${process.arch}`);
  log('INFO', null, '═══════════════════════════════════════════════════');

  let totalFound = 0;
  let totalSaved = 0;
  let parserCount = 0;
  let successCount = 0;
  let skippedInvalid = 0;
  let techRejected = 0;
  let duplicateCount = 0;
  const perParserStats = [];
  const collectedJobs = [];

  const fetchEntries = Object.entries(parsers);
  log('INFO', null, `${fetchEntries.length} parsers chargés depuis index.js`);

  for (const [parserName, fetchFn] of fetchEntries) {
    parserCount++;
    const parserLabel = parserName.replace(/^fetch/, '').replace(/Jobs$/, '');
    const parserStat = { parser: parserLabel, found: 0, saved: 0, invalid: 0, techFilteredOut: 0, duplicates: 0, status: 'ok', durationMs: 0, error: null };

    log('INFO', parserLabel, `──── Parser ${parserCount}/${fetchEntries.length} ────`);

    const t0 = Date.now();
    try {
      const delayMs = 400 + Math.random() * 900;
      log('DEBUG', parserLabel, `Attente anti-rate-limit: ${Math.round(delayMs)}ms`);
      await sleep(delayMs);

      log('INFO', parserLabel, 'Lancement du fetch...');
      const jobs = parserName === 'fetchFranceTravailJobs'
        ? await fetchFn({ keywords: 'développeur', location: 'France', pages: 3 })
        : await fetchFn();

      parserStat.durationMs = Date.now() - t0;

      if (!Array.isArray(jobs) || jobs.length === 0) {
        parserStat.status = 'empty';
        perParserStats.push(parserStat);
        log('WARN', parserLabel, `Aucune offre retournée (${parserStat.durationMs}ms)`);
        continue;
      }

      totalFound += jobs.length;
      parserStat.found = jobs.length;
      log('INFO', parserLabel, `${jobs.length} offres brutes récupérées (${parserStat.durationMs}ms)`);

      // Exemples des premières offres brutes pour debug
      if (jobs.length > 0) {
        log('DEBUG', parserLabel, `Exemple offre brute: "${jobs[0].title}" @ ${jobs[0].company} (${jobs[0].location})`);
      }

      const invalidDetails = [];
      const techFilteredDetails = [];

      const normalized = jobs.map(normalizeJob).filter(job => {
        if (!isValidJob(job)) {
          skippedInvalid++;
          parserStat.invalid++;
          invalidDetails.push(`"${job.title || '(vide)'}" url=${job.url || '(aucune)'}`);
          return false;
        }
        if (!isTechJob(job.title, job.stack)) {
          techRejected++;
          parserStat.techFilteredOut++;
          techFilteredDetails.push(`"${job.title}"`);
          return false;
        }
        return true;
      });

      if (invalidDetails.length > 0) {
        log('DEBUG', parserLabel, `Offres invalides (${invalidDetails.length}):`, invalidDetails.slice(0, 5).join(' | ') + (invalidDetails.length > 5 ? ` ... +${invalidDetails.length - 5}` : ''));
      }
      if (techFilteredDetails.length > 0) {
        log('DEBUG', parserLabel, `Hors-tech filtrés (${techFilteredDetails.length}):`, techFilteredDetails.slice(0, 5).join(' | ') + (techFilteredDetails.length > 5 ? ` ... +${techFilteredDetails.length - 5}` : ''));
      }

      const deduped = dedupeJobs(normalized);
      parserStat.duplicates = normalized.length - deduped.length;
      duplicateCount += parserStat.duplicates;

      if (parserStat.duplicates > 0) {
        log('DEBUG', parserLabel, `${parserStat.duplicates} doublons supprimés`);
      }

      for (const job of deduped) {
        await saveJob(job);
        collectedJobs.push(job);
        totalSaved++;
        parserStat.saved++;
      }

      successCount++;
      perParserStats.push(parserStat);
      log('OK', parserLabel, `${parserStat.saved}/${parserStat.found} sauvegardées | ${parserStat.invalid} invalides | ${parserStat.techFilteredOut} hors-tech | ${parserStat.duplicates} doublons`);
    } catch (e) {
      parserStat.status = 'error';
      parserStat.error = e.message;
      parserStat.durationMs = Date.now() - t0;
      perParserStats.push(parserStat);
      log('ERROR', parserLabel, `Échec après ${parserStat.durationMs}ms: ${e.message}`);
      if (e.cause) log('DEBUG', parserLabel, `Cause: ${e.cause.message || e.cause}`);
    }
  }

  await persistNow();

  const dbCount = await getJobCount();
  const dedupedAll = dedupeJobs(collectedJobs);
  const franceCandidates = dedupedAll
    .map(job => ({ ...job, franceScore: franceScore(job), techScore: techScore(job) }))
    .filter(job => job.franceScore > 0)
    .sort((a, b) => (b.franceScore + b.techScore) - (a.franceScore + a.techScore));

  const sourceHealth = perParserStats.map(s => ({
    parser: s.parser,
    status: s.status,
    found: s.found,
    saved: s.saved,
    durationMs: s.durationMs,
    error: s.error,
    efficiency: s.found ? Number((s.saved / s.found).toFixed(2)) : 0
  })).sort((a,b) => b.saved - a.saved);

  const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);

  log('STAT', null, '═══════════════════════════════════════════════════');
  log('STAT', null, `RÉSUMÉ — Durée totale: ${elapsedSec}s`);
  log('STAT', null, '═══════════════════════════════════════════════════');
  log('STAT', null, `Parsers exécutés : ${parserCount}`);
  log('STAT', null, `Parsers utiles   : ${successCount}`);
  log('STAT', null, `Parsers en erreur: ${perParserStats.filter(s => s.status === 'error').length}`);
  log('STAT', null, `Parsers vides    : ${perParserStats.filter(s => s.status === 'empty').length}`);
  log('STAT', null, `Offres brutes    : ${totalFound}`);
  log('STAT', null, `Invalides        : ${skippedInvalid}`);
  log('STAT', null, `Hors-tech        : ${techRejected}`);
  log('STAT', null, `Doublons         : ${duplicateCount}`);
  log('STAT', null, `Sauvegardées     : ${totalSaved}`);
  log('STAT', null, `Candidats France : ${franceCandidates.length}`);
  log('STAT', null, `Total en base    : ${dbCount}`);

  // Tableau récap par parser
  log('STAT', null, '');
  log('STAT', null, 'Détail par parser:');
  for (const s of perParserStats) {
    const icon = s.status === 'ok' ? '✅' : s.status === 'empty' ? '⚪' : '❌';
    const dur = s.durationMs ? `${(s.durationMs/1000).toFixed(1)}s` : '-';
    const errMsg = s.error ? ` err="${s.error.slice(0, 80)}"` : '';
    log('STAT', null, `  ${icon} ${s.parser.padEnd(20)} found=${String(s.found).padStart(3)} saved=${String(s.saved).padStart(3)} eff=${(s.efficiency * 100).toFixed(0).padStart(3)}% dur=${dur}${errMsg}`);
  }

  log('INFO', null, '💾 Génération des exports JSON...');
  try {
    const allJobs = await queryAll('SELECT * FROM jobs ORDER BY created_at DESC LIMIT 150');
    await fs.writeFile('latest_jobs.json', JSON.stringify(allJobs, null, 2));
    await fs.writeFile('all_sources_jobs.json', JSON.stringify(dedupedAll.slice(0, 200), null, 2));
    await fs.writeFile('france_candidates.json', JSON.stringify(franceCandidates.slice(0, 100), null, 2));
    await fs.writeFile('source_health.json', JSON.stringify(sourceHealth, null, 2));
    await fs.writeFile('scraper_report.json', JSON.stringify({
      generatedAt: new Date().toISOString(),
      mode: 'max-platforms-v4',
      durationSec: parseFloat(elapsedSec),
      summary: { parserCount, successCount, totalFound, skippedInvalid, techRejected, duplicateCount, totalSaved, franceCandidates: franceCandidates.length, dbCount },
      sourceHealth,
      parsers: perParserStats,
      franceTop: franceCandidates.slice(0, 20)
    }, null, 2));
    log('OK', null, 'Exports V4 générés.');
  } catch (e) {
    log('ERROR', null, 'Erreur export JSON: ' + e.message);
  }

  // Sauvegarder le log complet dans un fichier
  try {
    await fs.writeFile(LOG_PATH, logLines.join('\n') + '\n');
    log('OK', null, `Log détaillé sauvegardé dans ${LOG_PATH}`);
  } catch (e) {
    console.error('Erreur écriture log:', e.message);
  }

  return { perParserStats, sourceHealth, franceCandidates, logLines };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runScraper();
}
