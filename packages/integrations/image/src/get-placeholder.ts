import { fileURLToPath } from 'url';
import { isRemoteImage, loadLocalImage, loadRemoteImage, parseAspectRatio } from './utils.js';
import type { GetImageTransform } from './get-image.js';
import type { SSRImageService } from './types.js';

export async function getPlaceholder(service: SSRImageService, transform: GetImageTransform) {
	let src: string;
	let aspectRatio: number;

	if (typeof transform.src === 'string') {
		src = transform.src;
		aspectRatio = parseAspectRatio(transform.aspectRatio) || transform.width! / transform.height!;
	} else {
		const metadata = 'then' in transform.src ? (await transform.src).default : transform.src;
		src = metadata.src;

		aspectRatio = parseAspectRatio(transform.aspectRatio) || metadata.width / metadata.height;
	}

	let buffer: Buffer | undefined;
	if (isRemoteImage(src)) {
		// try to load the remote image
		buffer = await loadRemoteImage(src);
	} else {
		// TODO: super hacky!  Revisit file URLs in dev vs. prod
		const inputFileURL = new URL(`.${src}`, new URL('file:///Users/tony/Git/astro/packages/integrations/image/test/fixtures/basic-image/src/'));
		const inputFile = fileURLToPath(inputFileURL);
		buffer = await loadLocalImage(src);
	}

	if (!buffer) {
		throw new Error(`${transform.src} image not found!`)
	}

	const optimized = await service.transform(buffer, { ...transform, src, width: 16, height: 16 / aspectRatio, blur: 1 });

	return `data:image/${optimized.format};base64,${optimized.data.toString('base64')}`;
}
