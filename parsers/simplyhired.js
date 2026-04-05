/**
 * Parser pour SimplyHired
 * Agrégateur d'offres d'emploi international
 */

import * as cheerio from 'cheerio';

export async function fetchJobs() {
  const jobs = [];
  const url = 'https://www.simplyhired.com/search?q=developer&l=France';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(url, { 
      signal: controller.signal,
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml'
      }
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.log('[SimplyHired] Skipped - HTTP ' + res.status);
      return jobs;
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    $('.job posting').each((_, el) => {
      const title = $(el).find('.jobposting-title').first().text().trim();
      const company = $(el).find('.posting-company-name').first().text().trim();
      const location = $(el).find('.posting-location').first().text().trim();
      const link = $(el).find('a.jobposting-link').attr('href');

      if (title && title.length > 5) {
        jobs.push({
          platform: 'simplyhired',
          title,
          company: company || 'Non spécifié',
          location: location || 'France',
          url: link && link.startsWith('http') ? link : `https://www.simplyhired.com${link}`,
          source: 'SimplyHired',
          publishedAt: new Date().toISOString(),
          stack: [],
          type: 'Full-time'
        });
      }
    });

    console.log(`[SimplyHired] Found ${jobs.length} jobs`);
  } catch (e) {
    console.error('[SimplyHired] Error:', e.message);
  }

  return jobs;
}
