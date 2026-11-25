import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import type { Request, Response } from 'express';
import Parser from 'rss-parser';
import type {
  MediaSourceId,
  NewsApiErrorPayload,
  NewsArticle,
  NewsCategory,
  NewsFeedResponse,
  SourceFetchStatus,
} from './src/types/news.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_ENTRIES = 120;
const FEED_TIMEOUT_MS = 6500;

const ALLOWED_CATEGORIES: ReadonlySet<NewsCategory> = new Set([
  'all',
  'nasional',
  'ekonomi',
  'teknologi',
  'olahraga',
  'hiburan',
]);

const ALLOWED_SOURCES: ReadonlySet<MediaSourceId> = new Set([
  'all',
  'cnn',
  'cnbc',
  'tempo',
  'antara',
  'detik',
  'republika',
  'kompas',
]);

type ConcreteCategory = Exclude<NewsCategory, 'all'>;
type ConcreteSource = Exclude<MediaSourceId, 'all'>;

interface SourceConfig {
  id: ConcreteSource;
  name: string;
  domain: string;
  feeds: Partial<Record<ConcreteCategory, { url: string; type: 'direct_rss' | 'google_news_rss' }>>;
}

const INDONESIAN_SOURCES: ReadonlyArray<SourceConfig> = [
  {
    id: 'cnn',
    name: 'CNN Indonesia',
    domain: 'cnnindonesia.com',
    feeds: {
      nasional: { url: 'https://www.cnnindonesia.com/nasional/rss', type: 'direct_rss' },
      ekonomi: { url: 'https://www.cnnindonesia.com/ekonomi/rss', type: 'direct_rss' },
      teknologi: { url: 'https://www.cnnindonesia.com/teknologi/rss', type: 'direct_rss' },
      olahraga: { url: 'https://www.cnnindonesia.com/olahraga/rss', type: 'direct_rss' },
      hiburan: { url: 'https://www.cnnindonesia.com/hiburan/rss', type: 'direct_rss' },
    },
  },
  {
    id: 'cnbc',
    name: 'CNBC Indonesia',
    domain: 'cnbcindonesia.com',
    feeds: {
      nasional: { url: 'https://www.cnbcindonesia.com/news/rss', type: 'direct_rss' },
      ekonomi: { url: 'https://www.cnbcindonesia.com/market/rss', type: 'direct_rss' },
      teknologi: { url: 'https://www.cnbcindonesia.com/tech/rss', type: 'direct_rss' },
    },
  },
  {
    id: 'tempo',
    name: 'Tempo.co',
    domain: 'tempo.co',
    feeds: {
      nasional: { url: 'https://rss.tempo.co/nasional', type: 'direct_rss' },
      ekonomi: { url: 'https://rss.tempo.co/bisnis', type: 'direct_rss' },
      teknologi: {
        url: 'https://news.google.com/rss/search?q=site:tempo.co+(teknologi+OR+digital+OR+AI)&hl=id&gl=ID&ceid=ID:id',
        type: 'google_news_rss',
      },
      olahraga: {
        url: 'https://news.google.com/rss/search?q=site:tempo.co+(olahraga+OR+sepak+bola)&hl=id&gl=ID&ceid=ID:id',
        type: 'google_news_rss',
      },
      hiburan: {
        url: 'https://news.google.com/rss/search?q=site:tempo.co+(hiburan+OR+film+OR+musik)&hl=id&gl=ID&ceid=ID:id',
        type: 'google_news_rss',
      },
    },
  },
  {
    id: 'antara',
    name: 'Antara News',
    domain: 'antaranews.com',
    feeds: {
      nasional: { url: 'https://www.antaranews.com/rss/terkini.xml', type: 'direct_rss' },
      ekonomi: { url: 'https://www.antaranews.com/rss/ekonomi.xml', type: 'direct_rss' },
      teknologi: { url: 'https://www.antaranews.com/rss/tekno.xml', type: 'direct_rss' },
      olahraga: { url: 'https://www.antaranews.com/rss/olahraga.xml', type: 'direct_rss' },
      hiburan: { url: 'https://www.antaranews.com/rss/hiburan.xml', type: 'direct_rss' },
    },
  },
  {
    id: 'detik',
    name: 'Detik.com',
    domain: 'detik.com',
    feeds: {
      nasional: { url: 'https://news.detik.com/berita/rss', type: 'direct_rss' },
      ekonomi: { url: 'https://finance.detik.com/berita-ekonomi-bisnis/rss', type: 'direct_rss' },
      teknologi: { url: 'https://inet.detik.com/rss', type: 'direct_rss' },
      olahraga: { url: 'https://sport.detik.com/rss', type: 'direct_rss' },
      hiburan: { url: 'https://hot.detik.com/rss', type: 'direct_rss' },
    },
  },
  {
    id: 'republika',
    name: 'Republika',
    domain: 'republika.co.id',
    feeds: {
      nasional: { url: 'https://www.republika.co.id/rss/nasional', type: 'direct_rss' },
      ekonomi: { url: 'https://www.republika.co.id/rss/ekonomi', type: 'direct_rss' },
      teknologi: {
        url: 'https://news.google.com/rss/search?q=site:republika.co.id+(teknologi+OR+digital)&hl=id&gl=ID&ceid=ID:id',
        type: 'google_news_rss',
      },
      olahraga: {
        url: 'https://news.google.com/rss/search?q=site:republika.co.id+(sepakbola+OR+olahraga)&hl=id&gl=ID&ceid=ID:id',
        type: 'google_news_rss',
      },
      hiburan: { url: 'https://www.republika.co.id/rss/leisure', type: 'direct_rss' },
    },
  },
  {
    id: 'kompas',
    name: 'Kompas.com',
    domain: 'kompas.com',
    feeds: {
      nasional: {
        url: 'https://news.google.com/rss/search?q=site:kompas.com+nasional&hl=id&gl=ID&ceid=ID:id',
        type: 'google_news_rss',
      },
      ekonomi: {
        url: 'https://news.google.com/rss/search?q=site:kompas.com+(ekonomi+OR+bisnis+OR+uang)&hl=id&gl=ID&ceid=ID:id',
        type: 'google_news_rss',
      },
      teknologi: {
        url: 'https://news.google.com/rss/search?q=site:kompas.com+(tekno+OR+teknologi+OR+gadget)&hl=id&gl=ID&ceid=ID:id',
        type: 'google_news_rss',
      },
      olahraga: {
        url: 'https://news.google.com/rss/search?q=site:kompas.com+(olahraga+OR+bola+OR+timnas)&hl=id&gl=ID&ceid=ID:id',
        type: 'google_news_rss',
      },
      hiburan: {
        url: 'https://news.google.com/rss/search?q=site:kompas.com+(hype+OR+hiburan+OR+film)&hl=id&gl=ID&ceid=ID:id',
        type: 'google_news_rss',
      },
    },
  },
];

