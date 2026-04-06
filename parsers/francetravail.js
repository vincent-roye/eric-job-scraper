import * as cheerio from 'cheerio';
import { safeFetch } from './utils.js';

const BASE_URL = 'https://candidat.francetravail.fr/offres/recherche';

function extractLocation(rootText, fallback = '') {
  const match = rootText.match(/\b(\d{2,3}\s*-\s*[^\n\r]+)/);
  if (match) return match[1].trim();
  const cityMatch = rootText.match(/\b(Paris|Lyon|Marseille|Toulouse|Bordeaux|Lille|Nantes|Rennes|Strasbourg|Montpellier|Nice|Grenade|Orsay|Limonest|Saint-Priest|Toulon|Boissy-Saint-Léger|Rillieux-la-Pape|Oullins|Biron)\b/i);
  if (cityMatch) return cityMatch[1].trim();
  return fallback || 'France';
}

async function fetchSearchPage(searchUrl, fallbackLocation) {
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
    const subtext = root.find('.subtext').first().text().replace(/\s+/g, ' ').trim();
    const parts = subtext.split(' - ').map(x => x.trim()).filter(Boolean);
    const company = parts[0] || root.find('[itemprop="name"]').first().text().trim() || 'Non spécifié';
    const locationText = parts.slice(1).join(' - ').trim() || extractLocation(root.text().replace(/\s+/g, ' '), fallbackLocation);
    const href = linkEl.attr('href') || '';

    if (title && href) {
      jobs.push({
        platform: 'francetravail',
        title,
        url: href.startsWith('http') ? href : `https://candidat.francetravail.fr${href}`,
        company,
        location: locationText,
        source: 'France Travail',
        publishedAt: new Date().toISOString(),
        stack: [],
        type: 'CDI'
      });
    }
  });

  return jobs;
}

export async function fetchJobs({ keywords = 'développeur', location = 'France', pages = 3 } = {}) {
  try {
    const collected = [];

    for (let page = 0; page < pages; page++) {
      const offset = page * 20;
      const pagePath = offset === 0 ? '' : `&range=${offset}-${offset + 19}`;
      const searchUrl = `${BASE_URL}?motsCles=${encodeURIComponent(keywords)}&lieu=${encodeURIComponent(location)}${pagePath}`;
      const jobs = await fetchSearchPage(searchUrl, location);
      if (!jobs.length) break;
      collected.push(...jobs);
    }

    console.log(`[FranceTravail] Found ${collected.length} jobs`);
    return collected;
  } catch (err) {
    console.error('[FranceTravail] Error:', err.message);
    return [];
  }
}
