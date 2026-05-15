import { passthroughImageService } from 'astro/config';
function normalizeImageServiceConfig(config) {
	if (!config || typeof config === 'string') {
		const mode = config ?? 'cloudflare-binding';
		return {
			buildService: mode,
			runtimeService: mode === 'compile' ? 'passthrough' : mode,
		};
	}
	return {
		buildService: 'compile',
		runtimeService: config.runtime ?? 'passthrough',
	};
}
const GENERIC_ENDPOINT = { entrypoint: 'astro/assets/endpoint/generic' };
const CLOUDFLARE_PASSTHROUGH_ENDPOINT = {
	entrypoint: '@astrojs/cloudflare/image-passthrough-endpoint',
};
const WORKERD_IMAGE_SERVICE = { entrypoint: '@astrojs/cloudflare/image-service-workerd' };
function setImageConfig(service, config, command, logger) {
	const { buildService, runtimeService } = normalizeImageServiceConfig(service);
	switch (buildService) {
		case 'passthrough':
			return {
				...config,
				service: passthroughImageService(),
				endpoint: command === 'dev' ? GENERIC_ENDPOINT : CLOUDFLARE_PASSTHROUGH_ENDPOINT,
			};
		case 'cloudflare':
			if (command === 'dev') {
				return {
					...config,
					service: passthroughImageService(),
					endpoint: GENERIC_ENDPOINT,
				};
			}
			return {
				...config,
				service: { entrypoint: '@astrojs/cloudflare/image-service' },
			};
		case 'cloudflare-binding':
			return {
				...config,
				service: WORKERD_IMAGE_SERVICE,
				endpoint: {
					entrypoint: '@astrojs/cloudflare/image-transform-endpoint',
				},
			};
		case 'compile':
			return {
				...config,
				service: WORKERD_IMAGE_SERVICE,
				// Dev: IMAGES binding (via Cloudflare Vite plugin) for real transforms.
				// Build: endpoint depends on runtime - `cloudflare-binding` uses IMAGES, `passthrough` uses generic.
				endpoint:
					command === 'dev' || runtimeService === 'cloudflare-binding'
						? { entrypoint: '@astrojs/cloudflare/image-transform-endpoint' }
						: CLOUDFLARE_PASSTHROUGH_ENDPOINT,
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
export { normalizeImageServiceConfig, setImageConfig };
