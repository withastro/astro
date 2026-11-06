import fs from 'node:fs';
import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = ({ url }) => {
	const file = url.searchParams.get('file') ?? 'server-only/data.txt';
	return new Response(fs.readFileSync(new URL(`__SERVER_ONLY_ROOT__${file}`, import.meta.url), 'utf8'));
};
