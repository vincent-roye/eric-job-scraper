/**
 * Parser pour ChooseYourBoss
 * Job board tech français spécialisé développeurs
 */

const CHOOSEYOURBOSS_RSS = 'https://chooseyourboss.com/jobs/rss';

export async function fetchJobs() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(CHOOSEYOURBOSS_RSS, { signal: controller.signal });
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

      // Extract company name from description
      const companyMatch = desc.match(/<strong>(.*?)<\/strong>/)?.[1] || 'N/A';

      return {
        title: title,
        company: companyMatch,
        location: 'France',
        url: link,
        source: 'ChooseYourBoss',
        publishedAt: pubDate,
        stack: [],
        type: 'CDI'
      };
    }).filter(j => j.url && j.title);
  } catch (e) {
    console.error('ChooseYourBoss error:', e.message);
    return [];
  }
}
