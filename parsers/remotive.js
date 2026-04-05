/**
 * Parser pour Remotive
 * API JSON publique
 * Focus: Software Development
 */

const REMOTIVE_API = 'https://remotive.com/api/remote-jobs?category=software-dev&limit=50';

export async function fetchJobs() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(REMOTIVE_API, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) return [];

    const data = await res.json();
    return (data.jobs || []).map(job => ({
      title: job.title,
      company: job.company_name,
      location: job.candidate_required_location || 'Remote',
      url: job.url,
      source: 'Remotive',
      publishedAt: job.publication_date,
      stack: job.tags || [],
      type: job.job_type || 'Full-time'
    }));
  } catch (e) {
    console.error('Remotive error:', e.message);
    return [];
  }
}
