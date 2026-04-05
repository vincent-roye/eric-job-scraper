/**
 * Parser pour StackOverflow Jobs (via RSS feed alternative)
 * Utilise le feed des questions avec tag "hiring"
 */

export async function fetchJobs() {
  const jobs = [];
  const url = 'https://stackoverflow.com/feeds/tag?tagnames=hiring&sort=newest';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(url, { 
      signal: controller.signal,
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/atom+xml, application/xml'
      }
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.log('[StackOverflow Jobs] Skipped - HTTP ' + res.status);
      return jobs;
    }

    const text = await res.text();
    const entries = text.match(/<entry>.*?<\/entry>/gs) || [];

    for (const entry of entries.slice(0, 30)) {
      const title = entry.match(/<title>(.*?)<\/title>/)?.[1] || '';
      const link = entry.match(/<link[^>]*href="(.*?)"/)?.[1] || '';
      const published = entry.match(/<published>(.*?)<\/published>/)?.[1] || '';
      const author = entry.match(/<name>(.*?)<\/name>/)?.[1] || '';

      if (title && link && title.toLowerCase().includes('hiring')) {
        jobs.push({
          platform: 'stackoverflow',
          title: title.trim().substring(0, 150),
          company: author || 'StackOverflow Community',
          location: 'Various',
          url: link.trim(),
          source: 'StackOverflow Jobs',
          publishedAt: published,
          stack: [],
          type: 'Full-time'
        });
      }
    }

    console.log(`[StackOverflow Jobs] Found ${jobs.length} jobs`);
  } catch (e) {
    console.error('[StackOverflow Jobs] Error:', e.message);
  }

  return jobs;
}
