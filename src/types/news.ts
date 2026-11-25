export type NewsCategory =
  | 'all'
  | 'nasional'
  | 'ekonomi'
  | 'teknologi'
  | 'olahraga'
  | 'hiburan';

export type MediaSourceId =
  | 'all'
  | 'cnn'
  | 'cnbc'
  | 'tempo'
  | 'antara'
  | 'detik'
  | 'republika'
  | 'kompas';

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  content: string;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  sourceId: Exclude<MediaSourceId, 'all'> | 'gnews';
  sourceName: string;
  author: string | null;
  category: Exclude<NewsCategory, 'all'>;
}

export interface SourceFetchStatus {
  sourceId: Exclude<MediaSourceId, 'all'>;
  sourceName: string;
  ok: boolean;
  articleCount: number;
  feedType: 'direct_rss' | 'google_news_rss';
  error?: string;
}

export interface NewsFeedResponse {
  articles: NewsArticle[];
  totalResults: number;
  cached: boolean;
  fetchedAt: string;
  cacheExpiresAt: string;
  category: NewsCategory;
  source: MediaSourceId;
  query: string;
  sourceStatuses: SourceFetchStatus[];
}

export interface NewsApiErrorPayload {
  errorCode: 'BAD_REQUEST' | 'UPSTREAM_ERROR';
  message: string;
}

export interface HealthStatusResponse {
  ok: boolean;
  mode: 'rss';
  totalSources: number;
  cacheEntries: number;
  cacheTtlMinutes: number;
}
