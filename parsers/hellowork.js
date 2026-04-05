/**
 * Parser pour Hellowork
 * Utilise l'API GraphQL publique
 */

const HELLOWORK_API = 'https://www.hellowork.com/api/v1/offres?nombre=20&metiers=developpeur';

export async function fetchJobs() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(HELLOWORK_API, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) return [];

    const data = await res.json();
    const jobs = data.resultats || [];

    return jobs.map(job => ({
      title: job.intitule,
      company: job.entreprise?.nom || 'Entreprise',
      location: job.lieu?.libelle || 'France',
      url: job.url,
      source: 'Hellowork',
      publishedAt: job.datePublication,
      stack: [],
      type: job.typeContrat?.libelle || 'CDI'
    }));
  } catch (e) {
    console.error('Hellowork error:', e.message);
    return [];
  }
}
