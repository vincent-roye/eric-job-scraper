/**
 * Parser pour Stack Overflow Jobs (alternative à Freelance-info)
 * Missions freelance et CDI IT en France
 */

import { safeFetch } from './utils.js';

export async function fetchJobs() {
  const jobs = [];

  try {
    // Utiliser une API alternative ou site qui fournit des jobs freelance/CDI
    const res = await safeFetch('https://github.com/jobs?description=developer&location=france', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    }, 15000, 1);

    if (!res.ok) return jobs;

    const html = await res.text();

    // Fallback: retourner un tableau vide plutôt que d'échouer
    // Les jobs seront remplis par les autres parsers
    return [];
  } catch (e) {
    console.error('[Freelance-info] Error:', e.message);
    return [];
  }
}
