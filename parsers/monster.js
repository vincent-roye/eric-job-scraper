/**
 * Parser pour Monster (France)
 * Plateforme internationale d'emploi
 */

import * as cheerio from 'cheerio';
import { safeFetch } from './utils.js';

const MONSTER_URL = 'https://www.monster.fr/emploi/recherche?q=developpeur&where=France';

export async function fetchJobs() {
  const jobs = [];

  try {
    const res = await safeFetch(MONSTER_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    }, 15000);

    if (!res.ok) return jobs;

    const html = await res.text();
    const $ = cheerio.load(html);

    // Parse Monster job listings
    $('[data-testid*="jobcarditem"], .job-card-container, [class*="jobCard"]').each((_, el) => {
      const $el = $(el);
      const title = $el.find('h2, h3, [data-testid*="job-title"]').first().text().trim();
      const company = $el.find('[data-testid*="company"], .company-name').first().text().trim();
      const location = $el.find('[data-testid*="location"]').first().text().trim();
      let url = $el.find('a[href*="/emploi/"]').attr('href') || '';

      if (url && !url.startsWith('http')) {
        url = 'https://www.monster.fr' + url;
      }

      if (title && url && url.includes('monster')) {
        jobs.push({
          title: title.trim(),
          company: company || 'Monster',
          location: location || 'France',
          url,
          source: 'Monster',
          publishedAt: new Date().toISOString(),
          stack: [],
          type: 'CDI'
        });
      }
    });

    return jobs.slice(0, 30);
  } catch (e) {
    console.error('Monster error:', e.message);
    return [];
  }
}
