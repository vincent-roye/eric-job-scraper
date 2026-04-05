/**
 * Parser pour RemoteOK
 * Utilise le flux JSON public
 */

const REMOTEOK_API = 'https://remoteok.com/api';

export async function fetchJobs() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(REMOTEOK_API, { 
      signal: controller.signal,
      headers: { 'User-Agent': 'Eric-Bot/1.0' } 
    });
    clearTimeout(timeoutId);

    if (!res.ok) return [];

    const data = await res.json();
    // L'API RemoteOK renvoie une array où le premier élément est souvent des stats
    const jobs = Array.isArray(data) ? data.slice(1) : [];

    return jobs.map(job => ({
      title: job.position || 'Job',
      company: job.company || 'N/A',
      location: job.location || 'Remote',
      url: job.url,
      source: 'RemoteOK',
      publishedAt: job.date ? new Date(job.date * 1000).toISOString() : new Date().toISOString(),
      stack: job.tags ? job.tags.map(t => t.name) : [],
      type: 'Remote'
    })).filter(j => j.title && j.url);
  } catch (e) {
    console.error('RemoteOK error:', e.message);
    return [];
  }
}
