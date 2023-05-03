import type { ImageServiceConfig } from '../@types/astro.js';

export { getConfiguredImageService, getImage } from './internal.js';
export { baseService, isLocalService } from './services/service.js';
export { type LocalImageProps, type RemoteImageProps } from './types.js';
export { emitESMImage } from './utils/emitAsset.js';
export { imageMetadata } from './utils/metadata.js';

export function sharpImageService(): ImageServiceConfig {
	return {
		entrypoint: 'astro/assets/services/sharp',
		config: {},
	};
}

export function squooshImageService(): ImageServiceConfig {
	return {
		entrypoint: 'astro/assets/services/squoosh',
		config: {},
	};
}
