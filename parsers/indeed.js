import * as cheerio from 'cheerio';

/**
 * Parser pour Indeed - skip car blocage systematique
 * Indeed bloque massivement les scrapers
 */

export async function fetchJobs() {
  const jobs = [];
  console.log('[Indeed] Skipped - blocked by anti-bot (403)');
  return jobs;
}
