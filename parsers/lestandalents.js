/**
 * Parser pour Les Talents (ex-APEC junior/cadres)
 * Utilise le flux RSS
 */

const LESTALENTS_RSS = 'https://www.lestantalents.fr/rss?metier=developpeur';

export async function fetchJobs() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(LESTALENTS_RSS, { 
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Eric-Bot/1.0)' }
    });
    clearTimeout(timeoutId);

    if (!res.ok) return [];

    const text = await res.text();
    const items = text.match(/<item>.*?<\/item>/gs) || [];

    return items.map(item => {
      const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || '';
      const link = item.match(/<link>(.*?)<\/link>/)?.[1] || '';
      const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';
      
      return {
        title: title,
        company: 'Les Talents',
        location: 'France',
        url: link,
        source: 'Les Talents',
        publishedAt: pubDate,
        stack: [],
        type: 'CDI'
      };
    }).filter(j => j.url);
  } catch (e) {
    console.error('Les Talents error:', e.message);
    return [];
  }
}
