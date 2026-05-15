import { imageConfig } from 'astro:assets';
import { isRemotePath } from '@astrojs/internal-helpers/path';
import { isRemoteAllowed } from '@astrojs/internal-helpers/remote';
import * as mime from 'mrmime';
import { getConfiguredImageService } from '../internal.js';
import { etag } from '../utils/etag.js';
import { loadImage } from './loadImage.js';
const GET = async ({ request }) => {
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
		let inputBuffer = void 0;
		const isRemoteImage = isRemotePath(transform.src);
		if (isRemoteImage && isRemoteAllowed(transform.src, imageConfig) === false) {
			return new Response('Forbidden', { status: 403 });
		}
		const sourceUrl = new URL(transform.src, url.origin);
		if (!isRemoteImage && sourceUrl.origin !== url.origin) {
			return new Response('Forbidden', { status: 403 });
		}
		inputBuffer = await loadImage(
			sourceUrl,
			isRemoteImage ? new Headers() : request.headers,
			imageConfig,
			isRemoteImage,
		);
		if (!inputBuffer) {
			return new Response('Not Found', { status: 404 });
		}
		const { data, format } = await imageService.transform(
			new Uint8Array(inputBuffer),
			transform,
			imageConfig,
		);
		return new Response(data, {
			status: 200,
			headers: {
				'Content-Type': mime.lookup(format) ?? `image/${format}`,
				'Cache-Control': 'public, max-age=31536000',
				ETag: etag(data.toString()),
				Date: /* @__PURE__ */ new Date().toUTCString(),
			},
		});
	} catch (err) {
		console.error('Could not process image request:', err);
		return new Response('Internal Server Error', { status: 500 });
	}
};
export { GET };
