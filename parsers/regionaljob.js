import axios from 'axios';

export async function fetchJobs() {
  const jobs = [];
  const regions = ['ile-de-france', 'auvergne-rhone-alpes', 'nouvelle-aquitaine'];
  
  for (const region of regions) {
    try {
      const res = await axios.get(`https://www.regionaljob.com/fr/emploi/${region}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });
      
      const html = res.data;
      // Parse les offres d'emploi depuis le HTML
      const jobRegex = /<div class="job-card"[^>]*>[\s\S]*?<\/div>\s*<\/div>/g;
      let match;
      
      while ((match = jobRegex.exec(html)) !== null) {
        const jobHtml = match[0];
        const titleMatch = /<h3[^>]*>(.*?)<\/h3>/s.exec(jobHtml);
        const companyMatch = /class="company"[^>]*>(.*?)<\/div>/s.exec(jobHtml);
        const locationMatch = /class="location"[^>]*>(.*?)<\/div>/s.exec(jobHtml);
        const urlMatch = /href="([^"]*\/offre\/[^"]*)"/.exec(jobHtml);
        
        if (titleMatch) {
          jobs.push({
            platform: 'regionaljob',
            title: titleMatch[1].replace(/<[^>]*>/g, '').trim(),
            company: companyMatch ? companyMatch[1].replace(/<[^>]*>/g, '').trim() : 'N/A',
            location: locationMatch ? locationMatch[1].replace(/<[^>]*>/g, '').trim() : region,
            url: urlMatch ? `https://www.regionaljob.com${urlMatch[1]}` : 'N/A',
            description: '',
            date: new Date().toISOString()
          });
        }
      }
      
      await new Promise(r => setTimeout(r, 800));
    } catch (err) {
      console.error(`RegionalJob error for ${region}:`, err.message);
    }
  }
  
  return jobs;
}
