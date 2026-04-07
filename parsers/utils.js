/**
 * Utilitaires partagés pour les parsers
 */

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:135.0) Gecko/20100101 Firefox/135.0',
];

const FRANCE_LOCATION_PATTERNS = [
  'france', 'paris', 'lyon', 'marseille', 'toulouse', 'bordeaux', 'lille', 'nantes', 'rennes',
  'strasbourg', 'montpellier', 'nice', 'francais', 'français', 'ile-de-france', 'île-de-france',
  'remote france', 'full remote france', 'france entière', 'hybride france'
];

const NON_FRANCE_LOCATION_PATTERNS = [
  'worldwide', 'usa', 'united states', 'canada', 'emea', 'apac', 'germany', 'spain', 'uk', 'europe'
];

export function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

export async function safeFetch(url, options = {}, timeoutMs = 10000, retries = 2) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'User-Agent': getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,application/json;q=0.9,*/*;q=0.8',
          'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          ...(options.headers || {}),
        }
      });
      return res;
    } catch (e) {
      lastError = e;
      clearTimeout(timeoutId);
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }
  throw lastError;
}

export function normalizeJob(job = {}) {
  const stack = Array.isArray(job.stack)
    ? job.stack.filter(Boolean).map(x => String(x).trim()).filter(Boolean)
    : [];

  return {
    title: (job.title || '').toString().trim(),
    company: (job.company || 'Non spécifié').toString().trim(),
    location: (job.location || 'Non spécifié').toString().trim(),
    url: (job.url || '').toString().trim(),
    source: (job.source || job.platform || 'Unknown').toString().trim(),
    publishedAt: job.publishedAt || new Date().toISOString(),
    stack,
    type: (job.type || 'Unknown').toString().trim(),
    country: job.country || 'FR',
  };
}

export function isValidJob(job = {}) {
  return Boolean(job.title && job.url && /^https?:\/\//i.test(job.url));
}

export function isFranceLocation(location = '') {
  const text = String(location || '').toLowerCase();
  if (!text) return false;
  if (NON_FRANCE_LOCATION_PATTERNS.some(x => text.includes(x))) return false;
  return FRANCE_LOCATION_PATTERNS.some(x => text.includes(x));
}

export async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
