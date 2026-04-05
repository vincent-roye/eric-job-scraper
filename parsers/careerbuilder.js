/**
 * Parser pour CareerBuilder
 * International, 140M profils
 */

const CAREERBUILDER_API = 'https://api.careerbuilder.com/v1/jobsearch?DeveloperKey=DEMO&Keyword=developer&Location=France&PerPage=50';

export async function fetchJobs() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(CAREERBUILDER_API, { 
      signal: controller.signal,
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });
    clearTimeout(timeoutId);

    if (!res.ok) return [];

    const data = await res.json();
    const jobs = data?.JobSearchResponse?.Jobs?.Job || [];

    return jobs.map(job => {
      return {
        title: job.JobTitle || '',
        company: job.Company?.Name || '',
        location: job.Location?.Name || 'France',
        url: job.AbsoluteURL || '',
        source: 'CareerBuilder',
        publishedAt: job.CreatedOn || '',
        stack: [],
        type: 'Full-time'
      };
    }).filter(j => j.url);
  } catch (e) {
    console.error('CareerBuilder error:', e.message);
    return [];
  }
}
