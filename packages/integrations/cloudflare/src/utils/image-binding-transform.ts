import { imageConfig } from 'astro:assets';
import { isRemotePath } from '@astrojs/internal-helpers/path';
import { isRemoteAllowed } from '@astrojs/internal-helpers/remote';
import type { ImageOutputOptions, ImageTransform } from '@cloudflare/workers-types';
import type { ImageQualityPreset } from 'astro';
import { fetchWithRedirects } from 'astro/assets';

const qualityTable: Record<ImageQualityPreset, number> = {
	low: 25,
	mid: 50,
	high: 80,
	max: 100,
};

/**
 * Transforms an already-resolved image stream. Split out from `transform` so the build
 * can hand over source bytes it read itself: during the build the original image lives
 * in Astro's intermediate output rather than behind the ASSETS binding, so the worker
 * has no way to fetch it.
 */
export async function transformStream(
	body: ReadableStream,
	params: URLSearchParams,
	images: ImagesBinding,
): Promise<Response> {
	const supportedFormats: Record<string, ImageOutputOptions['format']> = {
		jpeg: 'image/jpeg',
		jpg: 'image/jpeg',
		png: 'image/png',
		gif: 'image/gif',
		webp: 'image/webp',
		avif: 'image/avif',
	};

	const outputFormat = supportedFormats[params.get('f') ?? ''];

	if (!outputFormat) {
		return new Response(`Unsupported format: ${params.get('f')}`, { status: 400 });
	}

	return (
		await images
			.input(body)
			.transform({
				width: params.has('w') ? Number.parseInt(params.get('w')!) : undefined,
				height: params.has('h') ? Number.parseInt(params.get('h')!) : undefined,
				fit: params.get('fit') as ImageTransform['fit'],
			})
			.output({
				quality: params.get('q')
					? (qualityTable[params.get('q') as ImageQualityPreset] ??
						Number.parseInt(params.get('q')!))
					: undefined,
				format: outputFormat,
			})
	).response();
}

export async function transform(
	rawUrl: string,
	images: ImagesBinding,
	assets: Fetcher,
): Promise<Response> {
	const url = new URL(rawUrl);

	const href = url.searchParams.get('href');

	if (!href || (isRemotePath(href) && !isRemoteAllowed(href, imageConfig))) {
		return new Response('Forbidden', { status: 403 });
	}

	const imageSrc = new URL(href, url.origin);
	let content: Response;

	if (isRemotePath(href)) {
		try {
			content = await fetchWithRedirects({
				url: imageSrc,
				imageConfig,
			});

			// Validate that the final URL (after redirects) is allowed
			if (!isRemoteAllowed(content.url, imageConfig)) {
				return new Response('Forbidden', { status: 403 });
			}
		} catch {
			return new Response('Not Found', { status: 404 });
		}
	} else {
		content = await assets.fetch(imageSrc);
	}

	if (!content.body) {
		return new Response(null, { status: 404 });
	}

	return transformStream(content.body, url.searchParams, images);
}
