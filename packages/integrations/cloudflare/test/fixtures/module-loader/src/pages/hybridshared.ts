import { type APIContext } from 'astro';

import {add} from '../util/add';

export const prerender = true

export async function GET(
  context: APIContext
): Promise<Response> {
  return new Response(JSON.stringify({ answer: add(20, 1) }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
