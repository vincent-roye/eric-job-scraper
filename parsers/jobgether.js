import { safeFetch } from './utils.js';

/**
 * Parser pour Jobgether
 */

const JOBGETHER_API = 'https://jobgether.com/api/public/v1/jobs?limit=30&offset=0';

export async function fetchJobs() {
  try {
    const res = await safeFetch(JOBGETHER_API, {
      headers: { 'Accept': 'application/json' }
    }, 15000);

    if (!res.ok) {
      console.log('[Jobgether] Skipped - HTTP ' + res.status);
      return [];
    }

    const data = await res.json();
    const jobs = Array.isArray(data.jobs) ? data.jobs : [];

    const normalized = jobs.map(job => ({
      title: job.title || '',
      company: job.company?.name || 'Entreprise',
      location: job.remote ? 'Remote' : (job.location || 'N/A'),
      url: job.url || (job.id ? `https://jobgether.com/jobs/${job.id}` : ''),
      source: 'Jobgether',
      publishedAt: job.published_at || new Date().toISOString(),
      stack: Array.isArray(job.tags) ? job.tags : (Array.isArray(job.skills) ? job.skills : []),
      type: job.job_type || 'Full-time'
    })).filter(j => j.title && j.url);

    console.log(`[Jobgether] Found ${normalized.length} jobs`);
    return normalized;
  } catch (e) {
    console.error('[Jobgether] Error:', e.message);
    return [];
  }
}
