import { imageConfig } from 'astro:assets';
import { isRemotePath } from '@astrojs/internal-helpers/path';
import { isRemoteAllowed } from '@astrojs/internal-helpers/remote';
import type { ImageOutputOptions, ImageTransform } from '@cloudflare/workers-types';

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
	const content = await (isRemotePath(href) ? fetch(imageSrc) : assets.fetch(imageSrc));
	if (!content.body) {
		return new Response(null, { status: 404 });
	}
	const input = images.input(content.body);

	const supportedFormats: Record<string, ImageOutputOptions['format']> = {
		jpeg: 'image/jpeg',
		jpg: 'image/jpeg',
		png: 'image/png',
		gif: 'image/gif',
		webp: 'image/webp',
		avif: 'image/avif',
	};

	const outputFormat = supportedFormats[url.searchParams.get('f') ?? ''];

	if (!outputFormat) {
		return new Response(`Unsupported format: ${url.searchParams.get('f')}`, { status: 400 });
	}

	return (
		await input
			.transform({
				width: url.searchParams.has('w') ? Number.parseInt(url.searchParams.get('w')!) : undefined,
				height: url.searchParams.has('h') ? Number.parseInt(url.searchParams.get('h')!) : undefined,
				// `quality` is documented, but doesn't appear to work in manual testing...
				// quality: url.searchParams.get('q'),
				fit: url.searchParams.get('fit') as ImageTransform['fit'],
			})
			.output({ format: outputFormat })
	).response();
}
