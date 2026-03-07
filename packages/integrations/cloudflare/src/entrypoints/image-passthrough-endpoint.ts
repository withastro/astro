import { imageConfig } from 'astro:assets';
import { isRemotePath } from '@astrojs/internal-helpers/path';
import { isRemoteAllowed } from '@astrojs/internal-helpers/remote';
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
	const url = new URL(request.url);
	const href = url.searchParams.get('href');
	if (!href) return new Response('Bad Request', { status: 400 });

	const isRemote = isRemotePath(href);

	if (isRemote) {
		if (!isRemoteAllowed(href, imageConfig)) {
			return new Response('Forbidden', { status: 403 });
		}
		return fetch(href);
	}

	const sourceUrl = new URL(href, url.origin);
	if (sourceUrl.origin !== url.origin) {
		return new Response('Forbidden', { status: 403 });
	}

	return env.ASSETS.fetch(sourceUrl);
};
