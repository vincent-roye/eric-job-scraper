/**
 * Parser pour Joblist
 * Spécialisation développeurs
 */

const JOBLIST_API = 'https://joblist.tech/api/jobs?tag=dev';

export async function fetchJobs() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(JOBLIST_API, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) return [];

    const jobs = await res.json();
    return (jobs || []).map(job => ({
      title: job.title,
      company: job.company,
      location: job.location || 'Remote',
      url: job.url,
      source: 'Joblist',
      publishedAt: job.created_at || new Date().toISOString(),
      stack: job.tags || [],
      type: 'CDI'
    }));
  } catch (e) {
    console.error('Joblist error:', e.message);
    return [];
  }
}
