/**
 * Parser pour APEC
 * Utilise le flux RSS pour les cadres
 */

const APEC_RSS = 'https://www.apec.fr/rss-feed/offresdemploi?keywords=d%C3%A9veloppeur';

export async function fetchJobs() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(APEC_RSS, { 
      signal: controller.signal,
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml'
      }
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.log('[APEC] Skipped - HTTP ' + res.status);
      return [];
    }

    const text = await res.text();
    const items = text.match(/<item>.*?<\/item>/gs) || [];

    return items.map(item => {
      const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || '';
      const link = item.match(/<link>(.*?)<\/link>/)?.[1] || '';
      const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';
      
      return {
        title: title.replace(/ F\/H$/, '').trim(),
        company: 'APEC',
        location: 'France',
        url: link,
        source: 'APEC',
        publishedAt: pubDate,
        stack: [],
        type: 'CDI'
      };
    }).filter(j => j.url);
  } catch (e) {
    console.error('[APEC] Error:', e.message);
    return [];
  }
}
