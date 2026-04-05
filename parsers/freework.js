/**
 * Parser pour FreeWork
 * Utilise l'API JSON interne ou le flux RSS si disponible.
 */

export async function fetchJobs() {
  const jobs = [];
  const url = 'https://freework.fr/api/jobs?search=dev&per_page=20';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(url, { 
      signal: controller.signal,
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.log('[FreeWork] Skipped - HTTP ' + res.status);
      return jobs;
    }

    const data = await res.json();
    const items = Array.isArray(data) ? data : (data.data || []);

    items.forEach(job => {
      jobs.push({
        title: job.title || job.name || '',
        company: job.company || 'Freelance',
        location: job.location || 'France',
        url: job.url || `https://freework.fr/job/${job.id}`,
        source: 'FreeWork',
        publishedAt: job.created_at || new Date().toISOString(),
        stack: job.stack || [],
        type: 'Freelance'
      });
    });

    console.log(`[FreeWork] Found ${jobs.length} jobs`);
  } catch (e) {
    console.error('[FreeWork] Error:', e.message);
  }

  return jobs;
}
