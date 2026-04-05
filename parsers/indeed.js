import * as cheerio from 'cheerio';

/**
 * Parser pour Indeed
 * Utilise un User-Agent réaliste et des délais pour éviter les blocages.
 */

export async function fetchJobs() {
  const jobs = [];
  const url = 'https://fr.indeed.com/emplois?q=développeur&l=France';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const res = await fetch(url, { 
      signal: controller.signal,
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Ch-Ua': '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        'Referer': 'https://www.google.com/'
      }
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.log('[Indeed] Skipped - HTTP ' + res.status);
      return jobs;
    }

    const html = await res.text();
    
    // Détection basique de blocage
    if (html.includes('captcha') || html.includes('blocked') || html.length < 5000) {
      console.log('[Indeed] Skipped - Blocked by captcha or redirect');
      return jobs;
    }

    const $ = cheerio.load(html);

    // SelectorIndeed change souvent, on vise large
    $('a[id^="job_"]').each((_, el) => {
      const title = $(el).find('span').first().text().trim();
      const company = $(el).find('span[data-testid="company-name"]').first().text().trim();
      const location = $(el).find('div[data-testid="text-location"]').first().text().trim();
      const jobKey = $(el).attr('id')?.replace('job_', '');
      
      if (title && title.length > 5) {
        jobs.push({
          platform: 'indeed',
          title,
          company: company || 'Non spécifié',
          location: location || 'France',
          url: jobKey ? `https://fr.indeed.com/viewjob?jk=${jobKey}` : '',
          source: 'Indeed',
          publishedAt: new Date().toISOString(),
          stack: [],
          type: 'Full-time'
        });
      }
    });

    console.log(`[Indeed] Found ${jobs.length} jobs`);
  } catch (e) {
    console.error('[Indeed] Error:', e.message);
  }

  return jobs;
}
