/**
 * Parser pour Ruby on Rails Jobs
 * Source: https://rubyonremote.com/
 * Offres Ruby/Rails en remote
 */
import * as cheerio from 'cheerio';

export async function fetchJobs() {
  const jobs = [];
  const url = 'https://rubyonremote.com/remote-ruby-on-rails-jobs/';

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
      console.log('[Ruby on Rails Jobs] Skipped - HTTP ' + res.status);
      return jobs;
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    $('article.post').each((_, el) => {
      const title = $(el).find('h2.entry-title a').first().text().trim();
      const link = $(el).find('h2.entry-title a').attr('href');
      const date = $(el).find('time').attr('datetime') || new Date().toISOString();

      if (title && title.length > 5) {
        jobs.push({
          platform: 'rubyonrailsjobs',
          title,
          company: 'Rails Community',
          location: 'Remote',
          url: link || '',
          source: 'Ruby on Rails Jobs',
          publishedAt: date,
          stack: ['ruby', 'rails'],
          type: 'Full-time'
        });
      }
    });

    console.log(`[Ruby on Rails Jobs] Found ${jobs.length} jobs`);
  } catch (e) {
    console.error('[Ruby on Rails Jobs] Error:', e.message);
  }

  return jobs;
}
