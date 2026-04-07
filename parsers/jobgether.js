import { safeFetch } from './utils.js';

/**
 * Parser pour Jobgether — offres France
 */

const JOBGETHER_URLS = [
  'https://jobgether.com/api/public/v1/jobs?limit=30&offset=0&country=France',
  'https://jobgether.com/api/public/v1/jobs?limit=30&offset=0&location=Paris',
  'https://jobgether.com/api/public/v1/jobs?limit=30&offset=0&location=France',
];

export async function fetchJobs() {
  const seen = new Set();
  const allJobs = [];

  for (const url of JOBGETHER_URLS) {
    try {
      const res = await safeFetch(url, {
        headers: { 'Accept': 'application/json' }
      }, 15000);

      if (!res.ok) continue;

      const data = await res.json();
      const jobs = Array.isArray(data.jobs) ? data.jobs : [];

      for (const job of jobs) {
        const jobUrl = job.url || (job.id ? `https://jobgether.com/jobs/${job.id}` : '');
        if (!job.title || !jobUrl || seen.has(jobUrl)) continue;
        seen.add(jobUrl);

        allJobs.push({
          title: job.title,
          company: job.company?.name || 'Entreprise',
          location: job.location || (job.remote ? 'Remote France' : 'France'),
          url: jobUrl,
          source: 'Jobgether',
          publishedAt: job.published_at || new Date().toISOString(),
          stack: Array.isArray(job.tags) ? job.tags : (Array.isArray(job.skills) ? job.skills : []),
          type: job.job_type || 'Full-time'
        });
      }
    } catch (e) {
      console.error('[Jobgether] Error:', e.message);
    }
  }

  console.log(`[Jobgether] Found ${allJobs.length} jobs`);
  return allJobs;
}
