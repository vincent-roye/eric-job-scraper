/**
 * Parser pour CareerBuilder — offres France
 */

import { safeFetch } from './utils.js';

const URLS = [
  'https://api.careerbuilder.com/v1/jobsearch?DeveloperKey=DEMO&Keyword=développeur&Location=France&PerPage=50',
  'https://api.careerbuilder.com/v1/jobsearch?DeveloperKey=DEMO&Keyword=developer&Location=Paris&PerPage=50',
];

export async function fetchJobs() {
  const allJobs = [];
  for (const url of URLS) {
    try {
      const res = await safeFetch(url, {
        headers: { 'Accept': 'application/json' }
      }, 15000);

      if (!res.ok) continue;

      const data = await res.json();
      const jobs = data?.JobSearchResponse?.Jobs?.Job || [];

      for (const job of jobs) {
        if (job.AbsoluteURL) {
          allJobs.push({
            title: job.JobTitle || '',
            company: job.Company?.Name || '',
            location: job.Location?.Name || 'France',
            url: job.AbsoluteURL,
            source: 'CareerBuilder',
            publishedAt: job.CreatedOn || '',
            stack: [],
            type: 'Full-time'
          });
        }
      }
    } catch (e) {
      console.error('CareerBuilder error:', e.message);
    }
  }
  console.log(`[CareerBuilder] Found ${allJobs.length} jobs`);
  return allJobs;
}
