/**
 * Parser pour Le Figaro Emploi
 * 3M visiteurs/mois, généraliste
 */

const FIGARO_RSS = 'https://rss.lefigaro.fr/cadremploi';

export async function fetchJobs() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(FIGARO_RSS, { 
      signal: controller.signal,
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
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
      const description = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] || '';

      return {
        title: title.replace(/\s*F\/H\s*$/i, '').trim(),
        company: 'Le Figaro Emploi',
        location: 'France',
        url: link,
        source: 'Le Figaro Emploi',
        publishedAt: pubDate,
        stack: [],
        type: 'CDI'
      };
    }).filter(j => j.url);
  } catch (e) {
    console.error('Le Figaro Emploi error:', e.message);
    return [];
  }
}
