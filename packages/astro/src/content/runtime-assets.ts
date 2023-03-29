import { pathToFileURL } from 'url';
import { z } from 'zod';
import {
	imageMetadata as internalGetImageMetadata,
	type Metadata,
} from '../assets/utils/metadata.js';

export function createImage(options: { assetsDir: string; relAssetsDir: string }) {
	return () => {
		if (options.assetsDir === 'undefined') {
			throw new Error('Enable `experimental.assets` in your Astro config to use image()');
		}

		return z.string({ description: '__image' }).transform(async (imagePath, ctx) => {
			const imageMetadata = await getImageMetadata(pathToFileURL(imagePath));

			if (!imageMetadata) {
				ctx.addIssue({
					code: 'custom',
					message: `Image ${imagePath} does not exist. Is the path correct?`,
					fatal: true,
				});

				return z.NEVER;
			}

			return imageMetadata;
		});
	};
}

async function getImageMetadata(
	imagePath: URL
): Promise<(Metadata & { __astro_asset: true }) | undefined> {
	const meta = await internalGetImageMetadata(imagePath);

	if (!meta) {
		return undefined;
	}

	delete meta.orientation;
	return { ...meta, __astro_asset: true };
}
