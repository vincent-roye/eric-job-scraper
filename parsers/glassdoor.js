/**
 * Parser pour Glassdoor
 * Glassdoor bloque les bots - on passe par leur RSS si disponible
 */

export async function fetchJobs() {
  const jobs = [];
  // Glassdoor n'a pas de RSS publique fiable, on skip pour l'instant
  console.log('[Glassdoor] Skipped - blocking bots');
  return jobs;
}
