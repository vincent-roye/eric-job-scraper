const BASE_URL = 'https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search';

export async function fetchJobs({ keywords = 'développeur', location = 'Paris' } = {}) {
  try {
    const params = new URLSearchParams({
      keywords,
      location,
      start: '0'
    });

    const response = await fetch(`${BASE_URL}?${params}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml'
      }
    });

    if (!response.ok) {
      throw new Error(`LinkedIn HTTP ${response.status}`);
    }

    const html = await response.text();
    const regex = /<li[^>]*class="[^"]*base-card[^"]*"[^>]*>([\s\S]*?)<\/li>/g;
    const jobs = [];
    let match;

    while ((match = regex.exec(html)) !== null) {
      const block = match[1];

      const titleMatch = block.match(/<h3[^>]*class="[^"]*base-search-card__title[^"]*"[^>]*>([\s\S]*?)<\/h3>/);
      const companyMatch = block.match(/<h4[^>]*class="[^"]*base-search-card__subtitle[^"]*"[^>]*>([\s\S]*?)<\/h4>/);
      const locationMatch = block.match(/<span[^>]*class="[^"]*job-search-card__location[^"]*"[^>]*>([\s\S]*?)<\/span>/);
      const linkMatch = block.match(/href="([^"]*jobs\/view\/[^"]*)"/);

      if (titleMatch) {
        const cleanTitle = titleMatch[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
        const cleanCompany = companyMatch ? companyMatch[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() : '';
        const cleanLocation = locationMatch ? locationMatch[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() : '';

        jobs.push({
          platform: 'linkedin',
          title: cleanTitle,
          company: cleanCompany,
          location: cleanLocation,
          url: linkMatch ? linkMatch[1].replace(/&amp;/g, '&') : null
        });
      }
    }

    return jobs;
  } catch (err) {
    console.error(`LinkedIn parser error: ${err.message}`);
    return [];
  }
}
