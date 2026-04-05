/**
 * Parser pour RemoteOK
 * Utilise le flux JSON public
 */

const REMOTEOK_API = 'https://remoteok.com/api';

export async function fetchJobs() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(REMOTEOK_API, { 
      signal: controller.signal,
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      } 
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.log('[RemoteOK] Skipped - HTTP ' + res.status);
      return [];
    }

    const data = await res.json();
    // L'API RemoteOK renvoie une array où le premier élément est souvent des stats
    const jobs = Array.isArray(data) ? data.slice(1) : [];

    return jobs.map(job => {
      let publishedAt;
      try {
        // RemoteOK date peut etre epoch en secondes ou string
        const dateVal = job.date;
        if (typeof dateVal === 'number' && dateVal > 0) {
          publishedAt = new Date(dateVal * 1000).toISOString();
        } else if (typeof dateVal === 'string' && dateVal) {
          publishedAt = new Date(dateVal).toISOString();
        } else {
          publishedAt = new Date().toISOString();
        }
      } catch (e) {
        publishedAt = new Date().toISOString();
      }

      return {
        platform: 'remoteok',
        title: job.position || 'Job',
        company: job.company || 'N/A',
        location: job.location || 'Remote',
        url: job.url || '',
        date: publishedAt,
        stack: job.tags ? job.tags.map(t => typeof t === 'string' ? t : (t.name || t.slug || '')) : [],
        type: 'Remote'
      };
    }).filter(j => j.title && j.url);
  } catch (e) {
    console.error('[RemoteOK] Error:', e.message);
    return [];
  }
}
