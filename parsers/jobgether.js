/**
 * Parser pour Jobgether
 * Agrégateur d'offres remote internationales
 */

const JOBTIGHER_API = 'https://jobgether.co/api/public/v1/jobs?limit=30&offset=0';

export async function fetchJobs() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(JOBTIGHER_API, { 
      signal: controller.signal,
      headers: { 
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      }
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.log('[Jobgether] Skipped - HTTP ' + res.status);
      return [];
    }

    const data = await res.json();
    const jobs = (data.jobs || []);

    return jobs.map(job => ({
      title: job.title || '',
      company: job.company?.name || 'Entreprise',
      location: job.remote ? 'Remote' : (job.location || 'N/A'),
      url: job.url || (`https://jobgether.co/jobs/${job.id}` || ''),
      source: 'Jobgether',
      publishedAt: job.published_at || new Date().toISOString(),
      stack: job.tags || job.skills || [],
      type: job.job_type || 'Full-time'
    })).filter(j => j.title && j.url);
  } catch (e) {
    console.error('[Jobgether] Error:', e.message);
    return [];
  }
}
