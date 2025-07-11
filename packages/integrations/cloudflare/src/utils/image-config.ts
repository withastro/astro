import type { AstroConfig, AstroIntegrationLogger, HookParameters } from 'astro';
import { passthroughImageService, sharpImageService } from 'astro/config';

export type ImageService = 'passthrough' | 'cloudflare' | 'compile' | 'custom';

export function setImageConfig(
	service: ImageService,
	config: AstroConfig['image'],
	command: HookParameters<'astro:config:setup'>['command'],
	logger: AstroIntegrationLogger,
) {
	switch (service) {
		case 'passthrough':
			return { ...config, service: passthroughImageService() };

		case 'cloudflare':
			return {
				...config,
				service:
					command === 'dev'
						? sharpImageService()
						: { entrypoint: '@astrojs/cloudflare/image-service' },
			};

		case 'compile':
			return {
				...config,
				service: sharpImageService(),
				endpoint: {
					entrypoint: command === 'dev' ? undefined : '@astrojs/cloudflare/image-endpoint',
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
