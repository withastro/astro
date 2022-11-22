import type { APIRoute } from 'astro';
import mime from 'mime';
// @ts-ignore
import loader from 'virtual:image-loader';
import { etag } from './utils/etag.js';
import { isRemoteImage } from './utils/paths.js';

async function loadRemoteImage(src: URL) {
	try {
		const res = await fetch(src);

		if (!res.ok) {
			return undefined;
		}

		return Buffer.from(await res.arrayBuffer());
	} catch (err: unknown) {
		console.error(err);
		return undefined;
	}
}

export const get: APIRoute = async ({ request }) => {
	try {
		const url = new URL(request.url);
		const transform = loader.parseTransform(url.searchParams);

		let inputBuffer: Buffer | undefined = undefined;

		// TODO: handle config subpaths?
		const sourceUrl = isRemoteImage(transform.src)
			? new URL(transform.src)
			: new URL(transform.src, url.origin);
		inputBuffer = await loadRemoteImage(sourceUrl);

		if (!inputBuffer) {
			return new Response('Not Found', { status: 404 });
		}
		let result;
		if (transform.src.includes('.gif')) {
			const gifLoader = await (await import('./loaders/sharp.js')).default;
			result = gifLoader.transform(inputBuffer, transform);
		} else {
			result = loader.transform(inputBuffer, transform);
		}

		return new Response(result.data, {
			status: 200,
			headers: {
				'Content-Type': mime.getType(result.ormat) || '',
				'Cache-Control': 'public, max-age=31536000',
				ETag: etag(result.data.toString()),
				Date: new Date().toUTCString(),
			},
		});
	} catch (err: unknown) {
		console.error(err);
		return new Response(`Server Error: ${err}`, { status: 500 });
	}
};
