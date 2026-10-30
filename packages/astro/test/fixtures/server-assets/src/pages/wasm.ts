import type { APIRoute } from 'astro';
// An empty module, padded past Vite's asset inline limit so it is emitted as a
// file that the server code reads at runtime.
import init from '../module.wasm?init';

export const prerender = false;

export const GET: APIRoute = async () => {
	const instance = await init();
	return new Response(String(instance instanceof WebAssembly.Instance));
};
