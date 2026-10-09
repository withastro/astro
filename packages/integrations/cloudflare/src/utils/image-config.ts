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
	  }
	| {
			build: 'cloudflare-binding';
			runtime?: 'cloudflare-binding' | 'passthrough';
	  };

/** Normalize string | compound config into separate build/runtime modes.
 *  `transformAtBuild` is true for compound config and for the `compile` and
 *  `cloudflare-binding` string modes, including the default. */
export function normalizeImageServiceConfig(config: ImageServiceConfig | undefined): {
	buildService: ImageServiceMode;
	runtimeService: ImageServiceMode;
	transformAtBuild: boolean;
} {
	if (!config || typeof config === 'string') {
		const mode = config ?? 'cloudflare-binding';
		// `compile` is build-only; at runtime, serve pre-compiled static assets
		return {
			buildService: mode,
			runtimeService: mode === 'compile' ? 'passthrough' : mode,
			transformAtBuild: mode === 'compile' || mode === 'cloudflare-binding',
		};
	}
	// Compound config: user explicitly opts in to build-time transforms.
	return {
		buildService: config.build,
		runtimeService: config.runtime ?? (config.build === 'compile' ? 'passthrough' : config.build),
		transformAtBuild: true,
	};
}

// The default Astro dev image endpoint uses node:fs which is unavailable in workerd.
// Use the generic endpoint instead, which loads images via fetch through the dev server.
const GENERIC_ENDPOINT = { entrypoint: 'astro/assets/endpoint/generic' };

// Passthrough endpoint that serves original images via the ASSETS binding.
const CLOUDFLARE_PASSTHROUGH_ENDPOINT = {
	entrypoint: '@astrojs/cloudflare/image-passthrough-endpoint',
};

// Workerd-compatible image service stub: baseService (no sharp) + passthrough transform.
// Used by both `compile` and `cloudflare-binding` for URL generation in workerd.
const WORKERD_IMAGE_SERVICE = { entrypoint: '@astrojs/cloudflare/image-service-workerd' };

// Build image service of `cloudflare-binding`: Sharp, with transforms sent to the IMAGES binding.
const BINDING_BUILD_IMAGE_SERVICE = { entrypoint: '@astrojs/cloudflare/image-service-binding' };

const SHARP_IMAGE_SERVICE = 'astro/assets/services/sharp';

// Build image service of `compile` when the user didn't configure one.
const COMPILE_BUILD_IMAGE_SERVICE = { entrypoint: SHARP_IMAGE_SERVICE };

/** The service that renders on-demand pages: `image.service` is one service or `{ build, runtime }`. */
export function getRuntimeImageService(
	service: AstroConfig['image']['service'],
): Extract<AstroConfig['image']['service'], { entrypoint: string }> {
	return 'runtime' in service ? service.runtime : service;
}

// Whether `image.service` was configured by the user, rather than being Astro's default Sharp service.
function hasUserImageService(config: AstroConfig['image']): boolean {
	return 'runtime' in config.service || config.service.entrypoint !== SHARP_IMAGE_SERVICE;
}

export function setImageConfig(
	service: ImageServiceConfig | undefined,
	config: AstroConfig['image'],
	command: HookParameters<'astro:config:setup'>['command'],
	logger: AstroIntegrationLogger,
) {
	const { buildService, runtimeService } = normalizeImageServiceConfig(service);
	const runtimeEntrypoint = config.service && getRuntimeImageService(config.service).entrypoint;

	switch (buildService) {
		case 'passthrough':
			return {
				...config,
				service: passthroughImageService(),
				endpoint: command === 'dev' ? GENERIC_ENDPOINT : CLOUDFLARE_PASSTHROUGH_ENDPOINT,
			};

		case 'cloudflare':
			// The external Cloudflare image service generates `/cdn-cgi/image/...` URLs,
			// which only work on Cloudflare's production edge network. In dev mode,
			// fall back to passthrough so images render normally without transformation.
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
			// Dev always transforms through the IMAGES binding. At runtime, the compound
			// config `{ build: 'cloudflare-binding', runtime: 'passthrough' }` serves
			// original images instead of transforming on demand.
			return {
				...config,
				service: { build: BINDING_BUILD_IMAGE_SERVICE, runtime: WORKERD_IMAGE_SERVICE },
				endpoint:
					command === 'dev' || runtimeService === 'cloudflare-binding'
						? { entrypoint: '@astrojs/cloudflare/image-transform-endpoint' }
						: CLOUDFLARE_PASSTHROUGH_ENDPOINT,
			};

		case 'compile': {
			// A user-defined passthroughImageService() disables the incompatible Cloudflare image service.
			if (runtimeEntrypoint === passthroughImageService().entrypoint) {
				return { ...config, endpoint: CLOUDFLARE_PASSTHROUGH_ENDPOINT };
			}
			// Dev: IMAGES binding (via Cloudflare Vite plugin) for real transforms.
			// Build: endpoint depends on runtime - `cloudflare-binding` uses IMAGES, `passthrough` uses generic.
			const endpoint =
				command === 'dev' || runtimeService === 'cloudflare-binding'
					? { entrypoint: '@astrojs/cloudflare/image-transform-endpoint' }
					: CLOUDFLARE_PASSTHROUGH_ENDPOINT;
			// The user's image service runs everywhere, as it would without the adapter.
			if (hasUserImageService(config)) {
				return { ...config, endpoint };
			}
			// Otherwise, pages render with the workerd stub, and prerendered images are generated
			// in Node with Sharp.
			return {
				...config,
				service: { build: COMPILE_BUILD_IMAGE_SERVICE, runtime: WORKERD_IMAGE_SERVICE },
				endpoint,
			};
		}

		case 'custom':
			// Sharp's native binding cannot load inside workerd, in dev or in production.
			// This also catches `imageService: 'custom'` without a configured `image.service`,
			// which silently inherits Astro's default Sharp service.
			if (command === 'dev' && runtimeEntrypoint === SHARP_IMAGE_SERVICE) {
				logger.warn(
					`The Sharp image service cannot run inside the workerd runtime, so '/_image' requests will fail in dev and production. Configure a workerd-compatible 'image.service', or set 'imageService' to 'compile' for build-time optimization. See https://docs.astro.build/en/guides/integrations-guide/cloudflare/#imageservice`,
				);
			}
			return {
				...config,
				// Astro's default dev endpoint imports `vite` and `node:fs`, which are
				// unavailable in workerd. Use the generic (fetch-based) endpoint instead.
				...(command === 'dev' && !config.endpoint?.entrypoint && { endpoint: GENERIC_ENDPOINT }),
			};

		default:
			if (runtimeEntrypoint === SHARP_IMAGE_SERVICE) {
				logger.warn(
					`The current configuration does not support image optimization. To allow your project to build with the original, unoptimized images, the image service has been automatically switched to the 'passthrough' option. See https://docs.astro.build/en/reference/configuration-reference/#imageservice`,
				);
				return {
					...config,
					service: passthroughImageService(),
					...(command === 'dev' && !config.endpoint?.entrypoint && { endpoint: GENERIC_ENDPOINT }),
				};
			}
			return {
				...config,
				...(command === 'dev' && !config.endpoint?.entrypoint && { endpoint: GENERIC_ENDPOINT }),
			};
	}
}
