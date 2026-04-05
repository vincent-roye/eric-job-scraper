import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

export async function fetchJobs() {
  const jobs = [];
  const url = 'https://www.keljob.com/offres-emploi/';

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      console.error(`[Keljob] HTTP error: ${response.status}`);
      return jobs;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Selector générique pour les annonces
    $('article.job-card, .offer-item, .job-listing').each((index, element) => {
      try {
        const title = $(element).find('h2 a, .job-title, h3').first().text().trim();
        const company = $(element).find('.company, .employer-name').text().trim();
        const location = $(element).find('.location, .city').text().trim();
        const link = $(element).find('h2 a, .job-title a').first().attr('href');
        const date = $(element).find('.date, .publish-date').text().trim();

        if (title && link) {
          jobs.push({
            title,
            company: company || 'Non spécifié',
            location: location || 'Non spécifié',
            url: link.startsWith('http') ? link : `https://www.keljob.com${link}`,
            platform: 'Keljob',
            date: date || new Date().toISOString(),
            crawledAt: new Date().toISOString()
          });
        }
      } catch (err) {
        console.error(`[Keljob] Error parsing job ${index}:`, err.message);
      }
    });

    console.log(`[Keljob] Found ${jobs.length} jobs`);
  } catch (error) {
    console.error('[Keljob] Fetch error:', error.message);
  }

  return jobs;
}
