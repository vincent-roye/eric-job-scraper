/**
 * Parser pour JobsBoard (GitHub Jobs API mirror)
 * API publique et fiable
 */

export async function fetchJobs() {
  const jobs = [];
  const url = 'https://jobs.github.com/positions.json?search=developer';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(url, { 
      signal: controller.signal,
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      }
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.log('[JobsBoard] Skipped - HTTP ' + res.status);
      return jobs;
    }

    const data = await res.json();
    
    for (const job of (data || [])) {
      jobs.push({
        platform: 'jobsboard',
        title: job.title || 'N/A',
        company: job.company || 'N/A',
        location: job.location || 'Remote',
        url: job.url || '',
        source: 'GitHub Jobs',
        publishedAt: job.created_at || new Date().toISOString(),
        stack: [],
        type: job.type || 'Full-time'
      });
    }

    console.log(`[JobsBoard] Found ${jobs.length} jobs`);
  } catch (e) {
    console.error('[JobsBoard] Error:', e.message);
  }

  return jobs;
}
