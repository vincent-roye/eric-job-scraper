/**
 * Parser pour RegionJob
 * Emplois régionaux en France - scraping HelloWork (fusion)
 */

import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

export async function fetchJobs() {
  const jobs = [];
  const url = 'https://www.hellowork.com/fr-fr/emploi/recherche.html?k=D\u00e9veloppeur';

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      console.log('[RegionJob] Skipped - HTTP ' + response.status);
      return jobs;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Parse job listings from HelloWork
    $('a[href*="/offre/"]').each((_, el) => {
      const title = $(el).find('h2, h3, .job-title, title').first().text().trim();
      const company = $(el).find('.company-name, .employer, .recruiter-name').first().text().trim();
      const location = $(el).find('.location, .city, .geo').first().text().trim();
      const href = $(el).attr('href');

      if (title && title.length > 5) {
        jobs.push({
          platform: 'regionjob',
          title,
          company: company || 'Non spécifié',
          location: location || 'France',
          url: href ? (href.startsWith('http') ? href : `https://www.hellowork.com${href}`) : '',
          date: new Date().toISOString()
        });
      }
    });

    // Deduplicate
    const seen = new Set();
    const unique = jobs.filter(j => {
      if (seen.has(j.url)) return false;
      seen.add(j.url);
      return true;
    });

    console.log(`[RegionJob] Found ${unique.length} unique jobs`);
    return unique;
  } catch (err) {
    console.error('[RegionJob] Error:', err.message);
  }

  return jobs;
}
