import type { AstroConfig, AstroIntegrationLogger, HookParameters } from 'astro';
import { passthroughImageService, sharpImageService } from 'astro/config';

export type ImageService =
	| 'passthrough'
	| 'cloudflare'
	| 'cloudflare-binding'
	| 'compile'
	| 'custom';

export function setImageConfig(
	service: ImageService,
	config: AstroConfig['image'],
	command: HookParameters<'astro:config:setup'>['command'],
	logger: AstroIntegrationLogger,
) {
	const clonedConfig = structuredClone(config);

	if (command === 'dev' && clonedConfig.endpoint.entrypoint === undefined) {
		clonedConfig.endpoint.entrypoint = '@astrojs/cloudflare/image-endpoint';
	}

	switch (service) {
		case 'passthrough':
			return { ...clonedConfig, service: passthroughImageService() };

		case 'cloudflare':
			return {
				...clonedConfig,
				service:
					command === 'dev'
						? sharpImageService()
						: { entrypoint: '@astrojs/cloudflare/image-service' },
			};
		case 'cloudflare-binding':
			return {
				...clonedConfig,
				endpoint: {
					entrypoint: '@astrojs/cloudflare/image-transform-endpoint',
				},
			};

		case 'compile':
			return {
				...clonedConfig,
				service: sharpImageService(),
				endpoint: {
					entrypoint: '@astrojs/cloudflare/image-endpoint',
				},
			};

		case 'custom':
			return { ...clonedConfig };

		default:
			if (clonedConfig.service.entrypoint === 'astro/assets/services/sharp') {
				logger.warn(
					`The current configuration does not support image optimization. To allow your project to build with the original, unoptimized images, the image service has been automatically switched to the 'passthrough' option. See https://docs.astro.build/en/reference/configuration-reference/#imageservice`,
				);
				return { ...clonedConfig, service: passthroughImageService() };
			}
			return { ...clonedConfig };
	}
}
