/**
 * Parser pour Les Talents
 * Jobs tech et IT en France
 */

import * as cheerio from 'cheerio';

export async function fetchJobs() {
  const jobs = [];
  const url = 'https://www.espace-talents.fr/offre-emploi';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(url, { 
      signal: controller.signal,
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.log('[Les Talents] Skipped - HTTP ' + res.status);
      return jobs;
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    $('.offre-card, article.offre, .job-item').each((_, el) => {
      const title = $(el).find('h2, h3, .titre, .job-title').first().text().trim();
      const company = $(el).find('.entreprise, .company, .societe').first().text().trim();
      const location = $(el).find('.lieu, .location, .ville').first().text().trim();
      const href = $(el).find('a').attr('href');

      if (title && title.length > 3) {
        jobs.push({
          platform: 'lestandalents',
          title,
          company: company || 'Non spécifié',
          location: location || 'France',
          url: href ? (href.startsWith('http') ? href : `https://www.espace-talents.fr${href}`) : '',
          source: 'Les Talents',
          publishedAt: new Date().toISOString(),
          stack: [],
          type: 'Full-time'
        });
      }
    });

    console.log(`[Les Talents] Found ${jobs.length} jobs`);
  } catch (err) {
    console.error('[Les Talents] Error:', err.message);
  }

  return jobs;
}
