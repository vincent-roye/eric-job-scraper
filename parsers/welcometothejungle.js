/**
 * Parser pour Welcome to the Jungle
 * L'ancien flux RSS est mort (404). On tente l'API publique ou on passe à un autre source.
 * Pour l'instant, on retourne empty pour éviter les erreurs, en attendant une nouvelle URL.
 */

export async function fetchJobs() {
  const jobs = [];
  console.log('[WTTJ] Skipped - RSS feed returned 404 HTML page');
  return jobs;
}
