/**
 * Parser pour HackerNews "Who is hiring?"
 * Scrapes le thread mensuel HN
 */

import * as cheerio from 'cheerio';

export async function fetchJobs() {
  const jobs = [];

  try {
    // HackerNews "Who is hiring?" thread - on prend le plus recent
    const res = await fetch('https://hn.algolia.com/api/v1/search?tags=story,ask_hn&query=hiring&hitsPerPage=5', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      }
    });

    if (!res.ok) {
      console.log('[HackerNews] Skipped - HTTP ' + res.status);
      return jobs;
    }

    const data = await res.json();
    const hits = data.hits || [];

    if (hits.length === 0) return jobs;

    // Prend le thread le plus recent
    const latestThread = hits[0];
    const threadUrl = `https://news.ycombinator.com/item?id=${latestThread.objectID}`;

    // Fetch les commentaires du thread
    const commentsRes = await fetch(`https://hn.algolia.com/api/v1/search?tags=comment,story_${latestThread.objectID}&hitsPerPage=100`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      }
    });

    if (!commentsRes.ok) return jobs;

    const commentsData = await commentsRes.json();
    const comments = commentsData.hits || [];

    for (const comment of comments.slice(0, 50)) {
      const text = comment.comment_text || '';
      // Cherche des patterns d'offres: "Company is hiring" ou "Hiring: Role"
      const hiringMatch = text.match(/(?:hiring|looking for|we're hiring|join us)/i);
      
      if (hiringMatch) {
        // Extrait le titre et la compagnie du commentaire
        const titleMatch = text.match(/(?:hiring|looking for):\s*([^\n<]+)/i) || 
                          text.match(/([A-Za-z]+(?:\s[A-Za-z]+)*)\s+is\s+hiring/i);
        
        const title = titleMatch ? titleMatch[1].trim() : 'Tech Position';
        const cleanText = text.replace(/<[^>]*>/g, '').substring(0, 300);

        jobs.push({
          platform: 'hackernews',
          title: title.substring(0, 100),
          company: 'HackerNews Community',
          location: 'Various',
          url: `https://news.ycombinator.com/item?id=${comment.objectID}`,
          date: new Date(comment.created_at_i * 1000).toISOString(),
          description: cleanText
        });
      }
    }

    console.log(`[HackerNews] Found ${jobs.length} jobs`);
  } catch (e) {
    console.error('[HackerNews] Error:', e.message);
  }

  return jobs;
}
