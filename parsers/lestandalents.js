/**
 * Parser pour Les Talents
 * Jobs tech et IT en France
 */

import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

export async function fetchJobs() {
  const jobs = [];
  const url = 'https://www.espace-talents.fr/offre-emploi';

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      console.log('[Les Talents] Skipped - HTTP ' + response.status);
      return jobs;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Parse job listings from cards
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
          date: new Date().toISOString()
        });
      }
    });

    console.log(`[Les Talents] Found ${jobs.length} jobs`);
  } catch (err) {
    console.error('[Les Talents] Error:', err.message);
  }

  return jobs;
}
