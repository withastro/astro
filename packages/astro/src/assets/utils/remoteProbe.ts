import { isRemoteAllowed } from '@astrojs/internal-helpers/remote';
import { AstroError, AstroErrorData } from '../../core/errors/index.js';
import { debug } from '../../core/logger/core.js';
import type { AstroConfig } from '../../types/public/config.js';
import type { ImageMetadata } from '../types.js';
import { imageMetadata } from './metadata.js';
import { fetchWithRedirects } from './redirectValidation.js';

type RemoteImageConfig = Pick<AstroConfig['image'], 'domains' | 'remotePatterns'>;

const REMOTE_IMAGE_DIMENSION_RETRY_DELAYS = [500, 1500];
const NETWORK_ERROR_CODES = new Set([
	'ECONNABORTED',
	'ECONNREFUSED',
	'ECONNRESET',
	'EHOSTUNREACH',
	'ENETDOWN',
	'ENETUNREACH',
	'ENOTFOUND',
	'ETIMEDOUT',
	'EAI_AGAIN',
]);

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

	const totalAttempts = REMOTE_IMAGE_DIMENSION_RETRY_DELAYS.length + 1;

	for (let attempt = 1; attempt <= totalAttempts; attempt++) {
		try {
			// Retry the original probe itself, so fetch-level failures during redirects or
			// body reads are classified before being collapsed into Astro errors
			const response = await fetchWithRedirects({
				url,
				onMaxRedirectsExceeded: (u) => createFailedToFetchRemoteImageDimensionsError(u),
				onMissingLocationHeader: (_status, u) => createFailedToFetchRemoteImageDimensionsError(u),
				onDisallowedRedirect: (_current, target) =>
					new AstroError({
						...AstroErrorData.RemoteImageNotAllowed,
						message: AstroErrorData.RemoteImageNotAllowed.message(target),
					}),
				imageConfig: imageConfig ?? {
					remotePatterns: [],
					domains: [],
				},
			});

			// Validate that the final URL (after redirects) is allowed
			if (allowlistConfig && !isRemoteAllowed(response.url, allowlistConfig)) {
				throw new AstroError({
					...AstroErrorData.RemoteImageNotAllowed,
					message: AstroErrorData.RemoteImageNotAllowed.message(url),
				});
			}

			if (!response.body || !response.ok) {
				throw createFailedToFetchRemoteImageDimensionsError(url);
			}

			const reader = response.body.getReader();

			let done: boolean | undefined;
			let accumulatedChunks = new Uint8Array();

			// Process the stream chunk by chunk
			while (!done) {
				const readResult = await reader.read();
				done = readResult.done;

				if (done) break;
				if (!readResult.value) continue;

				// Accumulate chunks
				const tmp = new Uint8Array(accumulatedChunks.length + readResult.value.length);
				tmp.set(accumulatedChunks, 0);
				tmp.set(readResult.value, accumulatedChunks.length);
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

			throw new AstroError({
				...AstroErrorData.NoImageMetadata,
				message: AstroErrorData.NoImageMetadata.message(url),
			});
		} catch (err) {
			// Only thrown network failures consume retry slots. Astro validation,
			// redirect, HTTP response, and metadata errors keep their original behavior.
			if (!isNetworkError(err)) {
				throw err;
			}

			const delay = REMOTE_IMAGE_DIMENSION_RETRY_DELAYS[attempt - 1];
			if (delay == null) {
				throw createFailedToFetchRemoteImageDimensionsError(url, {
					cause: err,
					totalAttempts,
				});
			}

			debug(
				'assets',
				`Retrying remote image dimension fetch for ${url}: attempt ${attempt + 1}/${totalAttempts} after ${summarizeError(err)}; waiting ${delay}ms.`,
			);

			await new Promise<void>((resolve) => setTimeout(resolve, delay));
		}
	}

	throw createFailedToFetchRemoteImageDimensionsError(url);
}

function createFailedToFetchRemoteImageDimensionsError(
	url: string,
	retryExhaustion?: { cause: unknown; totalAttempts: number },
) {
	const message = retryExhaustion
		? `${AstroErrorData.FailedToFetchRemoteImageDimensions.message(url)} The request failed after ${retryExhaustion.totalAttempts} attempts due to a network error.`
		: AstroErrorData.FailedToFetchRemoteImageDimensions.message(url);
	const hint = retryExhaustion
		? `${AstroErrorData.FailedToFetchRemoteImageDimensions.hint} If the URL is correct, check the remote server or network availability, or provide explicit width and height values.`
		: AstroErrorData.FailedToFetchRemoteImageDimensions.hint;

	return new AstroError(
		{
			...AstroErrorData.FailedToFetchRemoteImageDimensions,
			message,
			hint,
		},
		retryExhaustion ? { cause: retryExhaustion.cause } : undefined,
	);
}

function isNetworkError(error: unknown): boolean {
	if (!error || typeof error !== 'object') return false;

	const { name, code, cause } = error as {
		name?: unknown;
		code?: unknown;
		cause?: unknown;
	};

	if (name === 'TypeError' || name === 'AbortError' || name === 'TimeoutError') {
		return true;
	}

	if (typeof code === 'string' && (NETWORK_ERROR_CODES.has(code) || code.startsWith('UND_ERR_'))) {
		return true;
	}

	// Undici often stores the actual network failure on `cause`
	return cause ? isNetworkError(cause) : false;
}

function summarizeError(error: unknown) {
	if (!error || typeof error !== 'object') return String(error);

	const { name, message, code, cause } = error as {
		name?: unknown;
		message?: unknown;
		code?: unknown;
		cause?: { code?: unknown };
	};

	const errorName = typeof name === 'string' ? name : 'Error';
	const errorMessage = typeof message === 'string' ? message : String(error);
	const errorCode = typeof code === 'string' ? code : cause?.code;

	return typeof errorCode === 'string'
		? `${errorName}: ${errorMessage} (${errorCode})`
		: `${errorName}: ${errorMessage}`;
}
