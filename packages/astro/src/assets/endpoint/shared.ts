// @ts-expect-error
import { imageConfig } from 'astro:assets';
import { isRemotePath, removeQueryString } from '@astrojs/internal-helpers/path';
import { isRemoteAllowed } from '@astrojs/internal-helpers/remote';
import * as mime from 'mrmime';
import { getConfiguredImageService } from '../internal.js';
import { etag } from '../utils/etag.js';
import { inferSourceFormat } from '../utils/inferSourceFormat.js';
import { fetchWithRedirects } from '../utils/redirectValidation.js';
import type { AstroRuntimeLogger } from '../../types/public/context.js';

const isLocal = (url: string) => {
	const hostname = new URL(url).hostname;
	return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
};

export type RemoteImageLoadResult =
	| { kind: 'loaded'; buffer: Buffer }
	| { kind: 'not-found'; status: number; url: string }
	| { kind: 'forbidden'; url: string }
	| { kind: 'unreachable'; url: string; error: unknown };

export async function loadRemoteImage(src: URL): Promise<RemoteImageLoadResult> {
	try {
		const res = await fetchWithRedirects({ url: src, imageConfig });

		// Local URLs are allowed by default
		if (!isRemoteAllowed(res.url, imageConfig) && !isLocal(res.url)) {
			return { kind: 'forbidden', url: res.url };
		}

		if (!res.ok) {
			return { kind: 'not-found', status: res.status, url: res.url };
		}

		return { kind: 'loaded', buffer: Buffer.from(await res.arrayBuffer()) };
	} catch (error) {
		return { kind: 'unreachable', url: src.href, error };
	}
}

export type LocalImageLoadResult =
	| { kind: 'loaded'; buffer: Buffer }
	| { kind: 'invalid-path' }
	| { kind: 'not-found' }
	| { kind: 'failed' };

function formatRemoteLoadError(error: unknown): string {
	if (error instanceof Error) {
		const cause =
			error.cause instanceof Error
				? ` (${error.cause.message})`
				: error.cause
					? ` (${String(error.cause)})`
					: '';
		return `${error.name}: ${error.message}${cause}`;
	}
	return String(error);
}

export const handleImageRequest = async ({
	request,
	loadLocalImage,
	logger,
}: {
	request: Request;
	loadLocalImage: (src: string, baseUrl: URL) => Promise<LocalImageLoadResult>;
	logger: AstroRuntimeLogger;
}) => {
	const imageService = await getConfiguredImageService();

	if (!('transform' in imageService)) {
		throw new Error('Configured image service is not a local service');
	}

	const url = new URL(request.url);
	const transform = await imageService.parseURL(url, imageConfig, logger);

	if (!transform?.src) {
		return new Response('Invalid request', { status: 400 });
	}

	// Reject requests that attempt to convert a non-SVG source to SVG output.
	// This mirrors the same guard in verifyOptions() that protects the <Image> component path.
	if (transform.format === 'svg') {
		const sourceFormat = inferSourceFormat(transform.src);
		if (sourceFormat !== 'svg') {
			return new Response('Cannot convert non-SVG source to SVG format', { status: 403 });
		}
	}

	let inputBuffer: Buffer | undefined = undefined;

	if (isRemotePath(transform.src)) {
		if (!isRemoteAllowed(transform.src, imageConfig)) {
			return new Response('Forbidden', { status: 403 });
		}

		const remote = await loadRemoteImage(new URL(transform.src));
		switch (remote.kind) {
			case 'loaded':
				inputBuffer = remote.buffer;
				break;
			case 'not-found':
				logger.error(
					`Could not fetch remote image ${remote.url}: received status ${remote.status}.`,
				);
				return new Response('Not Found', { status: 404 });
			case 'forbidden':
				logger.error(`Could not fetch remote image ${remote.url}: redirect host is not allowed.`);
				return new Response('Forbidden', { status: 403 });
			case 'unreachable':
				logger.error(
					`Could not fetch remote image ${remote.url}: ${formatRemoteLoadError(remote.error)}`,
				);
				return new Response('Bad Gateway', { status: 502 });
		}
	} else {
		const result = await loadLocalImage(removeQueryString(transform.src), url);
		switch (result.kind) {
			case 'invalid-path':
				return new Response('Invalid request', { status: 400 });
			case 'not-found':
				return new Response('Not Found', { status: 404 });
			case 'failed':
				return new Response('Internal Server Error', { status: 500 });
			case 'loaded':
				inputBuffer = result.buffer;
		}
	}

	if (!inputBuffer) {
		return new Response('Internal Server Error', { status: 500 });
	}

	const { data, format } = await imageService.transform(
		inputBuffer,
		transform,
		imageConfig,
		logger,
	);

	return new Response(data as Uint8Array<ArrayBuffer>, {
		status: 200,
		headers: {
			'Content-Type': mime.lookup(format) ?? `image/${format}`,
			'Cache-Control': 'public, max-age=31536000',
			ETag: etag(data.toString()),
			Date: new Date().toUTCString(),
		},
	});
};
