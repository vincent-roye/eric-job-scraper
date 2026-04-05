/**
 * Parser pour Dev.to Jobs
 * Flux RSS des offres tech
 */

export async function fetchJobs() {
  const jobs = [];
  const url = 'https://dev.to/feed/tag/hiring';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(url, { 
      signal: controller.signal,
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml'
      }
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.log('[Dev.to] Skipped - HTTP ' + res.status);
      return jobs;
    }

    const text = await res.text();
    const items = text.match(/<item>.*?<\/item>/gs) || [];

    for (const item of items.slice(0, 20)) {
      const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || 
                    item.match(/<title>(.*?)<\/title>/)?.[1] || '';
      const link = item.match(/<link>(.*?)<\/link>/)?.[1] || '';
      const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';
      const description = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] || 
                         item.match(/<description>(.*?)<\/description>/)?.[1] || '';

      if (title && link) {
        jobs.push({
          platform: 'devto',
          title: title.trim(),
          company: 'Dev.to Community',
          location: 'Remote/Various',
          url: link.trim(),
          date: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
          description: description.replace(/<[^>]*>/g, '').substring(0, 500)
        });
      }
    }

    console.log(`[Dev.to] Found ${jobs.length} jobs`);
  } catch (e) {
    console.error('[Dev.to] Error:', e.message);
  }

  return jobs;
}
