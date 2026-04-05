/**
 * Parser pour Free-Work
 * Utilise le flux XML public
 * Focus: IT & Freelance
 */

const FREEWORK_XML = 'https://free-work.com/offres.xml';

export async function fetchJobs() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(FREEWORK_XML, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) return [];

    const text = await res.text();
    const items = text.match(/<offre>.*?<\/offre>/gs) || [];

    return items.map(item => {
      const title = item.match(/<titre><!\[CDATA\[(.*?)\]\]><\/titre>/)?.[1] || '';
      const company = item.match(/<societe><!\[CDATA\[(.*?)\]\]><\/societe>/)?.[1] || '';
      const link = item.match(/<url><!\[CDATA\[(.*?)\]\]><\/url>/)?.[1] || '';
      const date = item.match(/<date>(.*?)<\/date>/)?.[1] || '';
      const location = item.match(/<lieu><!\[CDATA\[(.*?)\]\]><\/lieu>/)?.[1] || 'Remote';

      return {
        title: title,
        company: company,
        location: location,
        url: link,
        source: 'Free-Work',
        publishedAt: date,
        stack: [], // Stack souvent dans la description
        type: 'Freelance'
      };
    }).filter(j => j.url);
  } catch (e) {
    console.error('Free-Work error:', e.message);
    return [];
  }
}
