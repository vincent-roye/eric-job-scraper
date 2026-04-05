import * as cheerio from 'cheerio';

const BASE_URL = 'https://candidat.francetravail.fr/offres/recherche';

export async function fetchJobs({ keywords = 'développeur', location = 'Paris' } = {}) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const searchUrl = `${BASE_URL}?motsCles=${encodeURIComponent(keywords)}&lieu=${encodeURIComponent(location)}`;
    const response = await fetch(searchUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      }
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.log('[FranceTravail] Skipped - HTTP ' + response.status);
      return [];
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
          location: locationEl.text().trim(),
          source: 'France Travail',
          publishedAt: new Date().toISOString(),
          stack: [],
          type: 'CDI'
        });
      }
    });

    console.log(`[FranceTravail] Found ${jobs.length} jobs`);
    return jobs;
  } catch (err) {
    console.error('[FranceTravail] Error:', err.message);
    return [];
  }
}
