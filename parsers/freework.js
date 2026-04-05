/**
 * Parser pour FreeWork
 * Utilise l'API JSON avec retry
 */

export async function fetchJobs(maxRetries = 2) {
  const jobs = [];
  const url = 'https://freework.fr/api/jobs?search=dev&per_page=20';

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      const res = await fetch(url, { 
        signal: controller.signal,
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'fr-FR,fr;q=0.9',
          'Cache-Control': 'no-cache'
        }
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 1000));
          continue;
        }
        console.log('[FreeWork] Skipped - HTTP ' + res.status);
        return jobs;
      }

      const data = await res.json();
      const items = Array.isArray(data) ? data : (data.data || []);

      for (const job of items) {
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
      }

      console.log(`[FreeWork] Found ${jobs.length} jobs`);
      return jobs;
    } catch (e) {
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1500));
        continue;
      }
      console.error('[FreeWork] Error:', e.message);
    }
  }

  return jobs;
}
