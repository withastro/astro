import type { RemoteImageConfig } from '../utils/redirectValidation.js';
/**
 * Fetches an image by URL. Used by the generic image endpoint for both
 * remote images and local images (self-fetched from the same origin).
 *
 * For remote images, the final URL (after any redirects) is validated
 * against `imageConfig.domains` and `imageConfig.remotePatterns`.
 * Local images skip this check — they are already guarded by the
 * same-origin check in the caller.
 */
export declare function loadImage(
	src: URL,
	headers: Headers,
	imageConfig: RemoteImageConfig,
	isRemote: boolean,
	fetchFn?: typeof globalThis.fetch,
): Promise<ArrayBuffer | undefined>;
