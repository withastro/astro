import fs from 'fs/promises';
import sharp from './loaders/sharp.js';
import type { APIRoute } from 'astro';

const MimeTypes: Record<string, string> = {
	'avif': 'image/avif',
	'jpeg': 'image/jpeg',
	'png': 'image/png',
	'webp': 'image/webp'
};

async function loadLocalImage(src: string) {
	try {
		return await fs.readFile(src);
	} catch {
		return undefined;
	}
}

async function loadRemoteImage(src: string) {
	try {
		const res = await fetch(src);

		if (!res.ok) {
			return undefined;
		}

		return Buffer.from(await res.arrayBuffer());
	} catch {
		return undefined;
	}
}

function isRemoteImage(src: string) {
	return /^http(s?):\/\//.test(src);
}

export const get: APIRoute = async ({ request }) => {
	try {
		const imageService = sharp;

		const props = imageService.parseImageSrc(request.url);

		if (!props) {
			console.log('Bad Request', request.url);
			return new Response('Bad Request', { status: 400 });
		}

		const inputBuffer = isRemoteImage(props.src)
			? await loadRemoteImage(props.src)
			: await loadLocalImage(props.src);

		if (!inputBuffer) {
			return new Response(`"${props.src} not found`, { status: 404 });
		}

		const { data, format } = await imageService.toBuffer(inputBuffer, props);

		return new Response(data, {
			status: 200,
			headers: {
				'content-type': MimeTypes[format],
			}
		});
	} catch (err: unknown) {
		return new Response(`Server Error: ${err}`, { status: 500 });
	}
}
