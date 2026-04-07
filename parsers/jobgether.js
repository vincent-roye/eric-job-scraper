import { safeFetch } from './utils.js';

/**
 * Parser pour Jobgether — offres France
 */

const JOBGETHER_URL = 'https://jobgether.com/api/public/v1/jobs?limit=50&search=developer&country=fr';

export async function fetchJobs() {
  const jobs = [];

  try {
    const res = await safeFetch(JOBGETHER_URL, {
      headers: { 'Accept': 'application/json' }
    }, 15000);

    if (!res.ok) return jobs;

    const data = await res.json();
    const jobList = Array.isArray(data.jobs) ? data.jobs : (data.data || []);

    const seen = new Set();
    for (const job of jobList) {
      const jobUrl = job.url || (job.id ? `https://jobgether.com/jobs/${job.id}` : '');
      if (!job.title || !jobUrl || seen.has(jobUrl)) continue;
      seen.add(jobUrl);

      jobs.push({
        title: job.title,
        company: job.company?.name || job.company || 'Jobgether',
        location: job.location || (job.remote ? 'Remote' : 'France'),
        url: jobUrl,
        source: 'Jobgether',
        publishedAt: job.published_at || job.publishedAt || new Date().toISOString(),
        stack: Array.isArray(job.tags) ? job.tags : (Array.isArray(job.skills) ? job.skills : []),
        type: job.job_type || job.type || 'Full-time'
      });
    }

    return jobs.slice(0, 30);
  } catch (e) {
    console.error('[Jobgether] Error:', e.message);
    return [];
  }
}
