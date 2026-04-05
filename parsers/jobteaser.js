/**
 * Parser pour JobTeaser
 * Utilise le flux RSS public
 */

const JOBTEASER_RSS = 'https://www.jobteaser.com/fr/job/feed';

export async function fetchJobs() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(JOBTEASER_RSS, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) return [];

    const text = await res.text();
    const items = text.match(/<item>.*?</item>/gs) || [];

    return items.map(item => {
      const title = item.match(/<title><!\[CDATA\[(.*?)\]\]></title>/)?.[1] || '';
      const link = item.match(/<link>(.*?)</link>/)?.[1] || '';
      const pubDate = item.match(/<pubDate>(.*?)</pubDate>/)?.[1] || '';
      
      return {
        title: title,
        company: 'JobTeaser',
        location: 'Europe',
        url: link,
        source: 'JobTeaser',
        publishedAt: pubDate,
        stack: [],
        type: 'CDI'
      };
    }).filter(j => j.url);
  } catch (e) {
    console.error('JobTeaser error:', e.message);
    return [];
  }
}
