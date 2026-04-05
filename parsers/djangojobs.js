/**
 * Parser pour Django Jobs
 * Source: https://djangojobs.net/
 * Utilise le scraping HTML
 */
import * as cheerio from 'cheerio';

export async function fetchJobs() {
  const jobs = [];
  const url = 'https://djangojobs.net/jobs/listing/';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(url, { 
      signal: controller.signal,
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml'
      }
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.log('[Django Jobs] Skipped - HTTP ' + res.status);
      return jobs;
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    $('.job-item').each((_, el) => {
      const title = $(el).find('.job-title a').first().text().trim();
      const company = $(el).find('.company-name').first().text().trim();
      const location = $(el).find('.job-location').first().text().trim();
      const link = $(el).find('.job-title a').attr('href');

      if (title && title.length > 5) {
        jobs.push({
          platform: 'djangojobs',
          title,
          company: company || 'Non spécifié',
          location: location || 'Remote',
          url: link && link.startsWith('http') ? link : `https://djangojobs.net${link}`,
          source: 'Django Jobs',
          publishedAt: new Date().toISOString(),
          stack: ['python', 'django'],
          type: 'Full-time'
        });
      }
    });

    console.log(`[Django Jobs] Found ${jobs.length} jobs`);
  } catch (e) {
    console.error('[Django Jobs] Error:', e.message);
  }

  return jobs;
}
