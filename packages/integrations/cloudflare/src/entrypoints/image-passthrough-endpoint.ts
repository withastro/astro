import { imageConfig } from 'astro:assets';
import { isRemotePath } from '@astrojs/internal-helpers/path';
import { isRemoteAllowed } from '@astrojs/internal-helpers/remote';
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { fetchWithRedirects } from 'astro/assets';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
	try {
		const url = new URL(request.url);
		const href = url.searchParams.get('href');
		if (!href) return new Response('Bad Request', { status: 400 });

		const isRemote = isRemotePath(href);

		let response: Response;

		if (isRemote) {
			if (!isRemoteAllowed(href, imageConfig)) {
				return new Response('Forbidden', { status: 403 });
			}
			response = await fetchWithRedirects({
				url: href,
				imageConfig,
			});
		} else {
			const sourceUrl = new URL(href, url.origin);
			if (sourceUrl.origin !== url.origin) {
				return new Response('Forbidden', { status: 403 });
			}
			// Client headers are not forwarded: conditional headers such as `If-None-Match` would make
			// ASSETS answer 304, which the redirect guard below turns into a 404.
			// https://github.com/withastro/astro/issues/18560
			response = await env.ASSETS.fetch(sourceUrl);
		}

		if (response.status >= 300 && response.status < 400) {
			return new Response('Not Found', { status: 404 });
		}

		if (!response.ok) {
			return new Response('Not Found', { status: 404 });
		}

		const contentType = response.headers.get('Content-Type') ?? '';
		if (!contentType.startsWith('image/')) {
			return new Response('Forbidden', { status: 403 });
		}

		const headers = new Headers();
		headers.set('Content-Type', contentType);
		headers.set('Cache-Control', 'public, max-age=31536000');
		headers.set('Date', new Date().toUTCString());
		const etag = response.headers.get('ETag');
		if (etag) headers.set('ETag', etag);

		if (etag && request.headers.get('If-None-Match') === etag) {
			return new Response(null, { status: 304, headers });
		}

		return new Response(response.body, { status: 200, headers });
	} catch (_err) {
		return new Response('Internal Server Error', { status: 500 });
	}
};
