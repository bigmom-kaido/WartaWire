import { XMLParser } from 'fast-xml-parser';
import type {
  HealthStatusResponse,
  MediaSourceId,
  NewsApiErrorPayload,
  NewsArticle,
  NewsCategory,
  NewsFeedResponse,
  SourceFetchStatus,
} from '../src/types/news.ts';

export const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 120;
const FEED_TIMEOUT_MS = 6500;

export const ALLOWED_CATEGORIES: ReadonlySet<NewsCategory> = new Set([
  'all',
  'nasional',
  'ekonomi',
  'teknologi',
  'olahraga',
  'hiburan',
]);

export const ALLOWED_SOURCES: ReadonlySet<MediaSourceId> = new Set([
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

export const INDONESIAN_SOURCES: ReadonlyArray<SourceConfig> = [
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

interface CacheEntry {
  expiresAt: number;
  payload: NewsFeedResponse;
}

const feedCache = new Map<string, CacheEntry>();

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  trimValues: true,
  parseTagValue: false,
});

function hashId(input: string): string {
  // Deterministic 64-bit FNV-1a pair in hex (zero Node crypto dependency for Edge/Workers compatibility)
  let h1 = 0x811c9dc5;
  let h2 = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 ^= c;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= c ^ (i & 0xff);
    h2 = Math.imul(h2, 0x01000193);
  }
  const part1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const part2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return `${part1}${part2}`;
}

function sanitizeHttpUrl(raw: unknown): string | null {
  if (typeof raw !== 'string' || !raw.trim()) {
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

function asText(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number') {
    return String(value);
  }
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (typeof obj['#text'] === 'string') {
      return obj['#text'];
    }
    if (typeof obj['@_href'] === 'string') {
      return obj['@_href'];
    }
  }
  return '';
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

function htmlToPlainText(raw: unknown): string {
  const str = asText(raw);
  if (!str) {
    return '';
  }
  const withoutTags = str
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
  return decodeHtmlEntities(withoutTags).replace(/\s+/g, ' ').trim();
}

function extractUrlAttribute(node: unknown): string | null {
  if (!node) {
    return null;
  }
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = extractUrlAttribute(item);
      if (found) return found;
    }
    return null;
  }
  if (typeof node === 'object') {
    const rec = node as Record<string, unknown>;
    return sanitizeHttpUrl(rec['@_url'] ?? rec['@_href']);
  }
  return null;
}

function extractImageFromItem(item: Record<string, unknown>): string | null {
  const fromEnclosure = extractUrlAttribute(item.enclosure);
  if (fromEnclosure) return fromEnclosure;

  const fromMediaContent = extractUrlAttribute(item['media:content']);
  if (fromMediaContent) return fromMediaContent;

  const fromMediaThumb = extractUrlAttribute(item['media:thumbnail']);
  if (fromMediaThumb) return fromMediaThumb;

  const htmlSource =
    asText(item['content:encoded']) ||
    asText(item.description) ||
    asText(item.content) ||
    asText(item.summary);
  const imgMatch = htmlSource.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch?.[1]) {
    return sanitizeHttpUrl(imgMatch[1]);
  }
  return null;
}

function cleanTitle(
  rawTitle: unknown,
  sourceName: string,
  feedType: 'direct_rss' | 'google_news_rss',
): string {
  const plain = htmlToPlainText(rawTitle);
  if (!plain) {
    return '';
  }
  if (feedType === 'google_news_rss') {
    const escaped = sourceName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return plain
      .replace(new RegExp(`\\s+-\\s+${escaped}.*$`, 'i'), '')
      .replace(/\s+-\s+[A-Za-z0-9.]+\.[a-z]{2,6}$/i, '')
      .trim();
  }
  return plain;
}

