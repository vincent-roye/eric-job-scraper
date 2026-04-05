/**
 * Parser pour Meteojob
 * Matching par compétences
 */

const METEOJOB_API = 'https://api.meteojob.com/v1/jobs?keywords=developpeur&limit=20';

export async function fetchJobs() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(METEOJOB_API, { 
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeoutId);

    if (!res.ok) return [];

    const data = await res.json();
    return (data.results || []).map(job => ({
      title: job.title,
      company: job.company?.name || 'Entreprise',
      location: job.location?.label || 'France',
      url: job.url,
      source: 'Meteojob',
      publishedAt: job.date,
      stack: job.skills || [],
      type: job.contractType || 'CDI'
    }));
  } catch (e) {
    console.error('Meteojob error:', e.message);
    return [];
  }
}
