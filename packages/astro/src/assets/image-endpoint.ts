import mime from 'mime/lite.js';
import type { APIRoute } from '../@types/astro.js';
import { isRemotePath } from '../core/path.js';
import { getConfiguredImageService } from './internal.js';
import { isLocalService } from './services/service.js';
import { etag } from './utils/etag.js';
// @ts-expect-error
import { imageServiceConfig } from 'astro:assets';

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
 * Endpoint used in SSR to serve optimized images
 */
export const get: APIRoute = async ({ request }) => {
	try {
		const imageService = await getConfiguredImageService();

		if (!isLocalService(imageService)) {
			throw new Error('Configured image service is not a local service');
		}

		const url = new URL(request.url);
		const transform = await imageService.parseURL(url, imageServiceConfig);

		if (!transform?.src) {
			throw new Error('Incorrect transform returned by `parseURL`');
		}

		let inputBuffer: Buffer | undefined = undefined;

		// TODO: handle config subpaths?
		const sourceUrl = isRemotePath(transform.src)
			? new URL(transform.src)
			: new URL(transform.src, url.origin);
		inputBuffer = await loadRemoteImage(sourceUrl);

		if (!inputBuffer) {
			return new Response('Not Found', { status: 404 });
		}

		const { data, format } = await imageService.transform(
			inputBuffer,
			transform,
			imageServiceConfig
		);

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
