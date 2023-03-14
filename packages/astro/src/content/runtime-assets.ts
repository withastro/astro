import { z } from 'zod';
import { imageMetadata, type Metadata } from '../assets/utils/metadata.js';

export function createImage(options: { assetsDir: string; relAssetsDir: string }) {
	return () => {
		if (options.assetsDir === 'undefined') {
			throw new Error('Enable `experimental.assets` in your Astro config to use image()');
		}

		return z.string().transform(async (imagePath) => {
			const fullPath = new URL(imagePath, options.assetsDir);
			return await getImageMetadata(fullPath);
		});
	};
}

async function getImageMetadata(
	imagePath: URL
): Promise<(Metadata & { __astro_asset: true }) | undefined> {
	const meta = await imageMetadata(imagePath);

	if (!meta) {
		return undefined;
	}

	delete meta.orientation;
	return { ...meta, __astro_asset: true };
}
