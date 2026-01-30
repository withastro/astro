// @ts-expect-error
import { imageConfig } from 'astro:assets';
import { isRemotePath } from '@astrojs/internal-helpers/path';
import { isRemoteAllowed } from '@astrojs/internal-helpers/remote';
import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = (ctx) => {
	const href = ctx.url.searchParams.get('href');
	if (!href) {
		return new Response("Missing 'href' query parameter", {
			status: 400,
			statusText: "Missing 'href' query parameter",
		});
	}

	if (isRemotePath(href)) {
		if (isRemoteAllowed(href, imageConfig) === false) {
			return new Response('Forbidden', { status: 403 });
		} else {
			// Redirect here because it is safer than a proxy, remote image will be served by remote domain and not own domain
			return Response.redirect(href, 302);
		}
	}

	const proxied = new URL(href, ctx.url.origin);
	// Have we been tricked into thinking this is local?
	if (proxied.origin !== ctx.url.origin) {
		return new Response('Forbidden', { status: 403 });
	}

	return fetch(proxied);
};
