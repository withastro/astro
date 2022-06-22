import fs from 'fs/promises';
import path from 'path';
import sharp from './loaders/sharp.js';
import { ensureDir } from './utils.js';
import { createPlugin } from './vite-plugin-astro-image.js';
import type { AstroConfig, AstroIntegration } from 'astro';
import type { ImageProps, IntegrationOptions, SSRImageService } from './types.js';

const PKG_NAME = '@astrojs/image';
const ROUTE_PATTERN = '/_image';
const OUTPUT_DIR = '/_image';

function calculateSize(props: ImageProps) {
	if ((props.width && props.height) || !props.aspectRatio) {
		return {
			width: props.width,
			height: props.height
		};
	}

	let aspectRatio: number;

	if (typeof props.aspectRatio === 'number') {
		aspectRatio = props.aspectRatio;
	} else {
		const [width, height] = props.aspectRatio.split(':');
		aspectRatio = parseInt(width) / parseInt(height);
	}

	if (props.width) {
		return {
			width: props.width,
			height: props.width / aspectRatio
		};
	}

	return {
		width: props.height! * aspectRatio,
		height: props.height!
	}
}

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

export async function getImage(loader: SSRImageService, props: ImageProps) {
	(globalThis as any).loader = loader;

	const computedProps = { ...props, ...calculateSize(props) };

  const { searchParams, ...rest } = await loader.getImage(computedProps);

	if (globalThis && (globalThis as any).addStaticImage) {
		(globalThis as any)?.addStaticImage(computedProps);
	}
	const src = globalThis && (globalThis as any).filenameFormat
		? (globalThis as any).filenameFormat(computedProps, searchParams)
		: `${ROUTE_PATTERN}?${searchParams.toString()}`;

	return {
		...rest,
		src
	}
}

const createIntegration = (options: IntegrationOptions = {}): AstroIntegration => {
	const resolvedOptions = {
		filenameFormat: defaultFilenameFormat,
		loaderEntryPoint: '@astrojs/image/sharp',
		...options
	};

	const staticImages = new Map<string, ImageProps>();
	let _config: AstroConfig;

	function getViteConfiguration() {
		return {
			plugins: [
				createPlugin(_config, resolvedOptions)
			]
		}
	}

	return {
		name: PKG_NAME,
		hooks: {
			'astro:config:setup': ({ command, config, injectRoute, updateConfig }) => {
				_config = config;
				const mode = command === 'dev' || config.adapter ? 'ssr' : 'ssg';

				updateConfig({ vite: getViteConfiguration() });

				(globalThis as any).addStaticImage = (props: ImageProps) => {
					staticImages.set(resolvedOptions.filenameFormat(props), props);
				}

				(globalThis as any).filenameFormat = (props: ImageProps, searchParams: URLSearchParams) => {
					if (mode === 'ssg') {
						return path.join(OUTPUT_DIR, path.dirname(props.src), path.basename(resolvedOptions.filenameFormat(props)));
					} else {
						return `${ROUTE_PATTERN}?${searchParams.toString()}`;
					}
				}

				if (mode === 'ssr') {
					injectRoute({
						pattern: ROUTE_PATTERN,
						entryPoint: command === 'dev' ? '@astrojs/image/dev-endpoint.js' : '@astrojs/image/endpoint.js'
					});
				}
			},
			'astro:build:done': async ({ dir }) => {
				for await (const [_, props] of staticImages) {
					// load and transform the input file
					const pathname = path.join(_config.srcDir.pathname, props.src.replace(/^\/image/, ''));
					const inputBuffer = await fs.readFile(pathname);
					const { data } = await sharp.toBuffer(inputBuffer, props);

					// output to dist
					const outputFile = path.join(dir.pathname, OUTPUT_DIR, resolvedOptions.filenameFormat(props));
					ensureDir(path.dirname(outputFile));
					await fs.writeFile(outputFile, data);
				}
			}
		}
	}
}

export default createIntegration;
