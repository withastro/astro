import { type APIContext, type EndpointOutput } from 'astro';
import { add } from '../util/add';

export async function GET(
  context: APIContext
): Promise<EndpointOutput | Response> {

  return new Response(JSON.stringify({ answer: add(40, 2) }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
