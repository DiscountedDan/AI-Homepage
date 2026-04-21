const Parser = require('rss-parser');
const parser = new Parser();

const FEEDS = [
  { id: 'openai',     section: 'labAnnouncements', limit: 2,  url: 'https://openai.com/news/rss.xml' },
  { id: 'googleai',   section: 'labAnnouncements', limit: 2,  url: 'https://research.google/blog/rss' },
  { id: 'techcrunch', section: 'industryNews',     limit: 15, url: 'https://techcrunch.com/category/artificial-intelligence/feed/' },
];

function sanitizeSummary(raw, feedId) {
  if (!raw) return '';
  let text = raw.replace(/<[^>]*>/g, '');
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  text = text.trim().replace(/\s+/g, ' ');
  if (feedId === 'googleai' && text.length <= 30) return '';
  if (text.length > 150) return text.slice(0, 149) + '…';
  return text;
}

function processItems(feed, feedId, limit) {
  return feed.items
    .slice()
    .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
    .slice(0, limit)
    .map(item => {
      const raw = item.contentSnippet || item.content || '';
      return {
        title:   item.title || '',
        link:    item.link  || '',
        pubDate: item.pubDate ? new Date(item.pubDate).toISOString() : '',
        summary: sanitizeSummary(raw, feedId),
      };
    });
}

module.exports = async (req, res) => {
  try {
    const settled = await Promise.allSettled(FEEDS.map(f => parser.parseURL(f.url)));

    const response = {
      labAnnouncements: {},
      industryNews:     {},
    };

    settled.forEach((result, i) => {
      const feed   = FEEDS[i];
      const target = response[feed.section];

      if (result.status === 'fulfilled') {
        target[feed.id] = {
          status: 'ok',
          items:  processItems(result.value, feed.id, feed.limit),
        };
      } else {
        console.error(`[news] feed ${feed.id} failed:`, result.reason?.message);
        target[feed.id] = { status: 'error', items: [] };
      }
    });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=60');
    res.status(200).json(response);
  } catch (err) {
    console.error('[news] unexpected error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};
