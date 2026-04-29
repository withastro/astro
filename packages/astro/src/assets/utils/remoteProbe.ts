import { isRemoteAllowed } from '@astrojs/internal-helpers/remote';
import { AstroError, AstroErrorData } from '../../core/errors/index.js';
import type { AstroConfig } from '../../types/public/config.js';
import type { ImageMetadata } from '../types.js';
import { imageMetadata } from './metadata.js';

type RemoteImageConfig = Pick<AstroConfig['image'], 'domains' | 'remotePatterns'>;

/**
 * Recursively follows redirects, validating that the final URL matches allowed patterns.
 */
async function fetchWithRedirectValidation(
	url: string,
	redirectLimit: number = 10,
): Promise<Response> {
	if (redirectLimit <= 0) {
		throw new AstroError({
			...AstroErrorData.FailedToFetchRemoteImageDimensions,
			message: AstroErrorData.FailedToFetchRemoteImageDimensions.message(url),
		});
	}

	const response = await fetch(url, {
		redirect: 'manual',
	});

	// Handle redirects (301, 302, 303, 307, 308 are actual redirects, not 304 Not Modified)
	if ([301, 302, 303, 307, 308].includes(response.status)) {
		const location = response.headers.get('Location');
		if (!location) {
			throw new AstroError({
				...AstroErrorData.FailedToFetchRemoteImageDimensions,
				message: AstroErrorData.FailedToFetchRemoteImageDimensions.message(url),
			});
		}

		// Resolve the redirect URL relative to the current URL
		const redirectUrl = new URL(location, url).toString();
		return fetchWithRedirectValidation(redirectUrl, redirectLimit - 1);
	}

	return response;
}

/**
 * Infers the dimensions of a remote image by streaming its data and analyzing it progressively until sufficient metadata is available.
 *
 * @param {string} url - The URL of the remote image from which to infer size metadata.
 * @param {RemoteImageConfig} [imageConfig] - Optional image config used to validate remote allowlists.
 * @return {Promise<Omit<ImageMetadata, 'src' | 'fsPath'>>} Returns a promise that resolves to an object containing the image dimensions metadata excluding `src` and `fsPath`.
 * @throws {AstroError} Thrown when the fetching fails or metadata cannot be extracted.
 */
export async function inferRemoteSize(
	url: string,
	imageConfig?: RemoteImageConfig,
): Promise<Omit<ImageMetadata, 'src' | 'fsPath'>> {
	if (!URL.canParse(url)) {
		throw new AstroError({
			...AstroErrorData.FailedToFetchRemoteImageDimensions,
			message: AstroErrorData.FailedToFetchRemoteImageDimensions.message(url),
		});
	}

	const allowlistConfig = imageConfig
		? {
				domains: imageConfig.domains ?? [],
				remotePatterns: imageConfig.remotePatterns ?? [],
			}
		: undefined;

	if (!allowlistConfig) {
		const parsedUrl = new URL(url);
		if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
			throw new AstroError({
				...AstroErrorData.FailedToFetchRemoteImageDimensions,
				message: AstroErrorData.FailedToFetchRemoteImageDimensions.message(url),
			});
		}
	}

	if (allowlistConfig && !isRemoteAllowed(url, allowlistConfig)) {
		throw new AstroError({
			...AstroErrorData.RemoteImageNotAllowed,
			message: AstroErrorData.RemoteImageNotAllowed.message(url),
		});
	}

	// Start fetching the image with redirect validation
	const response = await fetchWithRedirectValidation(url);

	// Validate that the final URL (after redirects) is allowed
	if (allowlistConfig && !isRemoteAllowed(response.url, allowlistConfig)) {
		throw new AstroError({
			...AstroErrorData.RemoteImageNotAllowed,
			message: AstroErrorData.RemoteImageNotAllowed.message(url),
		});
	}

	if (!response.body || !response.ok) {
		throw new AstroError({
			...AstroErrorData.FailedToFetchRemoteImageDimensions,
			message: AstroErrorData.FailedToFetchRemoteImageDimensions.message(url),
		});
	}

	const reader = response.body.getReader();

	let done: boolean | undefined, value: Uint8Array;
	let accumulatedChunks = new Uint8Array();

	// Process the stream chunk by chunk
	while (!done) {
		const readResult = await reader.read();
		done = readResult.done;

		if (done) break;

		if (readResult.value) {
			value = readResult.value;

			// Accumulate chunks
			let tmp = new Uint8Array(accumulatedChunks.length + value.length);
			tmp.set(accumulatedChunks, 0);
			tmp.set(value, accumulatedChunks.length);
			accumulatedChunks = tmp;

			try {
				// Attempt to determine the size with each new chunk
				const dimensions = await imageMetadata(accumulatedChunks, url);

				if (dimensions) {
					await reader.cancel(); // stop stream as we have size now

					return dimensions;
				}
			} catch {
				// This catch block is specifically for `imageMetadata` errors
				// which might occur if the accumulated data isn't yet sufficient.
			}
		}
	}

	throw new AstroError({
		...AstroErrorData.NoImageMetadata,
		message: AstroErrorData.NoImageMetadata.message(url),
	});
}
