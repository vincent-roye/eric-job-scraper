/**
 * Parser pour Pyjama Jobs
 * Startups et scale-ups en Europe
 */

import * as cheerio from 'cheerio';

export async function fetchJobs() {
  const jobs = [];
  const url = 'https://pyjama.io/jobs?location=France';

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
      console.log('[Pyjama Jobs] Skipped - HTTP ' + res.status);
      return jobs;
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // Pyjama utilise souvent des composants React, on cherche les liens jobs
    $('a[href^="/job/"]').each((_, el) => {
      const title = $(el).text().trim();
      const href = $(el).attr('href');
      
      if (title && title.length > 5 && href) {
        jobs.push({
          platform: 'pyjama',
          title,
          company: 'Pyjama',
          location: 'France',
          url: `https://pyjama.io${href}`,
          source: 'Pyjama Jobs',
          publishedAt: new Date().toISOString(),
          stack: [],
          type: 'Full-time'
        });
      }
    });

    console.log(`[Pyjama Jobs] Found ${jobs.length} jobs`);
  } catch (e) {
    console.error('[Pyjama Jobs] Error:', e.message);
  }

  return jobs;
}
