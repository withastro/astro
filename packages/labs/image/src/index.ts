import createSharp from './sharp.js';
import type { AstroIntegration } from 'astro';
import type { ImageProps, IntegrationOptions, LocalImageService } from './types.js';

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

export function getLocalService() {
	return (globalThis as any).imageService as LocalImageService;
}

export async function getImage(props: ImageProps) {
	const src = await getLocalService().toImageSrc(props);

	if ((globalThis as any).addStaticImage) {
		(globalThis as any).addStaticImage(props);
	}

	return { src };
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
				(globalThis as any).imageService = createSharp({ routePattern });

				// TODO: add /_images GET endpoint
				injectRoute({
					pattern: routePattern,
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
