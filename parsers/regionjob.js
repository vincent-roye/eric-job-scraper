/**
 * Parser pour RegionJob
 * Emplois régionaux en France
 */

const REGIONJOB_API = 'https://www.regionjob.com/api/jobs?keywords=informatique&sort=date&page=1';

export async function fetchJobs() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(REGIONJOB_API, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Eric-Bot/1.0)',
        'Accept': 'application/json'
      }
    });
    clearTimeout(timeoutId);

    if (!res.ok) return [];

    const data = await res.json();
    const jobs = data.results || data.jobs || data.offres || [];

    return jobs.map(job => ({
      title: job.title || job.titre,
      company: job.company || job.societe,
      location: job.location || job.ville || 'France',
      url: job.url || job.link,
      source: 'RegionJob',
      publishedAt: job.published_at || job.datePublication || new Date().toISOString(),
      stack: job.competences || job.tags || [],
      type: job.type || job.typeContrat || 'CDI'
    })).filter(j => j.url);
  } catch (e) {
    console.error('RegionJob error:', e.message);
    return [];
  }
}
