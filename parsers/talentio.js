/**
 * Parser pour Talent.io
 * Plateforme de recrutement tech en France
 * Utilise retry avec delai plus long
 */

import * as cheerio from 'cheerio';

export async function fetchJobs(maxRetries = 2) {
  const jobs = [];
  const url = 'https://www.talent.io/jobs';

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      const res = await fetch(url, { 
        signal: controller.signal,
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'fr-FR,fr;q=0.9',
          'Cache-Control': 'no-cache'
        }
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }
        console.log('[Talent.io] Skipped - HTTP ' + res.status);
        return jobs;
      }

      const html = await res.text();
      const $ = cheerio.load(html);

      // Talent.io utilise du React SSR
      $('a[href^="/p/"]').each((_, el) => {
        const href = $(el).attr('href');
        const title = $(el).find('h2, h3, [class*="title"], [class*="Title"]').first().text().trim();
        const company = $(el).find('[class*="company"], [class*="Company"]').first().text().trim();
        const location = $(el).find('[class*="location"], [class*="Location"]').first().text().trim();

        if (title && title.length > 5) {
          jobs.push({
            platform: 'talentio',
            title,
            company: company || 'Talent.io',
            location: location || 'France',
            url: `https://www.talent.io${href}`,
            source: 'Talent.io',
            publishedAt: new Date().toISOString(),
            stack: [],
            type: 'CDI'
          });
        }
      });

      console.log(`[Talent.io] Found ${jobs.length} jobs`);
      return jobs;
    } catch (err) {
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }
      console.error('[Talent.io] Error after retries:', err.message);
    }
  }

  return jobs;
}
