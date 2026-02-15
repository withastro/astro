import type { AstroConfig, AstroIntegrationLogger, HookParameters } from 'astro';
import { passthroughImageService, sharpImageService } from 'astro/config';

export type ImageService =
	| 'passthrough'
	| 'cloudflare'
	| 'cloudflare-binding'
	| 'compile'
	| 'custom';

// The default Astro dev image endpoint uses node:fs which is unavailable in workerd.
// Use the generic endpoint instead, which loads images via fetch through the dev server.
const GENERIC_ENDPOINT = { entrypoint: 'astro/assets/endpoint/generic' };

export function setImageConfig(
	service: ImageService,
	config: AstroConfig['image'],
	command: HookParameters<'astro:config:setup'>['command'],
	logger: AstroIntegrationLogger,
) {
	switch (service) {
		case 'passthrough':
			return {
				...config,
				service: passthroughImageService(),
				endpoint: command === 'dev' ? GENERIC_ENDPOINT : config.endpoint,
			};

		case 'cloudflare':
			if (command === 'dev') {
				return { ...config, service: passthroughImageService(), endpoint: GENERIC_ENDPOINT };
			}
			return {
				...config,
				service: { entrypoint: '@astrojs/cloudflare/image-service' },
			};

		case 'cloudflare-binding':
			return {
				...config,
				endpoint: {
					entrypoint: '@astrojs/cloudflare/image-transform-endpoint',
				},
			};

		case 'compile':
			if (command === 'dev') {
				return { ...config, service: passthroughImageService(), endpoint: GENERIC_ENDPOINT };
			}
			return {
				...config,
				service: sharpImageService(),
				endpoint: {
					entrypoint: '@astrojs/cloudflare/image-endpoint',
				},
			};

		case 'custom':
			return { ...config };

		default:
			if (config.service.entrypoint === 'astro/assets/services/sharp') {
				logger.warn(
					`The current configuration does not support image optimization. To allow your project to build with the original, unoptimized images, the image service has been automatically switched to the 'passthrough' option. See https://docs.astro.build/en/reference/configuration-reference/#imageservice`,
				);
				return { ...config, service: passthroughImageService() };
			}
			return { ...config };
	}
}
