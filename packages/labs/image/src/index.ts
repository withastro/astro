import type { AstroIntegration } from 'astro';
import type { ImageProps, IntegrationOptions } from './types.js';

const PKG_NAME = '@astrojs/image';

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

const createIntegration = (options: IntegrationOptions = {}): AstroIntegration => {
	const {
		inputDir = '/src/images/',
		outputDir = '/images/',
		formats = ['webp', 'jpeg'],
		filenameFormat = defaultFilenameFormat,
		routePattern = '/_image'
	} = options;

	return {
		name: PKG_NAME,
		hooks: {
			'astro:config:setup': ({ injectRoute }) => {
				// TODO: add /_images GET endpoint
			},
			'astro:build:done': ({ dir }) => {
				// TODO: generate static images
			}
		}
	}
}

export default createIntegration;
