/**
 * Moteur principal du scraper Éric - V2 France-only
 */

import { saveJob, getJobCount, getDb } from './db.js';
import * as parsers from './parsers/index.js';
import { sleep, normalizeJob, isValidJob, isFranceLocation } from './parsers/utils.js';
import fs from 'fs/promises';

const TECH_KEYWORDS = [
  'dev', 'developer', 'développeur', 'engineer', 'ingénieur', 'fullstack', 'frontend', 'backend',
  'python', 'java', 'react', 'node', 'javascript', 'typescript', 'c#', 'ruby', 'go', 'rust',
  'cloud', 'aws', 'azure', 'docker', 'kubernetes', 'data', 'ai', 'machine learning', 'software',
  'web', 'mobile', 'ios', 'android', 'product engineer', 'sre', 'devops', 'qa', 'test automation'
];

const FRANCE_PREFERRED_PARSERS = [
  'fetchFranceTravailJobs',
  'fetchChooseYourBossJobs',
  'fetchWeLoveDevsJobs',
  'fetchLesJeudisJobs',
  'fetchJobTeaserJobs',
  'fetchHelloworkJobs',
  'fetchApecJobs',
  'fetchTalentioJobs',
  'fetchFreeWorkJobs',
  'fetchLesTalentsJobs'
];

const NON_TECH_TITLE_PATTERNS = [
  'copywriter', 'customer success', 'office assistant', 'content reviewer', 'inside sales',
  'customer support', 'project coordinator', 'retention manager'
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

export async function runScraper({ preferredOnly = true } = {}) {
  console.log('🇫🇷 Démarrage du scraper Éric France-only...');

  let totalFound = 0;
  let totalSaved = 0;
  let parserCount = 0;
  let successCount = 0;
  let skippedInvalid = 0;
  let duplicateCount = 0;
  let nonFranceCount = 0;
  const perParserStats = [];
  const collectedJobs = [];

  let fetchEntries = Object.entries(parsers);
  if (preferredOnly) {
    fetchEntries = fetchEntries.filter(([name]) => FRANCE_PREFERRED_PARSERS.includes(name));
  }

  for (const [parserName, fetchFn] of fetchEntries) {
    parserCount++;
    const parserLabel = parserName.replace(/^fetch/, '');
    const parserStat = { parser: parserLabel, found: 0, saved: 0, invalid: 0, nonFrance: 0, duplicates: 0, techFilteredOut: 0, status: 'ok' };

    try {
      await sleep(500 + Math.random() * 1000);
      const jobs = await fetchFn();

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
        if (!isFranceLocation(job.location)) {
          nonFranceCount++;
          parserStat.nonFrance++;
          return false;
        }
        if (!isTechJob(job.title, job.stack)) {
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
      console.log(`✅ ${parserLabel}: ${parserStat.saved}/${parserStat.found} sauvegardées (${parserStat.invalid} invalides, ${parserStat.nonFrance} hors-France, ${parserStat.techFilteredOut} hors-tech, ${parserStat.duplicates} doublons)`);
    } catch (e) {
      parserStat.status = 'error';
      parserStat.error = e.message;
      perParserStats.push(parserStat);
      console.error(`❌ ${parserLabel}: ${e.message}`);
    }
  }

  const dbCount = await getJobCount();
  const finalJobs = dedupeJobs(collectedJobs).slice(0, 100);

  console.log(`\n📊 Résumé France-only :`);
  console.log(`   Parsers exécutés : ${parserCount}`);
  console.log(`   Parsers utiles : ${successCount}`);
  console.log(`   Offres brutes : ${totalFound}`);
  console.log(`   Offres invalides ignorées : ${skippedInvalid}`);
  console.log(`   Offres hors-France ignorées : ${nonFranceCount}`);
  console.log(`   Doublons filtrés : ${duplicateCount}`);
  console.log(`   Offres Tech France sauvegardées : ${totalSaved}`);
  console.log(`   Total en base : ${dbCount}`);

  console.log('💾 Génération des exports JSON...');
  try {
    const db = await getDb();
    const allJobs = db.prepare("SELECT * FROM jobs WHERE lower(location) LIKE '%france%' OR lower(location) LIKE '%paris%' OR lower(location) LIKE '%lyon%' ORDER BY created_at DESC LIMIT 100").all();
    await fs.writeFile('latest_jobs.json', JSON.stringify(allJobs, null, 2));
    await fs.writeFile('scraper_report.json', JSON.stringify({
      generatedAt: new Date().toISOString(),
      preferredOnly,
      mode: 'france-only',
      summary: { parserCount, successCount, totalFound, skippedInvalid, nonFranceCount, duplicateCount, totalSaved, dbCount },
      parsers: perParserStats,
      sample: finalJobs.slice(0, 20)
    }, null, 2));
    console.log('✅ latest_jobs.json et scraper_report.json générés.');
  } catch (e) {
    console.error('Erreur export JSON:', e.message);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const preferredOnly = !process.argv.includes('--all');
  runScraper({ preferredOnly });
}
