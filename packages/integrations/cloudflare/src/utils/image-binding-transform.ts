// @ts-expect-error Not sure how to make this typecheck properly
import { imageConfig } from 'astro:assets';
import { isRemotePath } from '@astrojs/internal-helpers/path';
import { isRemoteAllowed } from '@astrojs/internal-helpers/remote';

import type {
	Fetcher,
	ImagesBinding,
	ImageTransform,
	ReadableStream,
} from '@cloudflare/workers-types';

export async function transform(rawUrl: string, images: ImagesBinding, assets: Fetcher) {
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
	const input = images.input(content.body as ReadableStream);

	const format = url.searchParams.get('f');

	if (!format || !['avif', 'webp', 'jpeg'].includes(format)) {
		return new Response(`The "${format}" format is not supported`, { status: 400 });
	}

	return (
		await input
			.transform({
				width: url.searchParams.has('w') ? parseInt(url.searchParams.get('w')!) : undefined,
				height: url.searchParams.has('h') ? parseInt(url.searchParams.get('h')!) : undefined,
				// `quality` is documented, but doesn't appear to work in manual testing...
				// quality: url.searchParams.get('q'),
				fit: url.searchParams.get('fit') as ImageTransform['fit'],
			})
			.output({ format: `image/${format as 'webp' | 'avif' | 'jpeg'}` })
	).response();
}
