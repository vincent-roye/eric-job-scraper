/**
 * Parser pour Cadremploi
 * Plateforme #1 pour les cadres en France
 * Utilise le flux RSS
 */

const CADREMPLOI_RSS = 'https://www.cadremploi.fr/jobs/flusss/rss/search.json?query=développeur&location=Paris';

export async function fetchJobs() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(CADREMPLOI_RSS, { 
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
      
      // Extraire la localisation si présente
      const location = item.match(/<g:addressLocality>(.*?)<\/g:addressLocality>/)?.[1] || 'France';

      return {
        title: title.replace(/\s*F\/H\s*$/i, '').trim(),
        company: 'Cadremploi',
        location,
        url: link,
        source: 'Cadremploi',
        publishedAt: pubDate,
        stack: [],
        type: 'CDI'
      };
    }).filter(j => j.url);
  } catch (e) {
    console.error('Cadremploi error:', e.message);
    return [];
  }
}
