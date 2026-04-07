/**
 * Parser pour Le Figaro Emploi (via Cadremploi)
 * 3M visiteurs/mois, généraliste
 */

import * as cheerio from 'cheerio';
import { safeFetch } from './utils.js';

const FIGARO_SEARCH = 'https://www.cadremploi.fr/offres-emploi/recherche/metier-informatique';

export async function fetchJobs() {
  const jobs = [];

  try {
    const res = await safeFetch(FIGARO_SEARCH, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    }, 15000);

    if (!res.ok) return jobs;

    const html = await res.text();
    const $ = cheerio.load(html);

    // Parse Cadremploi job listings
    $('[data-testid="job-card"], .job-card, li.search-result').each((_, el) => {
      const $el = $(el);
      const title = $el.find('h2, h3, a[href*="/offre"]').first().text().trim();
      const company = $el.find('.company, [data-testid*="company"]').first().text().trim();
      const location = $el.find('.location, [data-testid*="location"]').first().text().trim();
      let url = $el.find('a[href*="/offre"]').attr('href') || '';

      if (url && !url.startsWith('http')) {
        url = 'https://www.cadremploi.fr' + url;
      }

      if (title && url && (url.includes('cadremploi') || url.includes('offre'))) {
        jobs.push({
          title: title.replace(/\s*F\/H\s*$/i, '').trim(),
          company: company || 'Le Figaro Emploi',
          location: location || 'France',
          url,
          source: 'Le Figaro Emploi',
          publishedAt: new Date().toISOString(),
          stack: [],
          type: 'CDI'
        });
      }
    });

    return jobs.slice(0, 30);
  } catch (e) {
    console.error('Le Figaro Emploi error:', e.message);
    return [];
  }
}
