// @ts-expect-error
import { imageConfig } from 'astro:assets';
import { isRemotePath, removeQueryString } from '@astrojs/internal-helpers/path';
import { isRemoteAllowed } from '@astrojs/internal-helpers/remote';
import * as mime from 'mrmime';
import { getConfiguredImageService } from '../internal.js';
import { etag } from '../utils/etag.js';
import { inferSourceFormat } from '../utils/inferSourceFormat.js';
import { fetchWithRedirects } from '../utils/redirectValidation.js';
import { detector } from '../utils/vendor/image-size/detector.js';
import type { AstroRuntimeLogger } from '../../types/public/context.js';

const NON_SVG_SOURCE_MESSAGE = 'Cannot convert non-SVG source to SVG format';

const isLocal = (url: string) => {
	const hostname = new URL(url).hostname;
	return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
};

export async function loadRemoteImage(src: URL): Promise<Buffer | undefined> {
	try {
		const res = await fetchWithRedirects({ url: src, imageConfig });

		// Local URLs are allowed by default
		if (!isRemoteAllowed(res.url, imageConfig) && !isLocal(res.url)) {
			return undefined;
		}

		if (!res.ok) {
			return undefined;
		}

		return Buffer.from(await res.arrayBuffer());
	} catch {
		return undefined;
	}
}

export type LocalImageLoadResult =
	| { kind: 'loaded'; buffer: Buffer }
	| { kind: 'invalid-path' }
	| { kind: 'not-found' }
	| { kind: 'failed' };

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
	// Sources without a recognizable extension (e.g. `https://skillicons.dev/icons?i=git`) are
	// checked against their content once loaded instead.
	const sourceFormat = transform.format === 'svg' ? inferSourceFormat(transform.src) : undefined;
	if (transform.format === 'svg' && sourceFormat !== undefined && sourceFormat !== 'svg') {
		return new Response(NON_SVG_SOURCE_MESSAGE, { status: 403 });
	}

	let inputBuffer: Buffer | undefined = undefined;

	if (isRemotePath(transform.src)) {
		if (!isRemoteAllowed(transform.src, imageConfig)) {
			return new Response('Forbidden', { status: 403 });
		}

		inputBuffer = await loadRemoteImage(new URL(transform.src));
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

	if (transform.format === 'svg' && sourceFormat === undefined && detector(inputBuffer) !== 'svg') {
		return new Response(NON_SVG_SOURCE_MESSAGE, { status: 403 });
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
