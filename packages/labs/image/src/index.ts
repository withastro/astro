import fs from 'fs/promises';
import path from 'path';
import sharp from './sharp.js';
import { ensureDir } from './utils.js';
import type { AstroConfig, AstroIntegration } from 'astro';
import type { ImageProps, IntegrationOptions } from './types.js';

const PKG_NAME = '@astrojs/image';
const ROUTE_PATTERN = '/_image';

function defaultFilenameFormat({ src, width, height, format }: ImageProps) {
	const ext = path.extname(src);
	let filename = src.replace(ext, '');

	if (width && height) {
		return `${filename}_${width}x${height}.${format}`;
	} else if (width) {
		return `${filename}_${width}w.${format}`;
	} else if (height) {
		return `${filename}_${height}h.${format}`;
	}

	return src.replace(ext, format);
}

export async function getImage(props: ImageProps) {
  const { searchParams, ...rest } = await sharp.getImage(props);

	if (globalThis && (globalThis as any).addStaticImage) {
		(globalThis as any)?.addStaticImage(props);
	}
	const src = globalThis && (globalThis as any).filenameFormat
		? (globalThis as any).filenameFormat(props, searchParams)
		: `${ROUTE_PATTERN}?${searchParams.toString()}`;

	return {
		...rest,
		src
	}
}

const createIntegration = (options: IntegrationOptions = {}): AstroIntegration => {
	const {
		outputDir = '/images/',
		filenameFormat = defaultFilenameFormat
	} = options;

	const staticImages = new Map<string, ImageProps>();
	let _config: AstroConfig;

	return {
		name: PKG_NAME,
		hooks: {
			'astro:config:setup': ({ command, config, injectRoute }) => {
				_config = config;
				const mode = command === 'dev' || config.adapter ? 'ssr' : 'ssg';

				(globalThis as any).addStaticImage = (props: ImageProps) => {
					if (mode === 'ssg') {
						staticImages.set(filenameFormat(props), props);
					}
				}

				(globalThis as any).filenameFormat = (props: ImageProps, searchParams: URLSearchParams) => {
					if (mode === 'ssg') {
						return path.join(outputDir, path.dirname(props.src), path.basename(filenameFormat(props)));
					} else {
						return `${ROUTE_PATTERN}?${searchParams.toString()}`;
					}
				}

				if (mode === 'ssr') {
					injectRoute({
						pattern: ROUTE_PATTERN,
						entryPoint: '@astrojs/image/endpoint.js'
					});
				}
			},
			'astro:build:done': async ({ dir }) => {
				for await (const [filename, props] of staticImages) {
					const inputBuffer = await fs.readFile(path.join(_config.publicDir.pathname, props.src));
					const { data } = await sharp.toBuffer(inputBuffer, props);
					const outputFile = path.join(dir.pathname, outputDir, filenameFormat(props));
					ensureDir(path.dirname(outputFile));
					await fs.writeFile(outputFile, data);
				}
			}
		}
	}
}

export default createIntegration;
