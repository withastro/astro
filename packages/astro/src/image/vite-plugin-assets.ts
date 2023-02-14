import mime from 'mime';
import fs from 'node:fs/promises';
import { Readable } from 'node:stream';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type * as vite from 'vite';
import type { AstroPluginOptions } from '../@types/astro';
import { VIRTUAL_MODULE_ID, VIRTUAL_SERVICE_ID } from './consts.js';
import { isLocalService } from './services/service.js';
import { imageMetadata } from './utils/metadata.js';
import { getOrigQueryParams } from './utils/queryParams.js';

const resolvedVirtualModuleId = '\0' + VIRTUAL_MODULE_ID;

export default function assets({ settings, logging }: AstroPluginOptions): vite.Plugin[] {
	return [
		{
			name: 'astro:assets',
			async resolveId(id) {
				if (id === VIRTUAL_SERVICE_ID) {
					return await this.resolve(settings.config.image.service);
				}
				if (id === VIRTUAL_MODULE_ID) {
					return resolvedVirtualModuleId;
				}
			},
			load(id) {
				if (id === resolvedVirtualModuleId) {
					return `
					export { getImage } from "astro/image";
					export { Image } from "astro/components";
				`;
				}
			},
		},
		{
			name: 'astro:assets:esm',
			enforce: 'pre',
			async load(id) {
				if (/\.(heic|heif|avif|jpeg|jpg|png|tiff|webp|gif)$/.test(id)) {
					const url = pathToFileURL(id);
					const meta = await imageMetadata(url);

					if (!meta) {
						return;
					}

					if (!this.meta.watchMode) {
					} else {
						// Pass the original file information through query params so we don't have to load the file twice
						url.searchParams.append('origWidth', meta.width.toString());
						url.searchParams.append('origHeight', meta.height.toString());
						url.searchParams.append('origFormat', meta.format);

						meta.src = url.toString();
					}

					return `export default ${JSON.stringify(meta)}`;
				}
			},
			// Handle serving images during development
			configureServer(server) {
				server.middlewares.use(async (req, res, next) => {
					if (req.url?.startsWith('/_image')) {
						// If the currently configured service isn't a local service, we don't need to do anything here.
						// TODO: Support setting a specific service through a prop on Image / a parameter in getImage
						if (!isLocalService(globalThis.astroImageService)) {
							return next();
						}

						const url = new URL(req.url.slice('/_image'.length), 'file:');
						const filePath = url.searchParams.get('href');

						if (!filePath) {
							return next();
						}

						const filePathURL = new URL(filePath);
						const file = await fs.readFile(filePathURL.pathname);

						// Get the file's metadata from the URL
						const meta = getOrigQueryParams(filePathURL.searchParams);

						if (!meta) {
							return next();
						}

						const transform = await globalThis.astroImageService.parseParams(url.searchParams);

						// if no transforms were added, the original file will be returned as-is
						let data = file;
						let format = meta.format;

						if (transform) {
							const result = await globalThis.astroImageService.transform(file, transform);
							data = result.data;
							format = result.format;
						}

						res.setHeader('Content-Type', mime.getType(fileURLToPath(url)) || `image/${format}`);
						res.setHeader('Cache-Control', 'max-age=360000');

						const stream = Readable.from(data);
						return stream.pipe(res);
					}

					return next();
				});
			},
		},
	];
}
