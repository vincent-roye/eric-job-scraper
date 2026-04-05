import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

export async function fetchJobs() {
  const jobs = [];
  const url = 'https://www.viteajob.com/offres-emploi/';

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      console.error(`[Viteajob] HTTP error: ${response.status}`);
      return jobs;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Parser les annonces d'emploi
    $('.annonce, .job-card, .offre-item').each((index, element) => {
      try {
        const title = $(element).find('.titre, h3, .job-title').first().text().trim();
        const company = $(element).find('.entreprise, .company').text().trim();
        const location = $(element).find('.lieu, .location').text().trim();
        const link = $(element).find('a').first().attr('href');
        const date = $(element).find('.date').text().trim();

        if (title && link) {
          jobs.push({
            title,
            company: company || 'Non spécifié',
            location: location || 'Non spécifié',
            url: link.startsWith('http') ? link : `https://www.viteajob.com${link}`,
            platform: 'Viteajob',
            date: date || new Date().toISOString(),
            crawledAt: new Date().toISOString()
          });
        }
      } catch (err) {
        console.error(`[Viteajob] Error parsing job ${index}:`, err.message);
      }
    });

    console.log(`[Viteajob] Found ${jobs.length} jobs`);
  } catch (error) {
    console.error('[Viteajob] Fetch error:', error.message);
  }

  return jobs;
}
