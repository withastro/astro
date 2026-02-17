/// <reference types="vite/client" />
import type { LocalImageService } from 'astro';
import { baseService } from 'astro/assets';

/**
 * Workerd-compatible image service stub.
 *
 * Handles getURL/getHTMLAttributes/addStaticImage in the workerd prerender
 * environment without importing Sharp. Actual image transforms are handled
 * elsewhere:
 * - `compile`: Sharp runs on the Node side via the generation pipeline
 * - `cloudflare-binding`: image-transform-endpoint uses the IMAGES binding directly
 *
 * transform() is a passthrough so the generic endpoint can call it in dev.
 */
const service: LocalImageService = {
	...baseService,

	async transform(inputBuffer, transform) {
		return { data: inputBuffer, format: transform.format };
	},
};

export default service;
