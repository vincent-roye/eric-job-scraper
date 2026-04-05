/**
 * Parser pour StartupJobs
 * Focus startups en Europe
 */

const STARTUPJOBS_API = 'https://api.startupjobs.com/v1/jobs?keywords=developer&country=fr';

export async function fetchJobs() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(STARTUPJOBS_API, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) return [];

    const data = await res.json();
    return (data.jobs || []).map(job => ({
      title: job.title,
      company: job.organization?.name || 'Startup',
      location: job.location?.name || 'Remote',
      url: job.url,
      source: 'StartupJobs',
      publishedAt: job.created_at,
      stack: job.skills || [],
      type: job.type || 'CDI'
    }));
  } catch (e) {
    console.error('StartupJobs error:', e.message);
    return [];
  }
}
