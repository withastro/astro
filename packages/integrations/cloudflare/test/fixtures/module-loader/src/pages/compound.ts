
import { type APIContext } from 'astro';

import text from '../util/file.1.md.txt';

export const prerender = false;

export async function GET(
  context: APIContext
): Promise<Response> {
  return new Response(text, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
