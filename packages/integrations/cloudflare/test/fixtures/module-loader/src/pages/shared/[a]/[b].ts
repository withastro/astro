import { type APIContext } from 'astro';
import { add } from '../../../util/add';


export const prerender = false;

export async function GET(
  context: APIContext
): Promise<Response> {
	const a = Number.parseInt(context.params.a ?? "0");
	const b = Number.parseInt(context.params.b ?? "0");
  return new Response(JSON.stringify({ answer: add(a, b) }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
