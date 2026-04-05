/**
 * Parser pour WeLoveDevs
 * Job board tech français spécialisé développeurs
 */

const WELOVEDEVS_API = 'https://welovedevs.com/app/backoffice/api/v3/open/job-offers';

export async function fetchJobs() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(WELOVEDEVS_API, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) return [];

    const data = await res.json();
    const jobs = data?.items || data?.results || data || [];

    return (jobs || []).map(job => ({
      title: job.title || job.name || '',
      company: job.company?.name || job.company || 'N/A',
      location: job.locations?.map(l => l.name || l).join(', ') || job.location || 'Remote',
      url: job.url || `https://welovedevs.com/offre/${job.id}`,
      source: 'WeLoveDevs',
      publishedAt: job.publishedAt || job.created_at || new Date().toISOString(),
      stack: job.skills?.map(s => s.name || s) || job.tags || [],
      type: job.contract_type || 'CDI'
    })).filter(j => j.url && j.title);
  } catch (e) {
    console.error('WeLoveDevs error:', e.message);
    return [];
  }
}
