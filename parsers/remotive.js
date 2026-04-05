/**
 * Parser pour Remotive
 * 100% Remote jobs
 */

export async function fetchJobs() {
  const jobs = [];
  const url = 'https://remotive.com/api/remote-jobs?category=software-dev';

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
      console.log('[Remotive] Skipped - HTTP ' + res.status);
      return jobs;
    }

    const data = await res.json();
    const items = data.jobs || [];

    items.slice(0, 30).forEach(job => {
      jobs.push({
        title: job.title,
        company: job.company_name,
        location: job.candidate_required_location || 'Remote',
        url: job.url,
        source: 'Remotive',
        publishedAt: job.publication_date,
        stack: [],
        type: 'Remote'
      });
    });

    console.log(`[Remotive] Found ${jobs.length} jobs`);
  } catch (e) {
    console.error('[Remotive] Error:', e.message);
  }

  return jobs;
}
