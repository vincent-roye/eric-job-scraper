import axios from 'axios';

export async function fetchJobs() {
  const jobs = [];
  
  try {
    const res = await axios.get('https://jobinja.ir/api/v1/jobs', {
      params: {
        limit: 30,
        offset: 0,
        keyword: 'developpeur'
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      },
      timeout: 10000
    });
    
    if (res.data && res.data.jobs) {
      for (const job of res.data.jobs) {
        jobs.push({
          platform: 'jobinja',
          title: job.title || 'N/A',
          company: job.organisation?.title || 'N/A',
          location: job.city?.title || job.province?.title || 'N/A',
          url: job.canonicalUrl ? `https://jobinja.ir${job.canonicalUrl}` : 'N/A',
          description: job.description || '',
          date: job.created_at || new Date().toISOString()
        });
      }
    }
  } catch (err) {
    console.error('Jobinja error:', err.message);
  }
  
  return jobs;
}
