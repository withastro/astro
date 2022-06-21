import fs from 'fs/promises';
import sharp from 'sharp';
import loader from './loaders/sharp.js';
import type { Plugin, ResolvedConfig } from 'vite';
import type { AstroConfig } from 'astro';
import type { IntegrationOptions } from './types.js';

export function createPlugin(config: AstroConfig, options: IntegrationOptions): Plugin {
	const filter = (id: string) => /^(?!\/_image?).*.(heic|heif|avif|jpeg|jpg|png|tiff|webp|gif)$/.test(id);

	let resolvedConfig: ResolvedConfig;
	console.log('createPlugin');

	return {
		name: '@astrojs/image',
		enforce: 'pre',
		configResolved(config) {
			resolvedConfig = config;
		},
		async load(id) {
			if (!filter(id)) { return null; }

			const sharpImage = sharp(id);
			const metadata = await sharpImage.metadata();

			const aspectRatio = metadata.width && metadata.height && metadata.width / metadata.height;

			const src = resolvedConfig.isProduction
				?  id.replace(config.srcDir.pathname, '/')
				: id;

			const output = {
				src,
				width: metadata.width,
				height: metadata.height,
				aspectRatio,
				format: metadata.format
			};

			if (resolvedConfig.isProduction) {
				this.emitFile({
					fileName: output.src.replace(/^\//, ''),
					source: await fs.readFile(id),
					type: 'asset',
				});
			}

			return `export default ${JSON.stringify(output)}`;
		}
	}
}