interface CustomRssItem {
  title?: string;
  link?: string;
  pubDate?: string;
  isoDate?: string;
  creator?: string;
  author?: string;
  content?: string;
  contentSnippet?: string;
  summary?: string;
  enclosure?: { url?: string };
  mediaContent?: { $?: { url?: string } } | Array<{ $?: { url?: string } }>;
  mediaThumbnail?: { $?: { url?: string } };
  'content:encoded'?: string;
}

const rssParser = new Parser<Record<string, unknown>, CustomRssItem>({
  customFields: {
    item: [
      ['media:content', 'mediaContent'],
      ['media:thumbnail', 'mediaThumbnail'],
    ],
  },
});

interface CacheEntry {
  expiresAt: number;
  payload: NewsFeedResponse;
}

const feedCache = new Map<string, CacheEntry>();

function sanitizeHttpUrl(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== 'string') {
    return null;
  }
  try {
    const parsed = new URL(raw.trim());
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&ndash;/gi, '–')
    .replace(/&mdash;/gi, '—')
    .replace(/&hellip;/gi, '...')
    .replace(/&#(\d+);/g, (_match, dec) => {
      const code = Number(dec);
      return Number.isFinite(code) && code > 0 && code < 0x10ffff
        ? String.fromCodePoint(code)
        : '';
    });
}

function htmlToPlainText(raw: string | null | undefined): string {
  if (!raw || typeof raw !== 'string') {
    return '';
  }
  const withoutTags = raw
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
  return decodeHtmlEntities(withoutTags).replace(/\s+/g, ' ').trim();
}

function extractImageFromItem(item: CustomRssItem): string | null {
  if (item.enclosure?.url) {
    const safe = sanitizeHttpUrl(item.enclosure.url);
    if (safe) return safe;
  }
  if (item.mediaContent) {
    const mc = Array.isArray(item.mediaContent) ? item.mediaContent[0] : item.mediaContent;
    const safe = sanitizeHttpUrl(mc?.$?.url);
    if (safe) return safe;
  }
  if (item.mediaThumbnail?.$?.url) {
    const safe = sanitizeHttpUrl(item.mediaThumbnail.$.url);
    if (safe) return safe;
  }
  const htmlSource = item['content:encoded'] || item.content || item.summary || '';
  const imgMatch = htmlSource.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch?.[1]) {
    return sanitizeHttpUrl(imgMatch[1]);
  }
  return null;
}

