import type { LocalImageService } from 'astro';
import sharpService from 'astro/assets/services/sharp';
import {
	IMAGE_TRANSFORM_ENDPOINT,
	PRERENDER_SERVER_URL_KEY,
} from '../utils/prerender-constants.js';

/** Maps Astro's transform options onto the query parameters `/_image` expects. */
const IMAGE_TRANSFORM_PARAMS: Record<string, string> = {
	w: 'width',
	h: 'height',
	q: 'quality',
	f: 'format',
	fit: 'fit',
	position: 'position',
	background: 'background',
};

function createImageTransformUrl(serverUrl: string, transform: Record<string, any>): string {
	const url = new URL(IMAGE_TRANSFORM_ENDPOINT, serverUrl);
	url.searchParams.set('href', transform.src);
	for (const [param, key] of Object.entries(IMAGE_TRANSFORM_PARAMS)) {
		const value = transform[key];
		if (value) {
			url.searchParams.set(param, value.toString());
		}
	}
	return url.toString();
}

let warnedServerUrl: string | undefined;

/** Sharp, with transforms sent to the prerender server's IMAGES binding. */
const service: LocalImageService = {
	...sharpService,

	async transform(inputBuffer, transform, imageConfig, logger) {
		const serverUrl = (globalThis as Record<symbol, string | undefined>)[PRERENDER_SERVER_URL_KEY];
		try {
			if (!serverUrl) {
				throw new Error('the prerender server is not running');
			}
			const response = await fetch(createImageTransformUrl(serverUrl, transform), {
				method: 'POST',
				body: inputBuffer as Uint8Array<ArrayBuffer>,
			});
			if (!response.ok) {
				// The body can be a full error page, so keep only enough of it to be useful.
				const body = (await response.text().catch(() => '')).replace(/\s+/g, ' ').trim();
				const details = body ? `: ${body.slice(0, 200)}` : '';
				throw new Error(
					`the prerender server responded ${response.status} ${response.statusText}${details}`,
				);
			}
			return { data: new Uint8Array(await response.arrayBuffer()), format: transform.format };
		} catch (err) {
			// A missing or broken binding fails every image the same way: warn once.
			if (warnedServerUrl !== serverUrl) {
				warnedServerUrl = serverUrl;
				const message = err instanceof Error ? err.message : String(err);
				logger.warn(
					`Could not optimize "${transform.src}" with the Cloudflare IMAGES binding (${message}). Falling back to the local image service.`,
				);
			}
			return sharpService.transform(inputBuffer, transform, imageConfig, logger);
		}
	},
};

export default service;
