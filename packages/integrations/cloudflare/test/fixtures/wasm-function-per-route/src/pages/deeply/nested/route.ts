import { type APIContext, type EndpointOutput } from 'astro';
import { add } from '../../../util/add';

export async function GET(
  context: APIContext
): Promise<EndpointOutput | Response> {

  return new Response(JSON.stringify({ answer: add(80, 4) }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
