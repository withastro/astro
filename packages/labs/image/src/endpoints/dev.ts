// @ts-ignore
import loader from 'virtual:image-loader';
import { lookup } from 'mrmime';
import { loadImage } from '../utils.js';
import type { APIRoute } from 'astro';

export const get: APIRoute = async ({ request }) => {
	try {
		const url = new URL(request.url);
		const props = loader.parseImageProps(url.searchParams);

		if (!props) {
			return new Response('Bad Request', { status: 400 });
		}

		const inputBuffer = await loadImage(props.src);

		if (!inputBuffer) {
			return new Response(`"${props.src} not found`, { status: 404 });
		}

		const { data, format } = await loader.transform(inputBuffer, props);

		return new Response(data, {
			status: 200,
			headers: {
				'content-type': lookup(format) || '',
			}
		});
	} catch (err: unknown) {
		return new Response(`Server Error: ${err}`, { status: 500 });
	}
}
