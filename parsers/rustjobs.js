/**
 * Parser pour Rust Jobs
 * Source fiable via API RSS-like
 * https://rust.jobs/
 */

export async function fetchJobs() {
  const jobs = [];
  // Rust Jobs n'a pas d'API officielle, on skip pour l'instant
  console.log('[Rust Jobs] Skipped - No public API available');
  return jobs;
}
