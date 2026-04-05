/**
 * Parser pour Viteajob
 * DNS error - skip
 */

export async function fetchJobs() {
  console.log('[Viteajob] Skipped - DNS resolution failure');
  return [];
}
