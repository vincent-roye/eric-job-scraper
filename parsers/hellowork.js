/**
 * Parser pour Hellowork
 * L'API semble avoir changé ou bloque les requêtes anonymes.
 */

export async function fetchJobs() {
  const jobs = [];
  console.log('[Hellowork] Skipped - API returned 405/404');
  return jobs;
}