function extractRawItems(parsed: unknown): Record<string, unknown>[] {
  if (!parsed || typeof parsed !== 'object') {
    return [];
  }
  const root = parsed as Record<string, unknown>;
  const rss = root.rss as Record<string, unknown> | undefined;
  const channel = rss?.channel as Record<string, unknown> | undefined;
  const rssItems = channel?.item;
  if (Array.isArray(rssItems)) {
    return rssItems.filter((x): x is Record<string, unknown> => Boolean(x && typeof x === 'object'));
  }
  if (rssItems && typeof rssItems === 'object') {
    return [rssItems as Record<string, unknown>];
  }

  const atomFeed = root.feed as Record<string, unknown> | undefined;
  const entries = atomFeed?.entry;
  if (Array.isArray(entries)) {
    return entries.filter((x): x is Record<string, unknown> => Boolean(x && typeof x === 'object'));
  }
  if (entries && typeof entries === 'object') {
    return [entries as Record<string, unknown>];
  }
  return [];
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
  const parsed = xmlParser.parse(xml);
  const items = extractRawItems(parsed);
  const articles: NewsArticle[] = [];

  for (const item of items) {
    const safeUrl = sanitizeHttpUrl(asText(item.link));
    const title = cleanTitle(item.title, sourceName, feedType);
    if (!safeUrl || !title) {
      continue;
    }

    const rawSnippet =
      asText(item.description) ||
      asText(item.summary) ||
      asText(item['content:encoded']) ||
      asText(item.content);
    let description = htmlToPlainText(rawSnippet);
    if (feedType === 'google_news_rss' && description.toLowerCase().startsWith(title.toLowerCase())) {
      description = '';
    }
    if (description.length > 320) {
      description = `${description.slice(0, 317).trim()}...`;
    }

    const fullContent =
      htmlToPlainText(item['content:encoded'] ?? item.content ?? rawSnippet) || description;
    const rawDate = asText(item.pubDate) || asText(item.published) || asText(item.updated);
    const parsedTime = rawDate ? new Date(rawDate).getTime() : Date.now();
    const publishedAt = Number.isFinite(parsedTime)
      ? new Date(parsedTime).toISOString()
      : new Date().toISOString();

    const author =
      htmlToPlainText(item['dc:creator'] ?? item.author ?? item.creator) || null;

    articles.push({
      id: hashId(safeUrl),
      title,
      description,
      content: fullContent,
      url: safeUrl,
      urlToImage: extractImageFromItem(item),
      publishedAt,
      sourceId,
      sourceName,
      author,
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

export function getHealthPayload(): HealthStatusResponse {
  return {
    ok: true,
    mode: 'rss',
    totalSources: INDONESIAN_SOURCES.length,
    cacheEntries: feedCache.size,
    cacheTtlMinutes: Math.round(CACHE_TTL_MS / 60000),
  };
}

export interface QueryNewsInput {
  category?: string | null;
  source?: string | null;
  q?: string | null;
  refresh?: string | null;
}

export async function queryRssNews(
  input: QueryNewsInput,
): Promise<{ status: number; body: NewsFeedResponse | NewsApiErrorPayload }> {
  const rawCategory = (input.category ?? 'all').trim().toLowerCase();
  const rawSource = (input.source ?? 'all').trim().toLowerCase();

  if (
    !ALLOWED_CATEGORIES.has(rawCategory as NewsCategory) ||
    !ALLOWED_SOURCES.has(rawSource as MediaSourceId)
  ) {
    return {
      status: 400,
      body: {
        errorCode: 'BAD_REQUEST',
        message: 'Parameter kategori atau sumber media tidak valid.',
      },
    };
  }

  const category = rawCategory as NewsCategory;
  const source = rawSource as MediaSourceId;
  const rawQuery = (input.q ?? '').trim().slice(0, 120);
  const forceRefresh = input.refresh === 'true';
  const cacheKey = `${category}::${source}::${rawQuery.toLowerCase()}`;

  if (!forceRefresh) {
    const cachedEntry = feedCache.get(cacheKey);
    if (cachedEntry && cachedEntry.expiresAt > Date.now()) {
      return {
        status: 200,
        body: {
          ...cachedEntry.payload,
          cached: true,
        },
      };
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
      } else if (!existing) {
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

      if (finalArticles.length < 8) {
        const domainFilter = source !== 'all' ? `site:${targetSources[0].domain} ` : '';
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
    return { status: 200, body: payload };
  } catch (error) {
    console.error('RSS aggregator error:', error);
    return {
      status: 502,
      body: {
        errorCode: 'UPSTREAM_ERROR',
        message: 'Terjadi gangguan saat mengambil feed RSS media Indonesia. Silakan muat ulang.',
      },
    };
  }
}
