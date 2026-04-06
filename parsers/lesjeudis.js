/**
 * Parser pour LesJeudis
 * Cloudflare 403 actuellement. Désactivé proprement.
 */
export async function fetchJobs() {
  console.log('[LesJeudis] Skipped - Cloudflare protection (HTTP 403)');
  return [];
}
