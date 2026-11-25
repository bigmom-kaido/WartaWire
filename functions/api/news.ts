import { queryRssNews } from '../../shared/rssAggregator.ts';

interface PagesFunctionContext {
  request: Request;
}

export async function onRequestGet(context: PagesFunctionContext): Promise<Response> {
  const url = new URL(context.request.url);
  const result = await queryRssNews({
    category: url.searchParams.get('category'),
    source: url.searchParams.get('source'),
    q: url.searchParams.get('q'),
    refresh: url.searchParams.get('refresh'),
  });

  const cacheHeader =
    result.status === 200 && url.searchParams.get('refresh') !== 'true'
      ? 'public, max-age=180, s-maxage=300'
      : 'no-store';

  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': cacheHeader,
    },
  });
}
