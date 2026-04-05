/**
 * Parser pour APEC
 * Utilise le flux RSS pour les cadres
 */

const APEC_RSS = 'https://www.apec.fr/rss-feed/offresdemploi?keywords=d%C3%A9veloppeur&selectedCategories=1';

export async function fetchJobs() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(APEC_RSS, { signal: controller.signal });
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
