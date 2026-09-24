import { imageConfig } from 'astro:assets';
import { isRemotePath } from '@astrojs/internal-helpers/path';
import { isRemoteAllowed } from '@astrojs/internal-helpers/remote';
import { fetchWithRedirects } from 'astro/assets';
import { transformStream } from './image-binding-transform-stream.js';

export { transformStream } from './image-binding-transform-stream.js';

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
