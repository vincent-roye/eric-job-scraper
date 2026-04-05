import * as cheerio from 'cheerio';

/**
 * Parser pour Dev.to Jobs
 * Communauté développeurs - offres tech
 */

export async function fetchJobs() {
  const jobs = [];
  const url = 'https://dev.to/jobs';

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
      console.log('[Dev.to] Skipped - HTTP ' + res.status);
      return jobs;
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    $('.crayons-card').each((_, el) => {
      const title = $(el).find('h3 a').first().text().trim();
      const company = $(el).find('.crayons-subtitle-3').first().text().trim();
      const location = $(el).find('.crayons-tag__body').first().text().trim();
      const link = $(el).find('h3 a').attr('href');

      if (title && title.length > 3) {
        jobs.push({
          platform: 'devto',
          title,
          company: company || 'Non spécifié',
          location: location || 'Remote',
          url: link && link.startsWith('http') ? link : `https://dev.to${link}`,
          source: 'Dev.to',
          publishedAt: new Date().toISOString(),
          stack: [],
          type: 'Full-time'
        });
      }
    });

    console.log(`[Dev.to] Found ${jobs.length} jobs`);
  } catch (e) {
    console.error('[Dev.to] Error:', e.message);
  }

  return jobs;
}
