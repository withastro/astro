import type { ImageOutputOptions, ImageTransform } from '@cloudflare/workers-types';
import type { ImageQualityPreset } from 'astro';

const qualityTable: Record<ImageQualityPreset, number> = {
	low: 25,
	mid: 50,
	high: 85,
	max: 100,
};

const defaultQuality = 85;

const SVG_CONTENT_TYPE = 'image/svg+xml';

/**
 * Transforms an already-resolved image stream. Split out from `transform` so the build
 * can hand over source bytes it read itself: during the build the original image lives
 * in Astro's intermediate output rather than behind the ASSETS binding, so the worker
 * has no way to fetch it.
 *
 * `sourceContentType` is the media type the source was served with. It resolves the output
 * format for requests that carry no `f` parameter, which core omits whenever it cannot
 * infer a source format from the URL — extensionless remote images such as
 * `https://avatars.githubusercontent.com/u/1234` are the common case. Core leaves the
 * format undefined there on purpose, expecting the image service to determine it from the
 * source itself, as the Sharp service does. See withastro/astro.build#2610.
 */
export async function transformStream(
	body: ReadableStream,
	params: URLSearchParams,
	images: ImagesBinding,
	sourceContentType?: string | null,
): Promise<Response> {
	const supportedFormats: Record<string, ImageOutputOptions['format']> = {
		jpeg: 'image/jpeg',
		jpg: 'image/jpeg',
		png: 'image/png',
		gif: 'image/gif',
		webp: 'image/webp',
		avif: 'image/avif',
	};

	const requestedFormat = params.get('f');
	const sourceType = sourceContentType?.split(';')[0].trim().toLowerCase();

	// Core asks for `svg` when the source is an SVG, meaning "leave it alone". The IMAGES
	// binding cannot emit SVG and Astro does not rasterize SVG sources by default, so serve
	// the original bytes.
	if (requestedFormat === 'svg' || (!requestedFormat && sourceType === SVG_CONTENT_TYPE)) {
		return new Response(body, {
			headers: { 'Content-Type': sourceContentType || SVG_CONTENT_TYPE },
		});
	}

	// Mirrors core's `resolveDefaultOutputFormat`, which webp-encodes every non-SVG source.
	const outputFormat = requestedFormat ? supportedFormats[requestedFormat] : 'image/webp';

	if (!outputFormat) {
		return new Response(`Unsupported format: ${requestedFormat}`, { status: 400 });
	}

	const qualityParam = params.get('q');
	const quality = qualityParam
		? (qualityTable[qualityParam as ImageQualityPreset] ?? Number.parseInt(qualityParam))
		: params.has('q')
			? undefined
			: defaultQuality;

	return (
		await images
			.input(body)
			.transform({
				width: params.has('w') ? Number.parseInt(params.get('w')!) : undefined,
				height: params.has('h') ? Number.parseInt(params.get('h')!) : undefined,
				fit: params.get('fit') as ImageTransform['fit'],
			})
			.output({ quality, format: outputFormat })
	).response();
}
