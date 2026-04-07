/**
 * Parser pour Cadreo → HelloWork
 * Spécialisé cadres et ingénierie
 */

import * as cheerio from 'cheerio';
import { safeFetch } from './utils.js';

const CADREO_URL = 'https://www.hellowork.com/fr-fr/emploi/recherche.html?k=informatique&p=1';

export async function fetchJobs() {
  const jobs = [];

  try {
    const res = await safeFetch(CADREO_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    }, 15000);

    if (!res.ok) return jobs;

    const html = await res.text();
    const $ = cheerio.load(html);

    // Parse HelloWork job cards
    $('[data-testid="job-card"], .job-card, article.job').each((_, el) => {
      const $el = $(el);
      const title = $el.find('h2, h3, [data-testid*="title"]').first().text().trim();
      const company = $el.find('[data-testid*="company"], .company').first().text().trim();
      const location = $el.find('[data-testid*="location"], .location').first().text().trim();
      let url = $el.find('a').attr('href') || '';

      if (url && !url.startsWith('http')) {
        url = 'https://www.hellowork.com' + url;
      }

      if (title && url && url.includes('hellowork')) {
        jobs.push({
          title: title.replace(/\s*F\/H\s*$/i, '').trim(),
          company: company || 'Cadreo (HelloWork)',
          location: location || 'France',
          url,
          source: 'Cadreo',
          publishedAt: new Date().toISOString(),
          stack: [],
          type: 'CDI'
        });
      }
    });

    return jobs.slice(0, 30);
  } catch (e) {
    console.error('Cadreo error:', e.message);
    return [];
  }
}
