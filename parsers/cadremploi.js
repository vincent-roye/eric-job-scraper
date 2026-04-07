/**
 * Parser pour Cadremploi
 * Plateforme #1 pour les cadres en France
 * Note: RSS endpoint bloqué, utilise web scraping
 */

import * as cheerio from 'cheerio';
import { safeFetch } from './utils.js';

const CADREMPLOI_URL = 'https://www.cadremploi.fr/offres-emploi/recherche/metier-informatique';

export async function fetchJobs() {
  const jobs = [];

  try {
    const res = await safeFetch(CADREMPLOI_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    }, 15000);

    if (!res.ok) return jobs;

    const html = await res.text();
    const $ = cheerio.load(html);

    // Parse Cadremploi job listings
    $('[data-testid="job-card"], .job-card, li[data-test-id*="job"]').each((_, el) => {
      const $el = $(el);
      const title = $el.find('h2, h3, a[href*="/offre"]').first().text().trim();
      const company = $el.find('.company-name, [data-testid*="company"]').first().text().trim();
      const location = $el.find('.location, [data-testid*="location"]').first().text().trim();
      let url = $el.find('a[href*="/offre"]').attr('href') || '';

      if (url && !url.startsWith('http')) {
        url = 'https://www.cadremploi.fr' + url;
      }

      if (title && url && url.includes('cadremploi')) {
        jobs.push({
          title: title.replace(/\s*F\/H\s*$/i, '').trim(),
          company: company || 'Cadremploi',
          location: location || 'France',
          url,
          source: 'Cadremploi',
          publishedAt: new Date().toISOString(),
          stack: [],
          type: 'CDI'
        });
      }
    });

    return jobs.slice(0, 30);
  } catch (e) {
    console.error('Cadremploi error:', e.message);
    return [];
  }
}
