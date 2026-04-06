import * as cheerio from 'cheerio';
import axios from 'axios';

/**
 * Parser pour RemoteOK (via RSS/XML pour éviter le Cloudflare)
 */

export async function fetchJobs() {
  const jobs = [];
  try {
    const res = await axios.get('https://remotework.com/remote-jobs/rss.xml', {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'
      }
    });

    const items = res.data.match(/<item>.*?<\/item>/gs) || [];

    for (const item of items.slice(0, 20)) {
      const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1];
      const link = item.match(/<link>(.*?)<\/link>/)?.[1];
      const company = item.match(/<company>(.*?)<\/company>/)?.[1];
      
      if (title && link) {
        const lowerTitle = title.toLowerCase();
        if (lowerTitle.includes('dev') || lowerTitle.includes('engineer') || lowerTitle.includes('code') || lowerTitle.includes('python') || lowerTitle.includes('javascript')) {
          jobs.push({
            title,
            company: company || 'RemoteWork',
            url: link,
            source: 'RemoteWork',
            stack: []
          });
        }
      }
    }
    console.log(`[RemoteWork] Found ${jobs.length} jobs`);
  } catch (e) {
    console.error(`[RemoteWork] Error: ${e.message}`);
  }
  return jobs;
}
