import { safeFetch } from './utils.js';

/**
 * Parser pour Remote OK
 */

export async function fetchJobs() {
  const jobs = [];
  const url = 'https://remoteok.com/api';

  try {
    const res = await safeFetch(url, {
      headers: { 'Accept': 'application/json' }
    }, 15000);

    if (!res.ok) {
      console.log(`[Remote OK] HTTP ${res.status}`);
      return jobs;
    }

    const data = await res.json();
    const jobListings = Array.isArray(data) ? data.slice(1) : [];

    for (const job of jobListings.slice(0, 30)) {
      if (job.position && job.company && job.url) {
        jobs.push({
          title: job.position,
          company: job.company,
          location: 'Remote',
          url: job.url,
          source: 'Remote OK',
          publishedAt: job.date || new Date().toISOString(),
          stack: Array.isArray(job.tags) ? job.tags : [],
          type: 'Remote'
        });
      }
    }

    console.log(`[Remote OK] Found ${jobs.length} jobs`);
  } catch (e) {
    console.error('[Remote OK] Error:', e.message);
  }

  return jobs;
}
