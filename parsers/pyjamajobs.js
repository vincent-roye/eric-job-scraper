/**
 * Parser pour Pyjama Jobs
 * Startups et culture tech
 */

const PYJAMA_API = 'https://pyjamajobs.com/api/v1/jobs';

export async function fetchJobs() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(PYJAMA_API, { 
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Eric-Bot/1.0)', 'Accept': 'application/json' }
    });
    clearTimeout(timeoutId);

    if (!res.ok) return [];

    const data = await res.json();
    return (data.offres || []).map(job => ({
      title: job.titre,
      company: job.entreprise,
      location: job.ville || 'Remote',
      url: job.lien,
      source: 'Pyjama Jobs',
      publishedAt: job.datePublication,
      stack: job.stack || [],
      type: job.typeContrat || 'CDI'
    }));
  } catch (e) {
    console.error('Pyjama Jobs error:', e.message);
    return [];
  }
}
