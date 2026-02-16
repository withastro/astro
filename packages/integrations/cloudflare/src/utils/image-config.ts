import type { AstroConfig, AstroIntegrationLogger, HookParameters } from 'astro';
import { passthroughImageService } from 'astro/config';

export type ImageServiceMode =
	| 'passthrough'
	| 'cloudflare'
	| 'cloudflare-binding'
	| 'compile'
	| 'custom';

export type ImageServiceConfig =
	| ImageServiceMode
	| {
			build: 'compile';
			runtime?: 'passthrough' | 'cloudflare-binding';
	  };

/** Normalize string | compound config into separate build/runtime modes. */
export function normalizeImageServiceConfig(config: ImageServiceConfig | undefined): {
	buildService: ImageServiceMode;
	runtimeService: ImageServiceMode;
} {
	if (!config || typeof config === 'string') {
		const mode = config ?? 'cloudflare-binding';
		// `compile` is build-only; at runtime, serve pre-compiled static assets
		return {
			buildService: mode,
			runtimeService: mode === 'compile' ? 'passthrough' : mode,
		};
	}
	// Compound config: { build: 'compile', runtime?: ... }
	return {
		buildService: 'compile',
		runtimeService: config.runtime ?? 'passthrough',
	};
}

// The default Astro dev image endpoint uses node:fs which is unavailable in workerd.
// Use the generic endpoint instead, which loads images via fetch through the dev server.
const GENERIC_ENDPOINT = { entrypoint: 'astro/assets/endpoint/generic' };

// Workerd-compatible image service stub: baseService (no sharp) + passthrough transform.
// Used by both `compile` and `cloudflare-binding` for URL generation in workerd.
const WORKERD_IMAGE_SERVICE = { entrypoint: '@astrojs/cloudflare/image-service-workerd' };

export function setImageConfig(
	service: ImageServiceConfig | undefined,
	config: AstroConfig['image'],
	command: HookParameters<'astro:config:setup'>['command'],
	logger: AstroIntegrationLogger,
) {
	const { buildService, runtimeService } = normalizeImageServiceConfig(service);

	switch (buildService) {
		case 'passthrough':
			return {
				...config,
				service: passthroughImageService(),
				endpoint: command === 'dev' ? GENERIC_ENDPOINT : config.endpoint,
			};

		case 'cloudflare':
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
						: GENERIC_ENDPOINT,
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
