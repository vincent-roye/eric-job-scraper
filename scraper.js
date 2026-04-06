/**
 * Moteur principal du scraper Éric - V4 max-platforms
 */

import { saveJob, getJobCount, getDb } from './db.js';
import * as parsers from './parsers/index.js';
import { sleep, normalizeJob, isValidJob, isFranceLocation } from './parsers/utils.js';
import fs from 'fs/promises';

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
  const title = (job.title || '').toLowerCase();
  const location = (job.location || '').toLowerCase();
  const company = (job.company || '').toLowerCase();

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
  console.log('🌍 Démarrage du scraper Éric V4 max-platforms...');

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

  for (const [parserName, fetchFn] of fetchEntries) {
    parserCount++;
    const parserLabel = parserName.replace(/^fetch/, '');
    const parserStat = { parser: parserLabel, found: 0, saved: 0, invalid: 0, techFilteredOut: 0, duplicates: 0, status: 'ok' };

    try {
      await sleep(400 + Math.random() * 900);
      const jobs = parserName === 'fetchFranceTravailJobs'
        ? await fetchFn({ keywords: 'développeur', location: 'France', pages: 3 })
        : await fetchFn();

      if (!Array.isArray(jobs) || jobs.length === 0) {
        parserStat.status = 'empty';
        perParserStats.push(parserStat);
        continue;
      }

      totalFound += jobs.length;
      parserStat.found = jobs.length;

      const normalized = jobs.map(normalizeJob).filter(job => {
        if (!isValidJob(job)) {
          skippedInvalid++;
          parserStat.invalid++;
          return false;
        }
        if (!isTechJob(job.title, job.stack)) {
          techRejected++;
          parserStat.techFilteredOut++;
          return false;
        }
        return true;
      });

      const deduped = dedupeJobs(normalized);
      parserStat.duplicates = normalized.length - deduped.length;
      duplicateCount += parserStat.duplicates;

      for (const job of deduped) {
        await saveJob(job);
        collectedJobs.push(job);
        totalSaved++;
        parserStat.saved++;
      }

      successCount++;
      perParserStats.push(parserStat);
      console.log(`✅ ${parserLabel}: ${parserStat.saved}/${parserStat.found} sauvegardées (${parserStat.invalid} invalides, ${parserStat.techFilteredOut} hors-tech, ${parserStat.duplicates} doublons)`);
    } catch (e) {
      parserStat.status = 'error';
      parserStat.error = e.message;
      perParserStats.push(parserStat);
      console.error(`❌ ${parserLabel}: ${e.message}`);
    }
  }

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
    efficiency: s.found ? Number((s.saved / s.found).toFixed(2)) : 0
  })).sort((a,b) => b.saved - a.saved);

  console.log(`\n📊 Résumé V4 :`);
  console.log(`   Parsers exécutés : ${parserCount}`);
  console.log(`   Parsers utiles : ${successCount}`);
  console.log(`   Offres brutes : ${totalFound}`);
  console.log(`   Offres invalides ignorées : ${skippedInvalid}`);
  console.log(`   Offres hors-tech ignorées : ${techRejected}`);
  console.log(`   Doublons filtrés : ${duplicateCount}`);
  console.log(`   Offres sauvegardées : ${totalSaved}`);
  console.log(`   Candidats France : ${franceCandidates.length}`);
  console.log(`   Total en base : ${dbCount}`);

  console.log('💾 Génération des exports JSON...');
  try {
    const db = await getDb();
    const allJobs = db.prepare('SELECT * FROM jobs ORDER BY created_at DESC LIMIT 150').all();
    await fs.writeFile('latest_jobs.json', JSON.stringify(allJobs, null, 2));
    await fs.writeFile('all_sources_jobs.json', JSON.stringify(dedupedAll.slice(0, 200), null, 2));
    await fs.writeFile('france_candidates.json', JSON.stringify(franceCandidates.slice(0, 100), null, 2));
    await fs.writeFile('source_health.json', JSON.stringify(sourceHealth, null, 2));
    await fs.writeFile('scraper_report.json', JSON.stringify({
      generatedAt: new Date().toISOString(),
      mode: 'max-platforms-v4',
      summary: { parserCount, successCount, totalFound, skippedInvalid, techRejected, duplicateCount, totalSaved, franceCandidates: franceCandidates.length, dbCount },
      sourceHealth,
      parsers: perParserStats,
      franceTop: franceCandidates.slice(0, 20)
    }, null, 2));
    console.log('✅ Exports V4 générés.');
  } catch (e) {
    console.error('Erreur export JSON:', e.message);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runScraper();
}
