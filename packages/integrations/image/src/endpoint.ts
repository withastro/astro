import type { APIRoute } from 'astro';
import mime from 'mime';
// @ts-ignore
import loader from 'virtual:image-loader';
import { etag } from './utils/etag.js';
import { isRemoteImage } from './utils/paths.js';
import { transformBuffer } from '@astrojs/fs';
import { getCacheMetatadataFromTransformOptions } from './utils/getCacheMetatadataFromTransformOptions.js';
import type { TCachedImageMetadata } from './types.js';

async function loadRemoteImage(src: URL) {
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

export const get: APIRoute = async ({ request }) => {
	try {
		const url = new URL(request.url);
		const transform = loader.parseTransform(url.searchParams);

		let loadedBuffer: Buffer | undefined = undefined;

		// TODO: handle config subpaths?
		const sourceUrl = isRemoteImage(transform.src)
			? new URL(transform.src)
			: new URL(transform.src, url.origin);
		loadedBuffer = await loadRemoteImage(sourceUrl);

		if (!loadedBuffer) {
			return new Response('Not Found', { status: 404 });
		}

		const inputBuffer = loadedBuffer;

		const { output, metadata } = await transformBuffer<TCachedImageMetadata>({
			input: inputBuffer,
			transformMetadata: getCacheMetatadataFromTransformOptions(transform),
			transformFn: async () => {
				// console.log(`endpoint.get`, { transform });
				const { data, format } = await loader.transform(inputBuffer, transform);
				return { output: data, metadata: { format } };
			},
			enableCache: true, // TODO(ALAN) make configurable
		});

		return new Response(output, {
			status: 200,
			headers: {
				'Content-Type': mime.getType(metadata.format) || '',
				'Cache-Control': 'public, max-age=31536000',
				ETag: etag(output.toString()),
				Date: new Date().toUTCString(),
			},
		});
	} catch (err: unknown) {
		return new Response(`Server Error: ${err}`, { status: 500 });
	}
};
