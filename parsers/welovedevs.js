import { safeFetch } from './utils.js';

/**
 * Parser pour WeLoveDevs
 * Exploite les hits embarqués côté HTML via InstantSearchInitialResults.
 */
export async function fetchJobs() {
  const jobs = [];

  try {
    const res = await safeFetch('https://welovedevs.com/app/jobs', {}, 15000);
    if (!res.ok) {
      console.log(`[WeLoveDevs] Skipped - HTTP ${res.status}`);
      return jobs;
    }

    const html = await res.text();
    const match = html.match(/window\[Symbol\.for\("InstantSearchInitialResults"\)\]\s*=\s*(\{.*?\})<\/script>/s);
    if (!match) {
      console.log('[WeLoveDevs] Skipped - embedded search payload not found');
      return jobs;
    }

    const data = JSON.parse(match[1]);
    const hits = data?.public_jobs?.results?.[0]?.hits || [];

    for (const hit of hits) {
      const company = hit.smallCompany?.companyName || 'WeLoveDevs';
      const companySlug = hit.smallCompany?.seoAlias || hit.smallCompany?.handle || 'company';
      const jobSlug = hit.seoAlias || hit.reference || hit.id || hit.objectID;
      const location = Array.isArray(hit.formattedPlaces) && hit.formattedPlaces.length
        ? hit.formattedPlaces.join(', ')
        : 'France';
      const stack = Array.isArray(hit.skillsList)
        ? hit.skillsList.map(s => s?.name).filter(Boolean)
        : [];
      const contractTypes = Array.isArray(hit.contractTypes) ? hit.contractTypes : [];

      jobs.push({
        title: hit.title || 'Non spécifié',
        company,
        location,
        url: `https://welovedevs.com/app/job/${companySlug}/${jobSlug}`,
        source: 'WeLoveDevs',
        publishedAt: hit.publishDate ? new Date(hit.publishDate).toISOString() : new Date().toISOString(),
        stack,
        type: contractTypes.join(', ') || hit.details?.contract || hit.type || 'Unknown'
      });
    }

    console.log(`[WeLoveDevs] Found ${jobs.length} jobs`);
  } catch (e) {
    console.error('[WeLoveDevs] Error:', e.message);
  }

  return jobs;
}
