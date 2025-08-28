// @ts-expect-error
import { imageConfig } from 'astro:assets';
import { isRemotePath } from '@astrojs/internal-helpers/path';
import type { APIRoute } from 'astro';
import { isRemoteAllowed } from '@astrojs/internal-helpers/remote';

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

	return fetch(new URL(href, ctx.url.origin));
};
