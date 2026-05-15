import { isRemoteAllowed } from '@astrojs/internal-helpers/remote';
import { AstroError, AstroErrorData } from '../../core/errors/index.js';
import { imageMetadata } from './metadata.js';
import { fetchWithRedirects } from './redirectValidation.js';
async function inferRemoteSize(url, imageConfig) {
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
		: void 0;
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
	let response;
	try {
		response = await fetchWithRedirects({
			url,
			onMaxRedirectsExceeded: (u) =>
				new AstroError({
					...AstroErrorData.FailedToFetchRemoteImageDimensions,
					message: AstroErrorData.FailedToFetchRemoteImageDimensions.message(u),
				}),
			onMissingLocationHeader: (_status, u) =>
				new AstroError({
					...AstroErrorData.FailedToFetchRemoteImageDimensions,
					message: AstroErrorData.FailedToFetchRemoteImageDimensions.message(u),
				}),
			imageConfig: imageConfig ?? {
				remotePatterns: [],
				domains: [],
			},
		});
	} catch (_err) {
		throw new AstroError({
			...AstroErrorData.FailedToFetchRemoteImageDimensions,
			message: AstroErrorData.FailedToFetchRemoteImageDimensions.message(url),
		});
	}
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
	let done, value;
	let accumulatedChunks = new Uint8Array();
	while (!done) {
		const readResult = await reader.read();
		done = readResult.done;
		if (done) break;
		if (readResult.value) {
			value = readResult.value;
			let tmp = new Uint8Array(accumulatedChunks.length + value.length);
			tmp.set(accumulatedChunks, 0);
			tmp.set(value, accumulatedChunks.length);
			accumulatedChunks = tmp;
			try {
				const dimensions = await imageMetadata(accumulatedChunks, url);
				if (dimensions) {
					await reader.cancel();
					return dimensions;
				}
			} catch {}
		}
	}
	throw new AstroError({
		...AstroErrorData.NoImageMetadata,
		message: AstroErrorData.NoImageMetadata.message(url),
	});
}
export { inferRemoteSize };
