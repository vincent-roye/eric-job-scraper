import { safeFetch } from './utils.js';

/**
 * Parser pour Hacker News "Who is hiring"
 * Utilise hnrss avec fallback Algolia pour limiter les pannes 5xx.
 */

function extractRssItems(xml) {
  const jobs = [];
  const items = xml.split('<item>').slice(1).slice(0, 10);

  for (const item of items) {
    const title = item.match(/<title>(.*?)<\/title>/s)?.[1] || '';
    const link = item.match(/<link>(.*?)<\/link>/s)?.[1] || '';
    const date = item.match(/<pubDate>(.*?)<\/pubDate>/s)?.[1] || '';

    if (/who is hiring|hiring/i.test(title)) {
      jobs.push({
        platform: 'hackernews',
        title: title.trim().substring(0, 200),
        company: 'Hacker News Community',
        location: 'Various',
        url: link.replace(/&amp;/g, '&').trim(),
        source: 'Hacker News',
        publishedAt: date,
        stack: [],
        type: 'Full-time'
      });
    }
  }

  return jobs;
}

export async function fetchJobs() {
  const rssUrl = 'https://hnrss.org/newest?points=3&q=Who%20is%20Hiring';
  const fallbackUrl = 'https://hn.algolia.com/api/v1/search?query=%22Who%20is%20hiring%22&tags=story';

  try {
    const res = await safeFetch(rssUrl, {
      headers: {
        'Accept': 'application/rss+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    }, 15000);

    if (res.ok) {
      const xml = await res.text();
      const jobs = extractRssItems(xml);
      console.log(`[HackerNews] Found ${jobs.length} jobs via RSS`);
      return jobs;
    }

    console.log(`[HackerNews] RSS fallback triggered (HTTP ${res.status})`);
  } catch (e) {
    console.log(`[HackerNews] RSS fallback triggered (${e.message})`);
  }

  try {
    const res = await safeFetch(fallbackUrl, {
      headers: { 'Accept': 'application/json' }
    }, 15000);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const hits = Array.isArray(data.hits) ? data.hits.slice(0, 10) : [];

    const jobs = hits
      .filter(hit => /who is hiring|hiring/i.test(hit.title || ''))
      .map(hit => ({
        platform: 'hackernews',
        title: (hit.title || '').trim().substring(0, 200),
        company: 'Hacker News Community',
        location: 'Various',
        url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
        source: 'Hacker News',
        publishedAt: hit.created_at || new Date().toISOString(),
        stack: [],
        type: 'Full-time'
      }));

    console.log(`[HackerNews] Found ${jobs.length} jobs via Algolia fallback`);
    return jobs;
  } catch (e) {
    console.error('[HackerNews] Error:', e.message);
    return [];
  }
}
