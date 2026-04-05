/**
 * Parser pour LesJeudis
 * Spécialisé IT et digital en France
 */

const LESJEUDIS_API = 'https://www.lesjeudis.com/api/offres-emploi?keywords=developpeur&per_page=50';

export async function fetchJobs() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(LESJEUDIS_API, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Eric-Bot/1.0)',
        'Accept': 'application/json'
      }
    });
    clearTimeout(timeoutId);

    if (!res.ok) return [];

    const data = await res.json();
    const jobs = data.data || data.results || data.offres || [];

    return jobs.map(job => ({
      title: job.title || job.titre,
      company: job.companyName || job.entreprise,
      location: job.city || job.location || 'Remote',
      url: job.url || job.link,
      source: 'LesJeudis',
      publishedAt: job.published_at || job.datePublication || new Date().toISOString(),
      stack: job.tags || job.stack || [],
      type: job.contractType || job.typeContrat || 'CDI'
    })).filter(j => j.url);
  } catch (e) {
    console.error('LesJeudis error:', e.message);
    return [];
  }
}
