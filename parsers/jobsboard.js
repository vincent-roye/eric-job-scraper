/**
 * Parser pour JobsBoard - API publique pour les jobs tech
 * Utilise API des emplois tech publics
 */

export async function fetchJobs() {
  const jobs = [];
  // L'ancien GitHub Jobs API est deprecated, on utilise une API alternative
  console.log('[JobsBoard] Skipped - GitHub Jobs API deprecated, use other sources');
  return jobs;
}
