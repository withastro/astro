// @ts-expect-error
import { imageConfig } from 'astro:assets';
import { isRemotePath } from '@astrojs/internal-helpers/path';
import { isRemoteAllowed } from '@astrojs/internal-helpers/remote';
import type { APIRoute } from '../../types/public/common.js';
import { getConfiguredImageService } from '../internal.js';
import { loadImage } from './loadImage.js';
import { createImageResponse } from './response.js';

/**
 * Endpoint used in dev and SSR to serve optimized images by the base image services
 */
export const GET: APIRoute = async ({ request, logger }) => {
	try {
		const imageService = await getConfiguredImageService();

		if (!('transform' in imageService)) {
			throw new Error('Configured image service is not a local service');
		}

		const url = new URL(request.url);
		const transform = await imageService.parseURL(url, imageConfig, logger);

		if (!transform?.src) {
			throw new Error('Incorrect transform returned by `parseURL`');
		}

		let inputBuffer: ArrayBuffer | undefined = undefined;

		const isRemoteImage = isRemotePath(transform.src);

		if (isRemoteImage && isRemoteAllowed(transform.src, imageConfig) === false) {
			return new Response('Forbidden', { status: 403 });
		}

		const sourceUrl = new URL(transform.src, url.origin);

		// Have we been tricked into thinking this is local?
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
			logger,
		);

		return createImageResponse(data, format);
	} catch (err: unknown) {
		logger.error(`Could not process image request: ${err}`);
		return new Response('Internal Server Error', { status: 500 });
	}
};
