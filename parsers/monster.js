/**
 * Parser pour Monster (France)
 * Plateforme internationale d'emploi
 */

const MONSTER_API = 'https://www.monster.fr/api/jobs?q=developpeur&page=1&perPage=50';

export async function fetchJobs() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(MONSTER_API, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Eric-Bot/1.0)',
        'Accept': 'application/json'
      }
    });
    clearTimeout(timeoutId);

    if (!res.ok) return [];

    const data = await res.json();
    const jobs = data.data || data.jobs || data.offres || [];

    return jobs.map(job => ({
      title: job.title || job.titre,
      company: job.company || job.entreprise,
      location: job.location || job.ville || 'Remote',
      url: job.url || job.link,
      source: 'Monster',
      publishedAt: job.date || job.published_at || new Date().toISOString(),
      stack: job.skills || job.tags || [],
      type: job.jobType || job.typeContrat || 'CDI'
    })).filter(j => j.url);
  } catch (e) {
    console.error('Monster error:', e.message);
    return [];
  }
}
