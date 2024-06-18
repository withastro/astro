import type { PluginContext } from 'rollup';
import { z } from 'zod';
import { emitESMImage } from '../assets/utils/emitAsset.js';
import type { OmitBrand, ImageMetadata } from '../assets/types.js';

export function createImage(
	pluginContext: PluginContext,
	shouldEmitFile: boolean,
	entryFilePath: string
) {
	return () => {
		return z.string().transform(async (imagePath, ctx) => {
			const resolvedFilePath = (await pluginContext.resolve(imagePath, entryFilePath))?.id;
			const metadata = (await emitESMImage(
				resolvedFilePath,
				pluginContext.meta.watchMode,
				shouldEmitFile ? pluginContext.emitFile : undefined
			)) as OmitBrand<ImageMetadata>;

			if (!metadata) {
				ctx.addIssue({
					code: 'custom',
					message: `Image ${imagePath} does not exist. Is the path correct?`,
					fatal: true,
				});

				return z.never();
			}

			return { ...metadata, ASTRO_ASSET: metadata.fsPath };
		});
	};
}
