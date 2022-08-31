import type { AstroConfig } from 'astro';
import MagicString from 'magic-string';
import fs from 'node:fs/promises';
import path, { basename, extname, join } from 'node:path';
import { Readable } from 'node:stream';
import { fileURLToPath, pathToFileURL } from 'node:url';
import slash from 'slash';
import type { Plugin, ResolvedConfig } from 'vite';
import type { IntegrationOptions } from './index.js';
import type { InputFormat } from './loaders/index.js';
import sharp from './loaders/sharp.js';
import { metadata } from './utils/metadata.js';

export interface ImageMetadata {
	src: string;
	width: number;
	height: number;
	format: InputFormat;
}

export function createPlugin(config: AstroConfig, options: Required<IntegrationOptions>): Plugin {
	const filter = (id: string) =>
		/^(?!\/_image?).*.(heic|heif|avif|jpeg|jpg|png|tiff|webp|gif)$/.test(id);

	const virtualModuleId = 'virtual:image-loader';

	let resolvedConfig: ResolvedConfig;

	return {
		name: '@astrojs/image',
		enforce: 'pre',
		configResolved(viteConfig) {
			resolvedConfig = viteConfig;
		},
		async resolveId(id) {
			// The virtual model redirects imports to the ImageService being used
			// This ensures the module is available in `astro dev` and is included
			// in the SSR server bundle.
			if (id === virtualModuleId) {
				return await this.resolve(options.serviceEntryPoint);
			}
		},
		async load(id) {
			// only claim image ESM imports
			if (!filter(id)) {
				return null;
			}

			const url = pathToFileURL(id);

			const meta = await metadata(url);

			if (!meta) {
				return;
			}

			if (!this.meta.watchMode) {
				const filename = basename(url.pathname, extname(url.pathname)) + `.${meta.format}`;

				const handle = this.emitFile({
					name: filename,
					source: await fs.readFile(url),
					type: 'asset',
				});

				meta.src = `__ASTRO_IMAGE_ASSET__${handle}__`;
			} else {
				const relId = path.relative(fileURLToPath(config.srcDir), id);

				meta.src = join('/@astroimage', relId);

				// Windows compat
				meta.src = slash(meta.src);
			}

			return `export default ${JSON.stringify(meta)}`;
		},
		configureServer(server) {
			server.middlewares.use(async (req, res, next) => {
				if (req.url?.startsWith('/@astroimage/')) {
					const [, id] = req.url.split('/@astroimage/');

					const url = new URL(id, config.srcDir);
					const file = await fs.readFile(url);

					const meta = await metadata(url);

					if (!meta) {
						return next();
					}

					const transform = await sharp.parseTransform(url.searchParams);

					if (!transform) {
						return next();
					}

					const result = await sharp.transform(file, transform);

					res.setHeader('Content-Type', `image/${result.format}`);
					res.setHeader('Cache-Control', 'max-age=360000');

					const stream = Readable.from(result.data);
					return stream.pipe(res);
				}

				return next();
			});
		},
		async renderChunk(code) {
			const assetUrlRE = /__ASTRO_IMAGE_ASSET__([a-z\d]{8})__(?:_(.*?)__)?/g;

			let match;
			let s;
			while ((match = assetUrlRE.exec(code))) {
				s = s || (s = new MagicString(code));
				const [full, hash, postfix = ''] = match;

				const file = this.getFileName(hash);
				const outputFilepath = resolvedConfig.base + file + postfix;

				s.overwrite(match.index, match.index + full.length, outputFilepath);
			}

			if (s) {
				return {
					code: s.toString(),
					map: resolvedConfig.build.sourcemap ? s.generateMap({ hires: true }) : null,
				};
			} else {
				return null;
			}
		},
	};
}
