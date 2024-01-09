import type { AstroConfig, AstroIntegrationLogger } from 'astro';
import { passthroughImageService, sharpImageService } from 'astro/config';

export function prepareImageConfig(
	service: string,
	config: AstroConfig['image'],
	command: 'dev' | 'build' | 'preview',
	logger: AstroIntegrationLogger
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
				endpoint: command === 'dev' ? undefined : '@astrojs/cloudflare/image-endpoint',
			};

		default:
			if (
				config.service.entrypoint === 'astro/assets/services/sharp' ||
				config.service.entrypoint === 'astro/assets/services/squoosh'
			) {
				logger.warn(
					`The current configuration does not support image optimization. To allow your project to build with the original, unoptimized images, the image service has been automatically switched to the 'noop' option. See https://docs.astro.build/en/reference/configuration-reference/#imageservice`
				);
				return { ...config, service: passthroughImageService() };
			}
			return { ...config };
	}
}
