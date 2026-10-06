import type { AstroConfig } from '../../types/public/config.js';

type ResolvedImageServiceConfig = AstroConfig['image']['service'];

/**
 * `image.service` accepts one service, or `{ build, runtime }`. Both resolve to the runtime
 * service with an optional `build` service, so code reading `image.service.entrypoint` keeps
 * working. A `runtime` key wins over `entrypoint`/`config`, because an integration's
 * `updateConfig()` merges `{ build, runtime }` into an already resolved service.
 */
export function normalizeImageServiceInput(value: unknown): unknown {
	if (!value || typeof value !== 'object') return value;
	let service = value as Record<string, any>;
	if ('runtime' in service) {
		service = { ...service.runtime, build: service.build };
	}
	if (service.build) {
		service = { ...service, build: { config: {}, ...service.build } };
	} else if ('build' in service) {
		const { build: _, ...runtime } = service;
		service = runtime;
	}
	return service;
}

/**
 * The image service used by prerendered pages (`'build'`) or by on-demand pages and the
 * image endpoint (`'runtime'`).
 */
export function getImageServiceConfig(
	service: ResolvedImageServiceConfig,
	target: 'build' | 'runtime',
): Omit<ResolvedImageServiceConfig, 'build'> {
	const { build, ...runtime } = service;
	return target === 'build' && build ? build : runtime;
}

/** The image config as seen by the image service of `target`. */
export function getImageConfigFor(
	image: AstroConfig['image'],
	target: 'build' | 'runtime',
): AstroConfig['image'] {
	return { ...image, service: getImageServiceConfig(image.service, target) };
}
