import fs from 'fs/promises';

import type { Plugin, ResolvedConfig } from 'vite';
import type { AstroConfig } from 'astro';
import type { ImageService, IntegrationOptions } from './types.js';

export function createPlugin(config: AstroConfig, options: Required<IntegrationOptions>): Plugin {
	const filter = (id: string) => /^(?!\/_image?).*.(heic|heif|avif|jpeg|jpg|png|tiff|webp|gif)$/.test(id);

	const virtualModuleId = 'virtual:image-loader';

	let resolvedConfig: ResolvedConfig;
	let loaderModuleId: string;
	let loader: ImageService;

	return {
		name: '@astrojs/image',
		enforce: 'pre',
		async configResolved(config) {
			resolvedConfig = config;
		},
		async resolveId(id) {
			// The virtual model redirects imports to the ImageService being used
			// This ensures the module is available in `astro dev` and is included
			// in the SSR server bundle.
			if (id === virtualModuleId) {
				if (!loaderModuleId) {
					const module = await this.resolve(options.serviceEntryPoint);
					if (!module) {
						throw new Error(`"${options.serviceEntryPoint}" could not be found`);
					}
					loaderModuleId = module.id;
				}
				return loaderModuleId;
			}
		},
		async load(id) {
			// only claim image ESM imports
			if (!filter(id)) { return null; }

			if (!loader) {
				const module = await import(loaderModuleId);
				loader = module.default;
			}

			const meta = await loader.getImageMetadata(id);

			const src = resolvedConfig.isProduction
				?  id.replace(config.srcDir.pathname, '/')
				: id;

			const output = {
				...meta,
				src,
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
	};
}
