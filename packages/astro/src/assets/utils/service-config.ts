import type { AstroConfig } from '../../types/public/config.js';

type ResolvedImageService = AstroConfig['image']['service'];
type ResolvedImageServiceConfig = Extract<ResolvedImageService, { entrypoint: string }>;

/** The image config as seen by one image service: `service` is that service. */
export type TargetImageConfig = Omit<AstroConfig['image'], 'service'> & {
	service: ResolvedImageServiceConfig;
};

/**
 * The image service used by prerendered pages (`'build'`) or by on-demand pages and the
 * image endpoint (`'runtime'`). `image.service` is either one service for both, or
 * `{ build, runtime }`.
 */
export function getImageServiceConfig(
	service: ResolvedImageService,
	target: 'build' | 'runtime',
): ResolvedImageServiceConfig {
	const resolved = 'runtime' in service ? service[target] : service;
	// The schema defaults `config` once, so a service set by an integration may not have it.
	return { ...resolved, config: resolved.config ?? {} };
}

/** The image config as seen by the image service of `target`. */
export function getImageConfigFor(
	image: AstroConfig['image'],
	target: 'build' | 'runtime',
): TargetImageConfig {
	return { ...image, service: getImageServiceConfig(image.service, target) };
}
