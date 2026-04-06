/**
 * Moteur principal du scraper Éric
 * Orchestre la récupération, le filtrage et la sauvegarde des offres.
 */

import { saveJob, getJobCount, getDb } from './db.js';
import * as parsers from './parsers/index.js';
import { sleep, normalizeJob, isValidJob } from './parsers/utils.js';
import fs from 'fs/promises';

const TECH_KEYWORDS = [
  'dev', 'developer', 'développeur', 'engineer', 'ingénieur', 'fullstack', 'frontend', 'backend',
  'python', 'java', 'react', 'node', 'javascript', 'typescript', 'c#', 'ruby', 'go', 'rust',
  'cloud', 'aws', 'azure', 'docker', 'kubernetes', 'data', 'ai', 'machine learning', 'software',
  'web', 'mobile', 'ios', 'android', 'product engineer', 'sre', 'devops'
];

function isTechJob(title, stack) {
  const content = (title + ' ' + (stack || []).join(' ')).toLowerCase();
  return TECH_KEYWORDS.some(keyword => content.includes(keyword));
}

export async function runScraper() {
  console.log('🚀 Démarrage du scraper Éric...');

  let totalFound = 0;
  let totalSaved = 0;
  let parserCount = 0;
  let successCount = 0;
  let skippedInvalid = 0;
  const perParserStats = [];

  const fetchEntries = Object.entries(parsers);

  for (const [parserName, fetchFn] of fetchEntries) {
    parserCount++;
    const parserLabel = parserName.replace(/^fetch/, '');
    const parserStat = { parser: parserLabel, found: 0, saved: 0, invalid: 0, techFilteredOut: 0, status: 'ok' };

    try {
      await sleep(600 + Math.random() * 1400);
      const jobs = await fetchFn();

      if (!Array.isArray(jobs) || jobs.length === 0) {
        parserStat.status = 'empty';
        perParserStats.push(parserStat);
        continue;
      }

      totalFound += jobs.length;
      parserStat.found = jobs.length;

      for (const rawJob of jobs) {
        const job = normalizeJob(rawJob);

        if (!isValidJob(job)) {
          skippedInvalid++;
          parserStat.invalid++;
          continue;
        }

        if (!isTechJob(job.title, job.stack)) {
          parserStat.techFilteredOut++;
          continue;
        }

        await saveJob(job);
        totalSaved++;
        parserStat.saved++;
      }

      successCount++;
      perParserStats.push(parserStat);
      console.log(`✅ ${parserLabel}: ${parserStat.saved}/${parserStat.found} sauvegardées (${parserStat.invalid} invalides, ${parserStat.techFilteredOut} hors-tech)`);
    } catch (e) {
      parserStat.status = 'error';
      parserStat.error = e.message;
      perParserStats.push(parserStat);
      console.error(`❌ ${parserLabel}: ${e.message}`);
    }
  }

  const dbCount = await getJobCount();
  console.log(`\n📊 Résumé :`);
  console.log(`   Parsers exécutés : ${parserCount}`);
  console.log(`   Parsers utiles : ${successCount}`);
  console.log(`   Offres brutes : ${totalFound}`);
  console.log(`   Offres invalides ignorées : ${skippedInvalid}`);
  console.log(`   Offres Tech sauvegardées : ${totalSaved}`);
  console.log(`   Total en base : ${dbCount}`);

  console.log('💾 Génération des exports JSON...');
  try {
    const db = await getDb();
    const allJobs = db.prepare('SELECT * FROM jobs ORDER BY created_at DESC LIMIT 50').all();
    await fs.writeFile('latest_jobs.json', JSON.stringify(allJobs, null, 2));
    await fs.writeFile('scraper_report.json', JSON.stringify({
      generatedAt: new Date().toISOString(),
      summary: { parserCount, successCount, totalFound, skippedInvalid, totalSaved, dbCount },
      parsers: perParserStats,
    }, null, 2));
    console.log('✅ latest_jobs.json et scraper_report.json générés.');
  } catch (e) {
    console.error('Erreur export JSON:', e.message);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runScraper();
}
