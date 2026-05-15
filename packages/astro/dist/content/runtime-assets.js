import * as z from 'zod/v4';
import { emitClientAsset } from '../assets/utils/assets.js';
import { emitImageMetadata } from '../assets/utils/node.js';
function createImage(pluginContext, shouldEmitFile, entryFilePath) {
	return () => {
		return z.string().transform(async (imagePath, ctx) => {
			const resolvedFilePath = (await pluginContext.resolve(imagePath, entryFilePath))?.id;
			const metadata = await emitImageMetadata(
				resolvedFilePath,
				shouldEmitFile ? (opts) => emitClientAsset(pluginContext, opts) : void 0,
			);
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
export { createImage };
