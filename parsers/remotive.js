import { safeFetch } from './utils.js';

/**
 * Parser pour Remotive
 */

export async function fetchJobs() {
  const jobs = [];
  const url = 'https://remotive.com/api/remote-jobs?category=software-dev';

  try {
    const res = await safeFetch(url, {
      headers: { 'Accept': 'application/json' }
    }, 15000);

    if (!res.ok) {
      console.log('[Remotive] Skipped - HTTP ' + res.status);
      return jobs;
    }

    const data = await res.json();
    const items = Array.isArray(data.jobs) ? data.jobs : [];

    items.slice(0, 30).forEach(job => {
      jobs.push({
        title: job.title,
        company: job.company_name,
        location: job.candidate_required_location || 'Remote',
        url: job.url,
        source: 'Remotive',
        publishedAt: job.publication_date,
        stack: Array.isArray(job.tags) ? job.tags : [],
        type: job.job_type || 'Remote'
      });
    });

    console.log(`[Remotive] Found ${jobs.length} jobs`);
  } catch (e) {
    console.error('[Remotive] Error:', e.message);
  }

  return jobs;
}
