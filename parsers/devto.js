import { safeFetch } from './utils.js';

/**
 * Parser pour Dev.to Jobs
 */

export async function fetchJobs() {
  const jobs = [];
  const url = 'https://dev.to/api/articles?tag=hiring&page=1&per_page=30';

  try {
    const res = await safeFetch(url, {
      headers: { 'Accept': 'application/json' }
    }, 15000);

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
      const articleUrl = article.url || '';
      const tags = Array.isArray(article.tag_list) ? article.tag_list : [];

      if (title && title.length > 5 && articleUrl) {
        jobs.push({
          platform: 'devto',
          title,
          company: author,
          location: tags.includes('remote') ? 'Remote' : 'Non spécifié',
          url: articleUrl,
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
