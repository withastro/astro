// @ts-ignore
import loader from 'virtual:image-loader';
import { lookup } from 'mrmime';
import { getHash, isRemoteImage, loadRemoteImage } from '../utils.js';
import type { APIRoute } from 'astro';

export const get: APIRoute = async ({ request }) => {
	try {
		const url = new URL(request.url);
		const props = loader.parseImageProps(url.searchParams);

		if (!props) {
			return new Response('Bad Request', { status: 400 });
		}

		// TODO: Can we lean on fs to load local images in SSR prod builds?
		const href = isRemoteImage(props.src) ? new URL(props.src) : new URL(props.src, url.origin);

		const inputBuffer = await loadRemoteImage(href.toString());

		if (!inputBuffer) {
			return new Response(`"${props.src} not found`, { status: 404 });
		}

		const { data, format } = await loader.transform(inputBuffer, props);

		const etag = getHash(inputBuffer);

		return new Response(data, {
			status: 200,
			headers: {
				'Content-Type': lookup(format) || '',
				'Cache-Control': 'public, max-age=31536000',
				'ETag': etag,
				'Date': (new Date()).toUTCString(),
			}
		});
	} catch (err: unknown) {
		return new Response(`Server Error: ${err}`, { status: 500 });
	}
}
