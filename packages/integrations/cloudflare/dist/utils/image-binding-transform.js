import { imageConfig } from 'astro:assets';
import { isRemotePath } from '@astrojs/internal-helpers/path';
import { isRemoteAllowed } from '@astrojs/internal-helpers/remote';
import { fetchWithRedirects } from 'astro/assets';
const qualityTable = {
	low: 25,
	mid: 50,
	high: 80,
	max: 100,
};
async function transform(rawUrl, images, assets) {
	const url = new URL(rawUrl);
	const href = url.searchParams.get('href');
	if (!href || (isRemotePath(href) && !isRemoteAllowed(href, imageConfig))) {
		return new Response('Forbidden', { status: 403 });
	}
	const imageSrc = new URL(href, url.origin);
	let content;
	if (isRemotePath(href)) {
		try {
			content = await fetchWithRedirects({
				url: imageSrc,
				imageConfig,
			});
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
	const input = images.input(content.body);
	const supportedFormats = {
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
				width: url.searchParams.has('w') ? Number.parseInt(url.searchParams.get('w')) : void 0,
				height: url.searchParams.has('h') ? Number.parseInt(url.searchParams.get('h')) : void 0,
				fit: url.searchParams.get('fit'),
			})
			.output({
				quality: url.searchParams.get('q')
					? (qualityTable[url.searchParams.get('q')] ?? Number.parseInt(url.searchParams.get('q')))
					: void 0,
				format: outputFormat,
			})
	).response();
}
export { transform };
