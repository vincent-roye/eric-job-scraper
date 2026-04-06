import { safeFetch } from './utils.js';

/**
 * Parser pour Reddit r/forhire et r/jobbit
 */

export async function fetchJobs() {
  const jobs = [];
  const urls = [
    'https://www.reddit.com/r/forhire/top/.rss?t=week',
    'https://www.reddit.com/r/jobbit/top/.rss?t=week'
  ];

  for (const url of urls) {
    try {
      const res = await safeFetch(url, {
        headers: { 'Accept': 'application/atom+xml,application/xml;q=0.9,*/*;q=0.8' }
      }, 10000);

      if (!res.ok) continue;

      const text = await res.text();
      const entries = text.match(/<entry>.*?<\/entry>/gs) || [];
      let localCount = 0;

      for (const entry of entries.slice(0, 20)) {
        const title = entry.match(/<title>(.*?)<\/title>/)?.[1] || '';
        const link = entry.match(/<link[^>]*href="(.*?)"/)?.[1] || '';
        const published = entry.match(/<published>(.*?)<\/published>/)?.[1] || '';
        const author = entry.match(/<name>(.*?)<\/name>/)?.[1] || '';

        if (title && (title.toLowerCase().includes('hiring') || title.toLowerCase().includes('for hire'))) {
          jobs.push({
            platform: 'reddit',
            title: title.trim().substring(0, 150),
            company: author || 'Reddit Community',
            location: 'Various',
            url: link.replace(/&amp;/g, '&'),
            source: 'Reddit Jobs',
            publishedAt: published,
            stack: [],
            type: 'Full-time'
          });
          localCount++;
        }
      }

      console.log(`[Reddit Jobs] Found ${localCount} jobs from ${url.split('/')[4]}`);
    } catch (e) {
      console.error('[Reddit Jobs] Error:', e.message);
    }
  }

  return jobs;
}
