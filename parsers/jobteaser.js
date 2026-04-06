/**
 * Parser pour JobTeaser
 * Flux historique 404. Désactivé jusqu'à découverte d'un flux stable.
 */
export async function fetchJobs() {
  console.log('[JobTeaser] Skipped - feed not found (HTTP 404)');
  return [];
}
