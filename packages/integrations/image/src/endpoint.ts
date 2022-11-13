import type { APIRoute } from 'astro';
import mime from 'mime/lite';
// @ts-ignore
import loader from 'virtual:image-loader';
import { OutputFormat } from './index.js';
import { etag } from './utils/etag.js';
import { isRemoteImage } from './utils/paths.js';

async function loadRemoteImage(src: URL) {
	try {
		const res = await fetch(src);

		if (!res.ok) {
			return undefined;
		}

		// get the image format based on the response headers
		const contentType = res.headers.get('Content-Type');
		const mimeType = contentType && mime.getExtension(contentType);

		return {
			data: Buffer.from(await res.arrayBuffer()),
			format: mimeType,
		};
	} catch {
		return undefined;
	}
}

export const get: APIRoute = async ({ request }) => {
	try {
		const url = new URL(request.url);
		const transform = loader.parseTransform(url.searchParams);

		let inputBuffer: Buffer | undefined = undefined;
		let inputFormat: OutputFormat | undefined = undefined;

		// TODO: handle config subpaths?
		const sourceUrl = isRemoteImage(transform.src)
			? new URL(transform.src)
			: new URL(transform.src, url.origin);

		const res = await loadRemoteImage(sourceUrl);
		inputBuffer = res?.data;
		inputFormat = res?.format as OutputFormat;

		if (!inputBuffer) {
			return new Response('Not Found', { status: 404 });
		}

		const { data, format } = await loader.transform(inputBuffer, {
			...transform,
			format: transform.format || inputFormat,
		});

		return new Response(data, {
			status: 200,
			headers: {
				'Content-Type': mime.getType(format) || '',
				'Cache-Control': 'public, max-age=31536000',
				ETag: etag(data.toString()),
				Date: new Date().toUTCString(),
			},
		});
	} catch (err: unknown) {
		console.error(err);
		return new Response(`Server Error: ${err}`, { status: 500 });
	}
};
