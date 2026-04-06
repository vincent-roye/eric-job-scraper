import axios from 'axios';

/**
 * Parser pour GitHub Jobs - via GitHub Issue Search
 */

export async function fetchJobs() {
  const jobs = [];
  try {
    const res = await axios.get('https://api.github.com/search/issues', {
      params: {
        q: 'label:"hiring" is:open',
        sort: 'updated',
        order: 'desc',
        per_page: 20
      },
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'workspace-eric-job-scraper'
      },
      timeout: 15000
    });

    for (const item of (res.data.items || [])) {
      if (item.title && item.html_url) {
        jobs.push({
          title: item.title.replace(/\[Hiring\]|\[HIRING\]/gi, '').trim(),
          company: item.repository_url ? item.repository_url.split('/').pop() : 'GitHub',
          url: item.html_url,
          source: 'GitHub Issues',
          publishedAt: item.updated_at || item.created_at || new Date().toISOString(),
          stack: (item.labels || []).map(l => l.name).filter(l => l !== 'hiring'),
          type: 'Unknown'
        });
      }
    }
    console.log(`[GitHub Jobs] Found ${jobs.length} jobs`);
  } catch (e) {
    console.error(`[GitHub Jobs] Error: ${e.message}`);
  }
  return jobs;
}
