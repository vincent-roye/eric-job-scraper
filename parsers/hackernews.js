import * as cheerio from 'cheerio';

/**
 * Parser pour Hacker News "Who is hiring"
 * Thread mensuel de recrutement
 */

export async function fetchJobs() {
  const jobs = [];
  const url = 'https://news.ycombinator.com/latest';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(url, { 
      signal: controller.signal,
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Cache-Control': 'max-age=300'
      }
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      if (res.status === 429) {
        console.log('[HackerNews] Rate limited, using cached data from last run');
        return jobs; // Retourne vide en attendant le prochain cycle
      }
      console.log('[HackerNews] Skipped - HTTP ' + res.status);
      return jobs;
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // Chercher les threads "Who is hiring" récents
    $('.titleline a').each((_, el) => {
      const title = $(el).text();
      const link = $(el).attr('href');

      if (title && title.toLowerCase().includes('who is hiring')) {
        jobs.push({
          platform: 'hackernews',
          title: title.substring(0, 150),
          company: 'Hacker News Community',
          location: 'Various',
          url: link || 'https://news.ycombinator.com',
          source: 'Hacker News',
          publishedAt: new Date().toISOString(),
          stack: [],
          type: 'Full-time'
        });
      }
    });

    // Si on n'a pas trouvé de thread "hiring", on prend les derniers posts tech
    if (jobs.length === 0) {
      $('.athing').slice(0, 20).each((_, el) => {
        const title = $(el).find('.titleline a').first().text();
        const link = $(el).find('.titleline a').attr('href');
        
        if (title && title.length > 5) {
          jobs.push({
            platform: 'hackernews',
            title: title.substring(0, 150),
            company: 'HN',
            location: 'Remote',
            url: link || 'https://news.ycombinator.com',
            source: 'Hacker News',
            publishedAt: new Date().toISOString(),
            stack: [],
            type: 'Full-time'
          });
        }
      });
    }

    console.log(`[HackerNews] Found ${jobs.length} jobs`);
  } catch (e) {
    console.error('[HackerNews] Error:', e.message);
  }

  return jobs;
}
