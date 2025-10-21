import type { PluginContext } from 'rollup';
import * as z3 from 'zod/v3';
import * as z4 from 'zod/v4';
import type { ImageMetadata, OmitBrand } from '../assets/types.js';
import { emitImageMetadata } from '../assets/utils/node/emitAsset.js';

export function createZ3Image(
	pluginContext: PluginContext,
	shouldEmitFile: boolean,
	entryFilePath: string,
) {
	return () => {
		return z3.string().transform(async (imagePath, ctx) => {
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

				return z3.never();
			}

			return { ...metadata, ASTRO_ASSET: metadata.fsPath };
		});
	};
}

export function createZ4Image(
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
