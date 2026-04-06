/**
 * Parser pour ChooseYourBoss
 * Cloudflare 403 actuellement. Désactivé proprement.
 */
export async function fetchJobs() {
  console.log('[ChooseYourBoss] Skipped - Cloudflare protection (HTTP 403)');
  return [];
}