function cleanTitle(rawTitle: string, sourceName: string, feedType: 'direct_rss' | 'google_news_rss'): string {
  const plain = htmlToPlainText(rawTitle);
  if (feedType === 'google_news_rss') {
    // Strip trailing " - Kompas.com" or " - Tempo.co" added by Google News RSS
    const escaped = sourceName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return plain.replace(new RegExp(`\\s+-\\s+${escaped}.*$`, 'i'), '').replace(/\s+-\s+[A-Za-z0-9.]+\.[a-z]{2,6}$/i, '').trim();
  }
  return plain;
}

async function fetchAndParseRss(
  url: string,
  sourceId: ConcreteSource,
  sourceName: string,
  category: ConcreteCategory,
  feedType: 'direct_rss' | 'google_news_rss',
): Promise<NewsArticle[]> {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; WartaWire/1.0)',
      Accept: 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
    },
    signal: AbortSignal.timeout(FEED_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const xml = await response.text();
  const feed = await rssParser.parseString(xml);
  const articles: NewsArticle[] = [];

  for (const item of feed.items ?? []) {
    const safeUrl = sanitizeHttpUrl(item.link);
    const title = item.title ? cleanTitle(item.title, sourceName, feedType) : '';
    if (!safeUrl || !title) {
      continue;
    }

    const rawSnippet = item.contentSnippet || item.summary || item.content || item['content:encoded'] || '';
    let description = htmlToPlainText(rawSnippet);
    if (feedType === 'google_news_rss' && description.toLowerCase().startsWith(title.toLowerCase())) {
      description = '';
    }
    if (description.length > 320) {
      description = `${description.slice(0, 317).trim()}...`;
    }

    const fullContent = htmlToPlainText(item['content:encoded'] || item.content || rawSnippet) || description;
    const rawDate = item.isoDate || item.pubDate;
    const parsedTime = rawDate ? new Date(rawDate).getTime() : Date.now();
    const publishedAt = Number.isFinite(parsedTime) ? new Date(parsedTime).toISOString() : new Date().toISOString();

    articles.push({
      id: crypto.createHash('sha1').update(safeUrl).digest('hex').slice(0, 16),
      title,
      description,
      content: fullContent,
      url: safeUrl,
      urlToImage: extractImageFromItem(item),
      publishedAt,
      sourceId,
      sourceName,
      author: item.creator?.trim() || item.author?.trim() || null,
      category,
    });
  }

  return articles;
}

function setCache(key: string, payload: NewsFeedResponse): void {
  if (feedCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = feedCache.keys().next().value;
    if (oldestKey) {
      feedCache.delete(oldestKey);
    }
  }
  feedCache.set(key, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    payload,
  });
}

