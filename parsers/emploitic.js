/**
 * Parser pour Emploitic
 * N°1 de l'emploi en Algérie - offres IT et développeur
 */

import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

export async function fetchJobs() {
  const jobs = [];
  const url = 'https://emploitic.com/offres-d-emploi?search=developpeur';

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      console.log('[Emploitic] Skipped - HTTP ' + response.status);
      return jobs;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Parse job listings
    $('.offre-emploi, .job-card, article.job-listing, .result-item').each((_, el) => {
      const title = $(el).find('h2, h3, .titre-offre, .job-title, a').first().text().trim();
      const company = $(el).find('.entreprise, .company, .societe, .employer').first().text().trim();
      const location = $(el).find('.lieu, .location, .ville, .wilaya').first().text().trim();
      const href = $(el).find('a').attr('href');

      if (title && title.length > 3) {
        jobs.push({
          platform: 'emploitic',
          title,
          company: company || 'Non spécifié',
          location: location || 'Algérie',
          url: href ? (href.startsWith('http') ? href : `https://emploitic.com${href}`) : '',
          date: new Date().toISOString()
        });
      }
    });

    console.log(`[Emploitic] Found ${jobs.length} jobs`);
  } catch (err) {
    console.error('[Emploitic] Error:', err.message);
  }

  return jobs;
}
