/**
 * Parser pour Freelance-info
 * Missions freelance et CDI IT en France
 * RSS feed pour les dernières offres
 */

const FREELANCE_INFO_RSS = 'https://www.freelance-info.fr/rss';

export async function fetchJobs() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(FREELANCE_INFO_RSS, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.log('[Freelance-info] Skipped - HTTP ' + res.status);
      return [];
    }

    const text = await res.text();
    const items = text.match(/<item>[\s\S]*?<\/item>/gi) || [];

    return items.map(item => {
      const title = item.match(/<title><!\[CDATA\[([^\]]+)\]\]><\/title>/i)?.[1] 
                 || item.match(/<title>([^<]+)<\/title>/i)?.[1] 
                 || '';
      const link = item.match(/<link>([^<]+)<\/link>/i)?.[1] || '';
      const pubDate = item.match(/<pubDate>([^<]+)<\/pubDate>/i)?.[1] || '';
      const description = item.match(/<description><!\[CDATA\[([^\]]+)\]\]><\/description>/i)?.[1] 
                       || item.match(/<description>([^<]+)<\/description>/i)?.[1] 
                       || '';

      // Extraction de la localisation depuis la description
      const locationMatch = description.match(/(?:Paris|Lyon|Marseille|Bordeaux|Nantes|Lille|Toulouse|Nice|Remote|Télétravail)/i);
      const location = locationMatch ? locationMatch[0] : 'France';

      return {
        title: title.trim(),
        company: 'Freelance-info',
        location,
        url: link,
        source: 'Freelance-info',
        publishedAt: pubDate || new Date().toISOString(),
        stack: [],
        type: description.toLowerCase().includes('freelance') ? 'Freelance' : 'CDI'
      };
    }).filter(j => j.title && j.url);
  } catch (e) {
    console.error('[Freelance-info] Error:', e.message);
    return [];
  }
}
