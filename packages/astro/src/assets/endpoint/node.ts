import { isRemotePath, removeQueryString } from '@astrojs/internal-helpers/path';
import { readFile } from 'fs/promises';
import mime from 'mime/lite.js';
import type { APIRoute } from '../../@types/astro.js';
import { getConfiguredImageService, isRemoteAllowed } from '../internal.js';
import { etag } from '../utils/etag.js';
// @ts-expect-error
import { assetsDir, imageConfig } from 'astro:assets';

async function loadLocalImage(src: string, url: URL) {
	const filePath = import.meta.env.DEV
		? removeQueryString(src.slice('/@fs'.length))
		: new URL('.' + src, assetsDir);
	let buffer: Buffer | undefined = undefined;

	try {
		buffer = await readFile(filePath);
	} catch (e) {
		const sourceUrl = new URL(src, url.origin);
		buffer = await loadRemoteImage(sourceUrl);
	}

	return buffer;
}

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

		if (isRemotePath(transform.src)) {
			if (isRemoteAllowed(transform.src, imageConfig) === false) {
				return new Response('Forbidden', { status: 403 });
			}

			inputBuffer = await loadRemoteImage(new URL(transform.src));
		} else {
			inputBuffer = await loadLocalImage(transform.src, url);
		}

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
