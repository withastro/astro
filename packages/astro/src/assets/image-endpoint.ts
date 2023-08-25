import { isRemotePath } from '@astrojs/internal-helpers/path';
import mime from 'mime/lite.js';
import type { APIRoute } from '../@types/astro.js';
import { getConfiguredImageService, isRemoteAllowed } from './internal.js';
import { etag } from './utils/etag.js';
// @ts-expect-error
import { imageConfig } from 'astro:assets';

async function loadRemoteImage(src: URL) {
	try {
		const res = await fetch(src);

		if (!res.ok) {
			return undefined;
		}

		return Buffer.from(await res.arrayBuffer());
	} catch (err: unknown) {
		return undefined;
	}
}

/**
 * Endpoint used in dev and SSR to serve optimized images by the base image services
 */
export const GET: APIRoute = async ({ request }) => {
	try {
		const imageService = await getConfiguredImageService();

		if (!('transform' in imageService)) {
			throw new Error('Configured image service is not a local service');
		}

		const url = new URL(request.url);
		const transform = await imageService.parseURL(url, imageConfig);

		if (!transform?.src) {
			throw new Error('Incorrect transform returned by `parseURL`');
		}

		let inputBuffer: Buffer | undefined = undefined;

		// TODO: handle config subpaths?
		const sourceUrl = isRemotePath(transform.src)
			? new URL(transform.src)
			: new URL(transform.src, url.origin);

		if (isRemotePath(transform.src) && isRemoteAllowed(transform.src, imageConfig) === false) {
			return new Response('Forbidden', { status: 403 });
		}

		inputBuffer = await loadRemoteImage(sourceUrl);

		if (!inputBuffer) {
			return new Response('Not Found', { status: 404 });
		}

		const { data, format } = await imageService.transform(inputBuffer, transform, imageConfig);

		return new Response(data, {
			status: 200,
			headers: {
				'Content-Type': mime.getType(format) ?? `image/${format}`,
				'Cache-Control': 'public, max-age=31536000',
				ETag: etag(data.toString()),
				Date: new Date().toUTCString(),
			},
		});
	} catch (err: unknown) {
		return new Response(`Server Error: ${err}`, { status: 500 });
	}
};
