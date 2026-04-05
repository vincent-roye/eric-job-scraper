/**
 * Parser pour Welcome to the Jungle
 * Utilise le flux RSS public
 */

const WTTJ_RSS = 'https://www.welcometothejungle.com/fr/rss';

export async function fetchJobs() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(WTTJ_RSS, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) return [];

    const text = await res.text();
    const items = text.match(/<item>.*?<\/item>/gs) || [];

    return items.map(item => {
      const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || '';
      const link = item.match(/<link>(.*?)<\/link>/)?.[1] || '';
      const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';
      
      // Nettoyage du titre (souvent "Entreprise - Poste")
      const parts = title.split(' - ');
      const company = parts[0] || 'Welcome to the Jungle';
      const jobTitle = parts[1] || parts[0] || 'Développeur';

      return {
        title: jobTitle,
        company: company,
        location: 'France',
        url: link,
        source: 'Welcome to the Jungle',
        publishedAt: pubDate,
        stack: [],
        type: 'CDI'
      };
    }).filter(j => j.url);
  } catch (e) {
    console.error('WTTJ error:', e.message);
    return [];
  }
}
