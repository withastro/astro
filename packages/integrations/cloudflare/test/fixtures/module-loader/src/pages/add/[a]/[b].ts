import { type APIContext } from 'astro';
// @ts-ignore
import mod from '../../../util/add.wasm?module';

const addModule: any = new WebAssembly.Instance(mod);

export const prerender = false;

export async function GET(
  context: APIContext
): Promise<Response> {
	const a = Number.parseInt(context.params.a!);
	const b = Number.parseInt(context.params.b!);
  return new Response(JSON.stringify({ answer: addModule.exports.add(a, b) }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
