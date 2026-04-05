import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

export async function fetchJobs() {
  const jobs = [];
  const url = 'https://www.emploitic.com/fr/offres-emploi/';

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      console.error(`[Emploitic] HTTP error: ${response.status}`);
      return jobs;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    $('.job-item').each((index, element) => {
      try {
        const title = $(element).find('.job-title').text().trim();
        const company = $(element).find('.company-name').text().trim();
        const location = $(element).find('.location').text().trim();
        const link = $(element).find('a').attr('href');
        const date = $(element).find('.date').text().trim();

        if (title && link) {
          jobs.push({
            title,
            company: company || 'Non spécifié',
            location: location || 'Non spécifié',
            url: link.startsWith('http') ? link : `https://www.emploitic.com${link}`,
            platform: 'Emploitic',
            date: date || new Date().toISOString(),
            crawledAt: new Date().toISOString()
          });
        }
      } catch (err) {
        console.error(`[Emploitic] Error parsing job ${index}:`, err.message);
      }
    });

    console.log(`[Emploitic] Found ${jobs.length} jobs`);
  } catch (error) {
    console.error('[Emploitic] Fetch error:', error.message);
  }

  return jobs;
}
