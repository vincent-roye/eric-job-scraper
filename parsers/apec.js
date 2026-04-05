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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/rss+xml'
      }
    });
    clearTimeout(timeoutId);

    if (!res.ok) return [];

    const text = await res.text();
    const items = text.match(/<item>.*?<\/item>/gs) || [];

    return items.map(item => {
      const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || '';
      const link = item.match(/<link>(.*?)<\/link>/)?.[1] || '';
      const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';
      
      // APEC met souvent "H/F" à la fin, on nettoie
      const cleanTitle = title.replace(/ F\/H$/, '').replace(/ H\/F$/, '');

      return {
        title: cleanTitle,
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
    console.error('APEC error:', e.message);
    return [];
  }
}
