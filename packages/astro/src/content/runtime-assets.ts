import type { PluginContext } from 'rollup';
import { z } from 'zod';
import type { AstroSettings } from '../@types/astro.js';
import { emitESMImage } from '../assets/index.js';

export function createImage(
	settings: Pick<AstroSettings, 'config'>,
	pluginContext: PluginContext,
	entryFilePath: string
) {
	return () => {
		return z.string().transform(async (imagePath, ctx) => {
			const resolvedFilePath = (await pluginContext.resolve(imagePath, entryFilePath))?.id;
			const metadata = await emitESMImage(
				resolvedFilePath,
				pluginContext.meta.watchMode,
				pluginContext.emitFile,
				settings
			);

			if (!metadata) {
				ctx.addIssue({
					code: 'custom',
					message: `Image ${imagePath} does not exist. Is the path correct?`,
					fatal: true,
				});

				return z.never();
			}

			return metadata;
		});
	};
}
