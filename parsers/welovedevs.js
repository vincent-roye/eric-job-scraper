/**
 * Parser pour WeLoveDevs
 * Endpoint historique 404. Désactivé jusqu'à découverte d'un endpoint stable.
 */
export async function fetchJobs() {
  console.log('[WeLoveDevs] Skipped - API endpoint not found (HTTP 404)');
  return [];
}
