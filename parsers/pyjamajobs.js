/**
 * Parser pour Pyjama Jobs
 * API retourne du HTML au lieu de JSON - mode HTML via Cheerio
 */

import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

export async function fetchJobs() {
  const jobs = [];
  const url = 'https://pyjamajobs.com/fr/offres-d-emploi/developpeur';

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      console.log('[Pyjama Jobs] Skipped - HTTP ' + response.status);
      return jobs;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Try various selectors for job cards
    $('a[href*="/offre/"], .job-card, article').each((_, el) => {
      const title = $(el).find('h2, h3, .job-title, .title').first().text().trim();
      const company = $(el).find('.company, .employer, .org').first().text().trim();
      const location = $(el).find('.location, .city, .place').first().text().trim();
      const href = $(el).attr('href');

      if (title && title.length > 3) {
        jobs.push({
          platform: 'pyjamajobs',
          title,
          company: company || 'Non spécifié',
          location: location || 'France',
          url: href && href.startsWith('http') ? href : (href ? `https://pyjamajobs.com${href}` : ''),
          date: new Date().toISOString()
        });
      }
    });

    console.log(`[Pyjama Jobs] Found ${jobs.length} jobs`);
  } catch (err) {
    console.error('[Pyjama Jobs] Error:', err.message);
  }

  return jobs;
}
