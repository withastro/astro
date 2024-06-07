import { type APIContext } from 'astro';

import data from '../util/file.bin';

export const prerender = false;

export async function GET(
  context: APIContext
): Promise<Response> {
  return new Response(data, {
    status: 200,
    headers: {
      'Content-Type': 'binary/octet-stream',
    },
  });
}
