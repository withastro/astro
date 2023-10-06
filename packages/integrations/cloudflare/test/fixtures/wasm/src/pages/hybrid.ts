import { type APIContext, type EndpointOutput } from 'astro';
// @ts-ignore
import mod from '../util/add.wasm?module';

const addModule: any = new WebAssembly.Instance(mod);

export async function GET(
  context: APIContext
): Promise<EndpointOutput | Response> {
  return new Response(JSON.stringify({ answer: addModule.exports.add(20, 1) }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
