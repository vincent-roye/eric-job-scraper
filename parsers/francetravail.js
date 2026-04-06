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

    $('.result').each((_, el) => {
      const root = $(el);
      const linkEl = root.find('a[href*="/offres/recherche/detail/"]').first();
      const title = root.find('.media-heading-title').first().text().trim() || root.find('h2').first().text().trim();
      const company = root.find('.subtext').first().text().trim() || root.find('[itemprop="name"]').first().text().trim() || 'Non spécifié';
      const locationText = root.find('.location').first().text().trim() || root.text().match(/Paris|Lyon|Marseille|Toulouse|Bordeaux|Lille|Nantes|Rennes|Strasbourg|Montpellier|Nice|Île-de-France|Ile-de-France/i)?.[0] || location;
      const href = linkEl.attr('href') || '';

      if (title && href) {
        jobs.push({
          platform: 'francetravail',
          title,
          url: href.startsWith('http') ? href : `https://candidat.francetravail.fr${href}`,
          company,
          location: locationText || location,
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
