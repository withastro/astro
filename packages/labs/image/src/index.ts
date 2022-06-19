import type { AstroIntegration } from 'astro';

export type ImageFormat =
	| 'avif'
	| 'jpeg'
	| 'png'
	| 'webp';

export type FilenameFormatter = (src: string, width: string, format: ImageFormat) => string;

export interface IntegrationOptions {
	inputDirectory?: string;
	outputDirectory?: string;
	formats?: ImageFormat[];
	filenameFormat?: FilenameFormatter;
}

const PKG_NAME = '@astrojs/image';

function defaultFilenameFormat(src: string, width: string, format: string) {
	return `${src}-${width}w.${format}`;
}

const createIntegration = (options: IntegrationOptions = {}): AstroIntegration => {
	const {
		inputDirectory = '/src/images/',
		outputDirectory = '/images/',
		formats = ['webp', 'jpeg'],
		filenameFormat = defaultFilenameFormat
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
