/**
 * Parser pour APEC
 * Utilise le flux RSS pour les cadres
 */

const APEC_RSS = 'https://www.apec.fr/rss-feed/offresdemploi?keywords=d%C3%A9veloppeur';

export async function fetchJobs(maxRetries = 2) {
  const jobs = [];
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      const res = await fetch(APEC_RSS, { 
        signal: controller.signal,
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
          'Accept': 'application/rss+xml, application/xml, text/xml',
          'Accept-Language': 'fr-FR,fr;q=0.9',
          'Cache-Control': 'no-cache'
        }
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 1000));
          continue;
        }
        console.log('[APEC] Skipped - HTTP ' + res.status);
        return jobs;
      }

      const text = await res.text();
      const items = text.match(/<item>.*?<\/item>/gs) || [];

      for (const item of items) {
        const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || '';
        const link = item.match(/<link>(.*?)<\/link>/)?.[1] || '';
        const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';
        
        if (link && title) {
          jobs.push({
            title: title.replace(/ F\/H$/, '').trim(),
            company: 'APEC',
            location: 'France',
            url: link,
            source: 'APEC',
            publishedAt: pubDate,
            stack: [],
            type: 'CDI'
          });
        }
      }
      
      console.log(`[APEC] Found ${jobs.length} jobs`);
      return jobs;
    } catch (e) {
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1500));
        continue;
      }
      console.error('[APEC] Error after retries:', e.message);
      return jobs;
    }
  }
  
  return jobs;
}
