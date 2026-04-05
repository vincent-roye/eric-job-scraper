import axios from 'axios';

export async function fetchJobs() {
  const jobs = [];
  const searchTerms = ['developpeur', 'ingenieur', 'data', 'chef de projet'];
  
  for (const term of searchTerms) {
    try {
      const res = await axios.get('https://www.glassdoor.fr/Job/jobs.htm', {
        params: {
          sc.keyword: term,
          locT: 'C',
          locId: 2171,
          jobType: 'fulltime'
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });
      
      // Glassdoor utilise du rendu serveur complexe, on parse les donnees embarquees
      const html = res.data;
      const jobListRegex = /"joblisting":(\[[^\]]+\])/g;
      let match;
      
      while ((match = jobListRegex.exec(html)) !== null) {
        try {
          const jobList = JSON.parse(match[1]);
          for (const job of jobList.slice(0, 5)) {
            jobs.push({
              platform: 'glassdoor',
              title: job.jobtitleText || job.jobTitle || 'N/A',
              company: job.employer?.shortName || job.employerName || 'N/A',
              location: job.locationName || 'N/A',
              url: job.jobview?.homepageUrl ? `https://www.glassdoor.fr${job.jobview.homepageUrl}` : 'N/A',
              description: job.jobview?.jobDescriptionText || '',
              date: job.ageInDays ? new Date(Date.now() - job.ageInDays * 86400000).toISOString() : new Date().toISOString()
            });
          }
        } catch (e) {
          continue;
        }
      }
      
      await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      console.error(`Glassdoor error for ${term}:`, err.message);
    }
  }
  
  return jobs;
}
