import * as cheerio from 'cheerio';

const BASE_URL = 'https://candidat.francetravail.fr/offres/recherche';

export async function fetchJobs({ keywords = 'développeur', location = 'Paris' } = {}) {
  try {
    const searchUrl = `${BASE_URL}?motsCles=${encodeURIComponent(keywords)}&lieu=${encodeURIComponent(location)}`;
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`FranceTravail HTTP ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const jobs = [];

    $('.results-pe .offre').each((_, el) => {
      const titleEl = $(el).find('.intitule');
      const companyEl = $(el).find('.entreprise');
      const locationEl = $(el).find('.lieu-travail');
      const linkEl = $(el).find('a.resultat-link');

      if (titleEl.length) {
        jobs.push({
          platform: 'francetravail',
          title: titleEl.text().trim(),
          url: linkEl.attr('href') || null,
          company: companyEl.text().trim(),
          location: locationEl.text().trim()
        });
      }
    });

    return jobs;
  } catch (err) {
    console.error(`FranceTravail parser error: ${err.message}`);
    return [];
  }
}
