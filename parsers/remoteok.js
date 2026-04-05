import * as cheerio from 'cheerio';

/**
 * Parser pour Remote OK
 * Offres 100% remote
 */

export async function fetchJobs() {
  const jobs = [];
  const url = 'https://remoteok.com';

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
      console.log('[Remote OK] Skipped - HTTP ' + res.status);
      return jobs;
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // Remote OK stocke les données dans un JSON inline
    const scriptContent = $('script[type="application/ld+json"]').first().text();
    if (scriptContent) {
      try {
        const data = JSON.parse(scriptContent);
        const jobListings = Array.isArray(data) ? data : (data.itemListElement || []);
        
        jobListings.slice(0, 50).forEach(job => {
          const title = job.title || job.headline || '';
          const company = job.hiringOrganization?.name || '';
          const location = job.jobLocation?.address?.addressLocality || 'Remote';
          const url = job.url || '';

          if (title && title.length > 3) {
            jobs.push({
              platform: 'remoteok',
              title,
              company: company || 'Non spécifié',
              location: location || 'Remote',
              url: url.startsWith('http') ? url : `https://remoteok.com${url}`,
              source: 'Remote OK',
              publishedAt: job.datePosted || new Date().toISOString(),
              stack: [],
              type: 'Remote'
            });
          }
        });
      } catch (e) {
        console.error('[Remote OK] JSON parse error:', e.message);
      }
    }

    // Fallback: scraper HTML si JSON-LD échoue
    if (jobs.length === 0) {
      $('#jobsboard tr.job').slice(0, 50).each((_, el) => {
        const title = $(el).find('h2').first().text().trim();
        const company = $(el).find('.company').first().text().trim();
        const location = $(el).find('.location').first().text().trim();
        const link = $(el).find('a').attr('href');

        if (title && title.length > 3) {
          jobs.push({
            platform: 'remoteok',
            title,
            company: company || 'Non spécifié',
            location: location || 'Remote',
            url: link && link.startsWith('http') ? link : `https://remoteok.com${link}`,
            source: 'Remote OK',
            publishedAt: new Date().toISOString(),
            stack: [],
            type: 'Remote'
          });
        }
      });
    }

    console.log(`[Remote OK] Found ${jobs.length} jobs`);
  } catch (e) {
    console.error('[Remote OK] Error:', e.message);
  }

  return jobs;
}
