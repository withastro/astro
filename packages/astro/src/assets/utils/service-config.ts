import type { AstroConfig } from '../../types/public/config.js';

type ResolvedImageService = AstroConfig['image']['service'];
type ResolvedImageServiceConfig = Extract<ResolvedImageService, { entrypoint: string }>;

/** `image` config with `service` narrowed to a single target's service. */
export type TargetImageConfig = Omit<AstroConfig['image'], 'service'> & {
	service: ResolvedImageServiceConfig;
};

export function getImageServiceConfig(
	service: ResolvedImageService,
	target: 'build' | 'runtime',
): ResolvedImageServiceConfig {
	const resolved = 'runtime' in service ? service[target] : service;
	// The schema defaults `config` once, so a service set by an integration may not have it.
	return { ...resolved, config: resolved.config ?? {} };
}

export function getImageConfigFor(
	image: AstroConfig['image'],
	target: 'build' | 'runtime',
): TargetImageConfig {
	return { ...image, service: getImageServiceConfig(image.service, target) };
}
