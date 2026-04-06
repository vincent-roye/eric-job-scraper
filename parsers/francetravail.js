import * as cheerio from 'cheerio';
import { safeFetch } from './utils.js';

const BASE_URL = 'https://candidat.francetravail.fr/offres/recherche';

export async function fetchJobs({ keywords = 'développeur', location = 'Paris' } = {}) {
  try {
    const searchUrl = `${BASE_URL}?motsCles=${encodeURIComponent(keywords)}&lieu=${encodeURIComponent(location)}`;
    const response = await safeFetch(searchUrl, {}, 15000);

    if (!response.ok) {
      console.log('[FranceTravail] Skipped - HTTP ' + response.status);
      return [];
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const jobs = [];

    $('.results-pe .offre').each((_, el) => {
      const titleEl = $(el).find('.intitule');
      const companyEl = $(el).find('.entreprise');
      const locationEl = $(el).find('.lieu-travail');
      const linkEl = $(el).find('a.resultat-link');
      const href = linkEl.attr('href') || '';

      if (titleEl.length && href) {
        jobs.push({
          platform: 'francetravail',
          title: titleEl.text().trim(),
          url: href.startsWith('http') ? href : `https://candidat.francetravail.fr${href}`,
          company: companyEl.text().trim(),
          location: locationEl.text().trim(),
          source: 'France Travail',
          publishedAt: new Date().toISOString(),
          stack: [],
          type: 'CDI'
        });
      }
    });

    console.log(`[FranceTravail] Found ${jobs.length} jobs`);
    return jobs;
  } catch (err) {
    console.error('[FranceTravail] Error:', err.message);
    return [];
  }
}
