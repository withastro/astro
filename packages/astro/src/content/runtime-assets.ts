import type { PluginContext } from 'rollup';
import * as z4 from 'zod/v4';
import type { ImageMetadata, OmitBrand } from '../assets/types.js';
import { emitImageMetadata } from '../assets/utils/node.js';

export function createImage(
	pluginContext: PluginContext,
	shouldEmitFile: boolean,
	entryFilePath: string,
) {
	return () => {
		return z4.string().transform(async (imagePath, ctx) => {
			const resolvedFilePath = (await pluginContext.resolve(imagePath, entryFilePath))?.id;
			const metadata = (await emitImageMetadata(
				resolvedFilePath,
				shouldEmitFile ? pluginContext.emitFile : undefined,
			)) as OmitBrand<ImageMetadata>;

			if (!metadata) {
				ctx.addIssue({
					code: 'custom',
					message: `Image ${imagePath} does not exist. Is the path correct?`,
					fatal: true,
				});

				return z4.never();
			}

			return { ...metadata, ASTRO_ASSET: metadata.fsPath };
		});
	};
}
