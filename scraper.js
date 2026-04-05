/**
 * Moteur principal du scraper Éric
 * Orchestre la récupération, le filtrage et la sauvegarde des offres.
 */

import { saveJob, getJobCount, getDb } from './db.js';
import * as parsers from './parsers/index.js';
import fs from 'fs/promises';

// Mots-clés pour filtrer les offres "Tech"
const TECH_KEYWORDS = [
  'dev', 'developer', 'développeur', 'engineer', 'ingénieur', 'fullstack', 'frontend', 'backend',
  'python', 'java', 'react', 'node', 'javascript', 'typescript', 'c#', 'ruby', 'go', 'rust',
  'cloud', 'aws', 'azure', 'docker', 'kubernetes', 'data', 'ai', 'machine learning'
];

function isTechJob(title, stack) {
  const content = (title + ' ' + (stack || []).join(' ')).toLowerCase();
  return TECH_KEYWORDS.some(keyword => content.includes(keyword));
}

export async function runScraper() {
  console.log('🚀 Démarrage du scraper Éric...');
  
  let totalFound = 0;
  let totalSaved = 0;

  const fetchFunctions = Object.values(parsers);

  for (const fetchFn of fetchFunctions) {
    try {
      const jobs = await fetchFn();
      totalFound += jobs.length;

      for (const job of jobs) {
        // Filtrage simple
        if (job.title && job.url && isTechJob(job.title, job.stack)) {
          await saveJob(job);
          totalSaved++;
        }
      }
      console.log(`✅ Parser exécuté. Offres trouvées: ${jobs.length}`);
    } catch (e) {
      console.error(`❌ Erreur parser:`, e.message);
    }
  }

  const dbCount = await getJobCount();
  console.log(`\n📊 Résumé :`);
  console.log(`   Offres brutes : ${totalFound}`);
  console.log(`   Offres Tech sauvegardées : ${totalSaved}`);
  console.log(`   Total en base : ${dbCount}`);

  // Export JSON pour consultation facile
  console.log('💾 Génération de l\'export JSON...');
  try {
    const db = await getDb();
    const allJobs = await db.all('SELECT * FROM jobs ORDER BY created_at DESC LIMIT 50');
    await fs.writeFile('latest_jobs.json', JSON.stringify(allJobs, null, 2));
    console.log('✅ latest_jobs.json généré avec les 50 dernières offres.');
  } catch (e) {
    console.error('Erreur export JSON:', e.message);
  }
}

// Exécution si lancé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  runScraper();
}
