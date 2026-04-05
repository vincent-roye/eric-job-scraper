/**
 * Parser pour Reddit r/forhire et r/jobbit
 * Utilise le RSS Reddit (public et fiable)
 */

export async function fetchJobs() {
  const jobs = [];
  const urls = [
    'https://www.reddit.com/r/forhire/top/.rss?t=week',
    'https://www.reddit.com/r/jobbit/top/.rss?t=week'
  ];

  for (const url of urls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(url, { 
        signal: controller.signal,
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
        }
      });
      clearTimeout(timeoutId);

      if (!res.ok) continue;

      const text = await res.text();
      const entries = text.match(/<entry>.*?<\/entry>/gs) || [];

      for (const entry of entries.slice(0, 20)) {
        const title = entry.match(/<title>(.*?)<\/title>/)?.[1] || '';
        const link = entry.match(/<link[^>]*href="(.*?)"/)?.[1] || '';
        const published = entry.match(/<published>(.*?)<\/published>/)?.[1] || '';
        const author = entry.match(/<name>\s*<[^>]*>\s*(.*?)\s*<\/[^>]*>\s*<\/name>/s)?.[1] || '';

        // Cherche les posts qui mentionnent "hiring" ou "for hire"
        if (title && (title.toLowerCase().includes('hiring') || title.toLowerCase().includes('for hire'))) {
          jobs.push({
            platform: 'reddit',
            title: title.trim().substring(0, 150),
            company: author || 'Reddit Community',
            location: 'Various',
            url: link.replace('&amp;', '&'),
            source: 'Reddit Jobs',
            publishedAt: published,
            stack: [],
            type: 'Full-time'
          });
        }
      }

      console.log(`[Reddit Jobs] Found ${jobs.length} jobs from ${url.split('/')[4]}`);
    } catch (e) {
      console.error('[Reddit Jobs] Error:', e.message);
    }
  }

  return jobs;
}
