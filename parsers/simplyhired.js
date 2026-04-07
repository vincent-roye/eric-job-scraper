/**
 * Parser pour SimplyHired — offres France
 */

import * as cheerio from 'cheerio';
import { safeFetch } from './utils.js';

const URLS = [
  'https://www.simplyhired.com/search?q=d%C3%A9veloppeur&l=France',
  'https://www.simplyhired.com/search?q=developer&l=Paris',
];

export async function fetchJobs() {
  const jobs = [];
  const seen = new Set();

  for (const url of URLS) {
    try {
      const res = await safeFetch(url, {
        headers: { 'Accept': 'text/html,application/xhtml+xml' }
      }, 15000);

      if (!res.ok) {
        console.log('[SimplyHired] Skipped - HTTP ' + res.status);
        continue;
      }

      const html = await res.text();
      const $ = cheerio.load(html);

      $('.job.posting').each((_, el) => {
        const title = $(el).find('.jobposting-title').first().text().trim();
        const company = $(el).find('.posting-company-name').first().text().trim();
        const location = $(el).find('.posting-location').first().text().trim();
        const link = $(el).find('a.jobposting-link').attr('href');

        const fullUrl = link && link.startsWith('http') ? link : `https://www.simplyhired.com${link}`;
        if (title && title.length > 5 && !seen.has(fullUrl)) {
          seen.add(fullUrl);
          jobs.push({
            title,
            company: company || 'Non spécifié',
            location: location || 'France',
            url: fullUrl,
            source: 'SimplyHired',
            publishedAt: new Date().toISOString(),
            stack: [],
            type: 'Full-time'
          });
        }
      });
    } catch (e) {
      console.error('[SimplyHired] Error:', e.message);
    }
  }

  console.log(`[SimplyHired] Found ${jobs.length} jobs`);
  return jobs;
}
