/**
 * Parser pour Talent.io
 * Plateforme de recrutement tech en France (reverse recruiting)
 * Scrape la page careers publique
 */

import * as cheerio from 'cheerio';

export async function fetchJobs() {
  const jobs = [];
  const url = 'https://www.talent.io/jobs';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(url, { 
      signal: controller.signal,
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'fr-FR,fr;q=0.9'
      }
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.log('[Talent.io] Skipped - HTTP ' + res.status);
      return jobs;
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // Talent.io utilise du React SSR, on cherche les cartes job
    $('a[href^="/p/"]').each((_, el) => {
      const href = $(el).attr('href');
      const title = $(el).find('h2, h3, [class*="title"], [class*="Title"]').first().text().trim();
      const company = $(el).find('[class*="company"], [class*="Company"], [class*="employer"]').first().text().trim();
      const location = $(el).find('[class*="location"], [class*="Location"], [class*="city"]').first().text().trim();

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
  } catch (err) {
    console.error('[Talent.io] Error:', err.message);
  }

  return jobs;
}
