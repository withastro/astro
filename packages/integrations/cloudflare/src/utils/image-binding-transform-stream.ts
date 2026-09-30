import type { ImageOutputOptions, ImageTransform } from '@cloudflare/workers-types';
import type { ImageQualityPreset } from 'astro';

const qualityTable: Record<ImageQualityPreset, number> = {
	low: 25,
	mid: 50,
	high: 85,
	max: 100,
};

const defaultQuality = 85;

/**
 * Transforms an already-resolved image stream. Split out from `transform` so the build
 * can hand over source bytes it read itself: during the build the original image lives
 * in Astro's intermediate output rather than behind the ASSETS binding, so the worker
 * has no way to fetch it.
 */
export async function transformStream(
	body: ReadableStream,
	params: URLSearchParams,
	images: ImagesBinding,
): Promise<Response> {
	const supportedFormats: Record<string, ImageOutputOptions['format']> = {
		jpeg: 'image/jpeg',
		jpg: 'image/jpeg',
		png: 'image/png',
		gif: 'image/gif',
		webp: 'image/webp',
		avif: 'image/avif',
	};

	const outputFormat = supportedFormats[params.get('f') ?? ''];

	if (!outputFormat) {
		return new Response(`Unsupported format: ${params.get('f')}`, { status: 400 });
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
