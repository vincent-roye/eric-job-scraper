/**
 * Parser pour Jobijoba
 * Agrégateur d'offres d'emploi français
 */

const JOBIJOBA_RSS = 'https://www.jobijoba.com/rss/?keywords=developpeur';

export async function fetchJobs() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(JOBIJOBA_RSS, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) return [];

    const text = await res.text();
    const items = text.match(/<item>.*?<\/item>/gs) || [];

    return items.map(item => {
      const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ||
                    item.match(/<title>(.*?)<\/title>/)?.[1] || '';
      const link = item.match(/<link>(.*?)<\/link>/)?.[1] || '';
      const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';
      const desc = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] ||
                   item.match(/<description>(.*?)<\/description>/)?.[1] || '';

      // Try to extract company from title or description
      const companyMatch = desc?.match(/<b[^>]*>(.*?)<\/b>/)?.[1] ||
                          desc?.match(/([^,]+)\s*-\s*$/) ||
                          'N/A';

      // Try to extract location from description
      const locationMatch = desc?.match(/(?:localisation|lieu|à)\s*[:–]\s*([^<]+)/i)?.[1] || 'France';

      return {
        title: title,
        company: companyMatch || 'N/A',
        location: locationMatch || 'France',
        url: link,
        source: 'Jobijoba',
        publishedAt: pubDate,
        stack: [],
        type: 'CDI'
      };
    }).filter(j => j.url && j.title);
  } catch (e) {
    console.error('Jobijoba error:', e.message);
    return [];
  }
}
