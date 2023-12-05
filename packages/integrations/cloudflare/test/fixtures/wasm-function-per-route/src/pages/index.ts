import { type APIContext } from 'astro';
import { add } from '../util/add';

export async function GET(
  context: APIContext
): Promise<Response> {

  return new Response(JSON.stringify({ answer: add(40, 2) }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
