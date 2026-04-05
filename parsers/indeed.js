import * as cheerio from 'cheerio';

const BASE_URL = 'https://fr.indeed.com/emplois';

export async function fetchJobs({ keywords = 'développeur', location = 'Paris' } = {}) {
  try {
    const searchUrl = `${BASE_URL}?q=${encodeURIComponent(keywords)}&l=${encodeURIComponent(location)}`;
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Indeed HTTP ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const jobs = [];

    $('td[data-testid="jobCard_content"]').each((_, el) => {
      const titleEl = $(el).find('h2.jobTitle a span');
      const linkEl = $(el).find('h2.jobTitle a');
      const companyEl = $(el).find('span[data-testid="company-name"]');
      const locationEl = $(el).find('div[data-testid="text-location"]');

      if (titleEl.length) {
        jobs.push({
          platform: 'indeed',
          title: titleEl.text().trim(),
          url: linkEl.attr('href') ? `https://fr.indeed.com${linkEl.attr('href')}` : null,
          company: companyEl.text().trim(),
          location: locationEl.text().trim()
        });
      }
    });

    return jobs;
  } catch (err) {
    console.error(`Indeed parser error: ${err.message}`);
    return [];
  }
}