async function startServer(): Promise<void> {
  const app = express();
  app.disable('x-powered-by');

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      ok: true,
      mode: 'rss',
      totalSources: INDONESIAN_SOURCES.length,
      cacheEntries: feedCache.size,
      cacheTtlMinutes: Math.round(CACHE_TTL_MS / 60000),
    });
  });

  app.get('/api/news', async (req: Request, res: Response) => {
    const rawCategory = typeof req.query.category === 'string' ? req.query.category.trim().toLowerCase() : 'all';
    const rawSource = typeof req.query.source === 'string' ? req.query.source.trim().toLowerCase() : 'all';

    if (!ALLOWED_CATEGORIES.has(rawCategory as NewsCategory) || !ALLOWED_SOURCES.has(rawSource as MediaSourceId)) {
      const payload: NewsApiErrorPayload = {
        errorCode: 'BAD_REQUEST',
        message: 'Parameter kategori atau sumber media tidak valid.',
      };
      res.status(400).json(payload);
      return;
    }

    const category = rawCategory as NewsCategory;
    const source = rawSource as MediaSourceId;
    const rawQuery = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 120) : '';
    const forceRefresh = req.query.refresh === 'true';
    const cacheKey = `${category}::${source}::${rawQuery.toLowerCase()}`;

    if (!forceRefresh) {
      const cachedEntry = feedCache.get(cacheKey);
      if (cachedEntry && cachedEntry.expiresAt > Date.now()) {
        res.json({
          ...cachedEntry.payload,
          cached: true,
        });
        return;
      }
    }

    try {
      const targetSources =
        source === 'all'
          ? INDONESIAN_SOURCES
          : INDONESIAN_SOURCES.filter((item) => item.id === source);

      const tasks: Array<{
        sourceId: ConcreteSource;
        sourceName: string;
        category: ConcreteCategory;
        feedType: 'direct_rss' | 'google_news_rss';
        promise: Promise<NewsArticle[]>;
      }> = [];

      for (const src of targetSources) {
        if (category === 'all') {
          // When all topics selected: fetch 'nasional' across all media,
          // or if a single media is chosen, fetch up to 3 topics of that media for richer coverage.
          const categoriesToFetch: ConcreteCategory[] =
            source === 'all' ? ['nasional'] : ['nasional', 'ekonomi', 'teknologi'];

          for (const cat of categoriesToFetch) {
            const feedDef = src.feeds[cat];
            if (feedDef) {
              tasks.push({
                sourceId: src.id,
                sourceName: src.name,
                category: cat,
                feedType: feedDef.type,
                promise: fetchAndParseRss(feedDef.url, src.id, src.name, cat, feedDef.type),
              });
            }
          }
        } else {
          const feedDef = src.feeds[category];
          if (feedDef) {
            tasks.push({
              sourceId: src.id,
              sourceName: src.name,
              category,
              feedType: feedDef.type,
              promise: fetchAndParseRss(feedDef.url, src.id, src.name, category, feedDef.type),
            });
          }
        }
      }

      const settled = await Promise.allSettled(tasks.map((t) => t.promise));
      const allArticles: NewsArticle[] = [];
      const statusMap = new Map<ConcreteSource, SourceFetchStatus>();

      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        const result = settled[i];
        const existing = statusMap.get(task.sourceId);

        if (result.status === 'fulfilled') {
          allArticles.push(...result.value);
          statusMap.set(task.sourceId, {
            sourceId: task.sourceId,
            sourceName: task.sourceName,
            ok: true,
            articleCount: (existing?.articleCount ?? 0) + result.value.length,
            feedType: task.feedType,
          });
        } else {
          if (!existing) {
            statusMap.set(task.sourceId, {
              sourceId: task.sourceId,
              sourceName: task.sourceName,
              ok: false,
              articleCount: 0,
              feedType: task.feedType,
              error: result.reason instanceof Error ? result.reason.message : 'Gagal memuat RSS',
            });
          }
        }
      }

      // Deduplicate by URL and filter by search query if present
      const dedupedMap = new Map<string, NewsArticle>();
      for (const article of allArticles) {
        if (!dedupedMap.has(article.url)) {
          dedupedMap.set(article.url, article);
        }
      }

      let finalArticles = Array.from(dedupedMap.values());

      if (rawQuery) {
        const qLower = rawQuery.toLowerCase();
        finalArticles = finalArticles.filter(
          (item) =>
            item.title.toLowerCase().includes(qLower) ||
            item.description.toLowerCase().includes(qLower) ||
            item.sourceName.toLowerCase().includes(qLower),
        );

        // If local RSS match is small (< 8), supplement via Google News Indonesia RSS search
        if (finalArticles.length < 8) {
          const domainFilter =
            source !== 'all'
              ? `site:${targetSources[0].domain} `
              : '';
          const gnewsUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(
            `${domainFilter}${rawQuery}`,
          )}&hl=id&gl=ID&ceid=ID:id`;

          try {
            const gnewsSourceId: ConcreteSource = source !== 'all' ? source : 'kompas';
            const gnewsSourceName =
              source !== 'all' ? targetSources[0].name : 'Google News ID';
            const extraArticles = await fetchAndParseRss(
              gnewsUrl,
              gnewsSourceId,
              gnewsSourceName,
              category === 'all' ? 'nasional' : category,
              'google_news_rss',
            );

            for (const extra of extraArticles) {
              if (!dedupedMap.has(extra.url)) {
                dedupedMap.set(extra.url, extra);
                finalArticles.push(extra);
              }
            }
          } catch {
            // Keep local filtered results if supplemental Google News search fails
          }
        }
      }

      // Sort newest first by publishedAt and cap to 80 crisp items
      finalArticles.sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
      );
      finalArticles = finalArticles.slice(0, 80);

      const now = Date.now();
      const payload: NewsFeedResponse = {
        articles: finalArticles,
        totalResults: finalArticles.length,
        cached: false,
        fetchedAt: new Date(now).toISOString(),
        cacheExpiresAt: new Date(now + CACHE_TTL_MS).toISOString(),
        category,
        source,
        query: rawQuery,
        sourceStatuses: Array.from(statusMap.values()),
      };

      setCache(cacheKey, payload);
      res.json(payload);
    } catch (error) {
      console.error('RSS aggregator error:', error);
      const payload: NewsApiErrorPayload = {
        errorCode: 'UPSTREAM_ERROR',
        message: 'Terjadi gangguan saat mengambil feed RSS media Indonesia. Silakan muat ulang.',
      };
      res.status(502).json(payload);
    }
  });

  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (req: Request, res: Response) => {
      if (req.path.startsWith('/api/')) {
        res.status(404).json({ error: 'Endpoint tidak ditemukan' });
        return;
      }
      const indexHtml = path.join(distDir, 'index.html');
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send('Build output tidak ditemukan. Jalankan npm run build terlebih dahulu.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`WartaWire RSS server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
