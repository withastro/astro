import sharp from './sharp.js';
import type { AstroIntegration } from 'astro';
import type { ImageProps, IntegrationOptions, LocalImageService } from './types.js';

const PKG_NAME = '@astrojs/image';
const ROUTE_PATTERN = '/_image';

function defaultFilenameFormat({ src, width, height, format }: ImageProps) {
	if (width && height) {
		return `${src}-${width}x${height}.${format}`;
	} else if (width) {
		return `${src}-${width}w.${format}`;
	} else if (height) {
		return `${src}-${height}h.${format}`;
	}

	return `${src}.${format}`;
}

export async function getImage(props: ImageProps) {
  const { searchParams, ...rest } = await sharp.getImage(props);
	return {
		...rest,
		src: `${ROUTE_PATTERN}?${searchParams.toString()}`
	}
}

const createIntegration = (options: IntegrationOptions = {}): AstroIntegration => {
	const {
		inputDir = '/src/images/',
		outputDir = '/images/',
		formats = ['webp', 'jpeg'],
		filenameFormat = defaultFilenameFormat
	} = options;


	return {
		name: PKG_NAME,
		hooks: {
			'astro:config:setup': ({ injectRoute }) => {
				// TODO: add /_images GET endpoint
				injectRoute({
					pattern: ROUTE_PATTERN,
					entryPoint: '@astrojs/image/endpoint.js'
				});
			},
			'astro:build:done': ({ dir }) => {
				// TODO: generate static images
			}
		}
	}
}

export default createIntegration;
