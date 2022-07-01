// @ts-ignore
import type { APIRoute } from 'astro';
import etag from 'etag';
import { lookup } from 'mrmime';
import loader from 'virtual:image-loader';
import { isRemoteImage, loadRemoteImage } from '../utils.js';

export const get: APIRoute = async ({ request }) => {
	try {
		const url = new URL(request.url);
		const transform = loader.parseTransform(url.searchParams);

		if (!transform) {
			return new Response('Bad Request', { status: 400 });
		}

		// TODO: Can we lean on fs to load local images in SSR prod builds?
		const href = isRemoteImage(transform.src)
			? new URL(transform.src)
			: new URL(transform.src, url.origin);

		const inputBuffer = await loadRemoteImage(href.toString());

		if (!inputBuffer) {
			return new Response(`"${transform.src} not found`, { status: 404 });
		}

		const { data, format } = await loader.transform(inputBuffer, transform);

		return new Response(data, {
			status: 200,
			headers: {
				'Content-Type': lookup(format) || '',
				'Cache-Control': 'public, max-age=31536000',
				ETag: etag(inputBuffer),
				Date: new Date().toUTCString(),
			},
		});
	} catch (err: unknown) {
		return new Response(`Server Error: ${err}`, { status: 500 });
	}
};
