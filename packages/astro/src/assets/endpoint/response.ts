import * as mime from 'mrmime';
import { etag } from '../utils/etag.js';
import { detector } from '../utils/vendor/image-size/detector.js';

/**
 * Builds the `/_image` response for an image service's output.
 *
 * Returns a 403 instead of the image when `format` is `svg` but `data` does not
 * hold an SVG, including bytes of no recognisable image type.
 */
export function createImageResponse(data: Uint8Array, format: string): Response {
	// Only the bytes decide what a browser does with `image/svg+xml`, and neither
	// the request's `f` parameter nor the source URL says what the bytes are. The
	// bundled non-Sharp services and custom services echo the requested format
	// without looking at the bytes, so the label has to be verified here. Sharp
	// resolves such requests to the source's real format itself, so its output
	// never trips this check.
	//
	// Unknown bytes are refused too: the SVG sniff only scans the first kilobyte,
	// so accepting them would let a document push its `<svg>` root past that
	// window behind a DOCTYPE.
	if (format === 'svg' && detector(data) !== 'svg') {
		return new Response('Cannot convert non-SVG source to SVG format', { status: 403 });
	}

	return new Response(data as Uint8Array<ArrayBuffer>, {
		status: 200,
		headers: {
			'Content-Type': mime.lookup(format) ?? `image/${format}`,
			'Cache-Control': 'public, max-age=31536000',
			ETag: etag(data.toString()),
			Date: new Date().toUTCString(),
		},
	});
}
