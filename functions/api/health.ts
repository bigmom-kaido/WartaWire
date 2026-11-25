import { getHealthPayload } from '../../shared/rssAggregator.ts';

export async function onRequestGet(): Promise<Response> {
  return new Response(JSON.stringify(getHealthPayload()), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
