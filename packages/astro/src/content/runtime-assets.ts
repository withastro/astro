import type { PluginContext } from 'rollup';
import { z } from 'zod';
import type { AstroSettings } from '../@types/astro.js';
import { emitESMImage } from '../assets/index.js';

export function createImage(
	settings: AstroSettings,
	pluginContext: PluginContext,
	entryFilePath: string
) {
	if (!settings.config.experimental.assets) {
		throw new Error('Enable `experimental.assets` in your Astro config to use image()');
	}

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

				return z.NEVER;
			}

			return metadata;
		});
	};
}
