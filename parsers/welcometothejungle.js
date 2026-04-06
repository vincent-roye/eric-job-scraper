import { safeFetch } from './utils.js';

/**
 * Parser pour Welcome to the Jungle (WTTJ)
 * Utilise la recherche Algolia exposée par le front public.
 */

async function getAlgoliaConfig() {
  const res = await safeFetch('https://www.welcometothejungle.com/fr/jobs', {}, 15000);
  if (!res.ok) throw new Error(`bootstrap HTTP ${res.status}`);
  const html = await res.text();

  const appIdMatch = html.match(/ALGOLIA_APPLICATION_ID":"([^"]+)"/);
  const apiKeyMatch = html.match(/ALGOLIA_API_KEY_CLIENT":"([^"]+)"/);
  if (!appIdMatch || !apiKeyMatch) throw new Error('Algolia config not found');

  return {
    appId: appIdMatch[1],
    apiKey: apiKeyMatch[1],
    indexName: 'wttj_jobs_production'
  };
}

export async function fetchJobs() {
  const jobs = [];
  try {
    const { appId, apiKey, indexName } = await getAlgoliaConfig();
    const url = `https://${appId}-dsn.algolia.net/1/indexes/*/queries`;
    const payload = {
      requests: [{
        indexName,
        params: 'query=developpeur&hitsPerPage=30&page=0'
      }]
    };

    const res = await safeFetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Algolia-API-Key': apiKey,
        'X-Algolia-Application-Id': appId,
      },
      body: JSON.stringify(payload)
    }, 15000);

    if (!res.ok) {
      console.log(`[WTTJ] HTTP ${res.status}`);
      return jobs;
    }

    const data = await res.json();
    const hits = data.results?.[0]?.hits || [];

    for (const job of hits) {
      const companySlug = job.organization?.slug || job.organization_slug || 'company';
      const companyName = job.organization?.name || job.organization_name || 'WTTJ';
      const slug = job.slug || job.objectID;
      const locations = Array.isArray(job.offices) ? job.offices.map(o => o.name).filter(Boolean) : [];
      jobs.push({
        title: job.name || job.title || 'Non spécifié',
        company: companyName,
        location: locations.join(', ') || job.office?.name || 'France',
        url: `https://www.welcometothejungle.com/fr/companies/${companySlug}/jobs/${slug}`,
        source: 'WTTJ',
        publishedAt: job.published_at || job.created_at || new Date().toISOString(),
        stack: Array.isArray(job.professions) ? job.professions.map(p => p.name).filter(Boolean) : [],
        type: job.contract_type || 'CDI'
      });
    }

    console.log(`[WTTJ] Found ${jobs.length} jobs`);
  } catch (e) {
    console.error('[WTTJ] Error:', e.message);
  }
  return jobs;
}
