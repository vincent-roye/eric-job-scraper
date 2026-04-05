/**
 * Parser pour LinkedIn Jobs
 * LinkedIn bloque fortement. On utilise un User-Agent très réaliste et on vise la version mobile ou un feed spécifique.
 */

import * as cheerio from 'cheerio';

export async function fetchJobs() {
  const jobs = [];
  // LinkedIn est quasi-impossible à scraper sans compte/session. 
  // On garde le parser pour l'instant mais il est probablement dead.
  console.log('[LinkedIn] Skipped - Requires authenticated session');
  return jobs;
}
