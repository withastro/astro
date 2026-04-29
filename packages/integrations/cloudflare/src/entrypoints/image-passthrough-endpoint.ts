import { imageConfig } from 'astro:assets';
import { isRemotePath } from '@astrojs/internal-helpers/path';
import { isRemoteAllowed } from '@astrojs/internal-helpers/remote';
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

/**
 * Recursively follows redirects, validating that the final URL matches allowed patterns.
 */
async function fetchWithRedirectValidation(
	url: string,
	redirectLimit: number = 10,
): Promise<Response> {
	if (redirectLimit <= 0) {
		throw new Error('Maximum redirect depth exceeded');
	}

	const response = await fetch(url, {
		redirect: 'manual',
	});

	// Handle redirects (301, 302, 303, 307, 308 are actual redirects, not 304 Not Modified)
	if ([301, 302, 303, 307, 308].includes(response.status)) {
		const location = response.headers.get('Location');
		if (!location) {
			throw new Error(`Redirect response ${response.status} missing Location header`);
		}

		// Resolve the redirect URL relative to the current URL
		const redirectUrl = new URL(location, url).toString();

		// Validate that the redirect target matches allowed patterns
		if (!isRemoteAllowed(redirectUrl, imageConfig)) {
			throw new Error('Redirect target is not an allowed remote location');
		}

		return fetchWithRedirectValidation(redirectUrl, redirectLimit - 1);
	}

	return response;
}

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

			try {
				response = await fetchWithRedirectValidation(href);

				// Validate that the final URL (after redirects) is allowed
				if (!isRemoteAllowed(response.url, imageConfig)) {
					return new Response('Forbidden', { status: 403 });
				}
			} catch {
				return new Response('Not Found', { status: 404 });
			}
		} else {
			const sourceUrl = new URL(href, url.origin);
			if (sourceUrl.origin !== url.origin) {
				return new Response('Forbidden', { status: 403 });
			}
			response = await env.ASSETS.fetch(new Request(sourceUrl, { headers: request.headers }));
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

		return new Response(response.body, { status: 200, headers });
	} catch (_err) {
		return new Response('Internal Server Error', { status: 500 });
	}
};
