/**
 * Parser pour Dev.to Jobs
 * Utilise l'API Dev.to pour récupérer les posts taggés "hiring"
 */

export async function fetchJobs() {
  const jobs = [];
  // On utilise l'API Dev.to pour les posts taggés "hiring"
  const url = 'https://dev.to/api/articles?tag=hiring&page=1&per_page=30';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(url, { 
      signal: controller.signal,
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      }
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.log('[Dev.to] Skipped - HTTP ' + res.status);
      return jobs;
    }

    const data = await res.json();
    const articles = Array.isArray(data) ? data : [];

    for (const article of articles) {
      const title = article.title || '';
      const author = article.user?.name || 'Non spécifié';
      const publishedAt = article.published_at || new Date().toISOString();
      const url = article.url || '';
      const tags = article.tag_list || [];

      if (title && title.length > 5) {
        jobs.push({
          platform: 'devto',
          title,
          company: author,
          location: tags.includes('remote') ? 'Remote' : 'Non spécifié',
          url,
          source: 'Dev.to',
          publishedAt,
          stack: tags.filter(t => t !== 'hiring' && t !== 'remote'),
          type: 'Full-time'
        });
      }
    }

    console.log(`[Dev.to] Found ${jobs.length} jobs`);
  } catch (e) {
    console.error('[Dev.to] Error:', e.message);
  }

  return jobs;
}
