/**
 * Astro assumes one image service runs everywhere. On Cloudflare we have three
 * execution contexts that all need to agree on image URLs and hashes: build
 * (workerd — no native Node modules), dev (Node behind workerd proxy), and
 * runtime (deployed Worker). All user config is normalised into a
 * `{ buildService, devService, runtimeService }` triple.
 *
 * ```
 * User config (imageService option)
 *   → normalizeImageServiceConfig()         → NormalizedImageConfig (triple)
 *   → setImageConfig()                      → config.image.service (per-command)
 *   → index.ts config:setup                 → Vite plugins wired up
 *   → vite-plugin-image-service.ts          → virtual:image-service branching
 *   → vite-plugin-dev-image-middleware.ts   → /_image Node handler in dev
 *   → index.ts config:done                  → captures final entrypoint for compile
 *   → prerenderer.ts collectStaticImages()  → loads service in Node for transforms
 * ```
 */
import type { AstroConfig, AstroIntegrationLogger, HookParameters } from 'astro';
import type { ImageServiceConfig as AstroImageServiceConfig } from 'astro';
import { passthroughImageService } from 'astro/config';

/** Named presets that expand into a full build / dev / runtime configuration. */
export type ImageServicePreset = 'cloudflare' | 'cloudflare-binding' | 'compile' | 'passthrough';

/** Shorthand service names; any other string is treated as an entrypoint. */
type ImageServiceName = 'sharp' | 'passthrough' | 'cloudflare' | 'cloudflare-binding' | (string & {});

/** A service reference: a shorthand name, a bare entrypoint, or a { entrypoint, config } object. */
type ImageServiceSlot =
	| ImageServiceName
	| { entrypoint: ImageServiceName; config?: Record<string, any> };

/** Explicit per-phase image service configuration. */
export interface ImageServiceObject {
	build: ImageServiceSlot;
	dev: ImageServiceSlot;
	runtime: ImageServiceSlot;
	/**
	 * Whether image transforms run at build time in Node.
	 * - `true`: the build service is compiled as a Rollup chunk and loaded in Node
	 *   for real transforms after prerendering. The workerd stub handles URL generation.
	 * - `false`: the build service runs directly in workerd with no compilation step.
	 * - `undefined` (default): auto-detected from the build service entrypoint.
	 *   Unknown entrypoints are assumed to need Node.
	 */
	transformAtBuild?: boolean;
}

/** Shorthand { entrypoint, config? } form — same as a bare string but carries optional config. */
export interface ImageServiceEntrypoint {
	entrypoint: ImageServiceName;
	config?: Record<string, any>;
}

export type ImageServiceOption =
	| ImageServicePreset
	| ImageServiceObject
	| ImageServiceEntrypoint
	| (string & {});

export interface NormalizedImageConfig {
	buildService: AstroImageServiceConfig;
	devService: AstroImageServiceConfig;
	runtimeService: AstroImageServiceConfig;
	/** When true, images are optimized at build time in Node, not at runtime in workerd. */
	transformsAtBuild: boolean;
	/**
	 * Entrypoint to emit as a Node-side bundle for build-time image transforms.
	 * Not set for preset/string configs — the entrypoint is unknown at normalize time and
	 * read from `config.image.service` in `config:done` after all integrations have run.
	 * This means any integration that sets `config.image.service` in its `config:setup`
	 * hook will have its entrypoint picked up automatically by the `compile` preset.
	 */
	serviceEntrypoint?: string;
	/**
	 * When true, `runtimeService` is resolved from `config.image.service` in `setImageConfig`
	 * rather than from the normalised triple. Used by the deprecated `'custom'` preset to
	 * preserve the user's existing image service at runtime.
	 *
	 * TODO: remove when 'custom' preset is removed
	 */
	runtimeServiceFromConfig?: boolean;
}

/** Cloudflare external image service (cdn-cgi/image URL transforms). */
const CF_EXTERNAL_SERVICE: AstroImageServiceConfig = {
	entrypoint: '@astrojs/cloudflare/image-service',
};

/** Workerd-compatible image service stub: baseService (no sharp) + passthrough transform. */
const WORKERD_STUB_SERVICE: AstroImageServiceConfig = {
	entrypoint: '@astrojs/cloudflare/image-service-workerd',
};

/** Endpoint that uses the Cloudflare IMAGES binding for real transforms. */
const BINDING_ENDPOINT: NonNullable<AstroConfig['image']['endpoint']> = {
	route: '/_image',
	entrypoint: '@astrojs/cloudflare/image-transform-endpoint',
};

/** Generic Astro endpoint that loads images via fetch (no node:fs). */
const GENERIC_ENDPOINT: NonNullable<AstroConfig['image']['endpoint']> = {
	route: '/_image',
	entrypoint: 'astro/assets/endpoint/generic',
};

/** Services that can run inside workerd — everything else needs Node (transformsAtBuild). */
export const WORKERD_COMPATIBLE_ENTRYPOINTS = new Set([
	'@astrojs/cloudflare/image-service-workerd',
	'@astrojs/cloudflare/image-service',
	'astro/assets/services/noop',
]);

/** Resolve a shorthand name to a full Astro image service config. */
function resolveName(name: string): AstroImageServiceConfig {
	switch (name) {
		case 'sharp':
			return { entrypoint: 'astro/assets/services/sharp' };
		case 'passthrough':
			return passthroughImageService();
		case 'cloudflare':
			return CF_EXTERNAL_SERVICE;
		case 'cloudflare-binding':
			return WORKERD_STUB_SERVICE;
		case 'compile':
			throw new Error(
				`"compile" is a preset, not a service. Use \`imageService: 'compile'\` or specify individual services in { build, dev, runtime }.`,
			);
		default:
			return { entrypoint: name };
	}
}

/** Resolve a slot (shorthand string or { entrypoint, config } object) to a full Astro image service config. */
function resolveSlot(slot: ImageServiceSlot): AstroImageServiceConfig {
	if (typeof slot === 'string') {
		return resolveName(slot);
	}
	const resolved = resolveName(slot.entrypoint);
	if (slot.config) {
		return { ...resolved, config: { ...resolved.config, ...slot.config } };
	}
	return resolved;
}

/** Expand a preset name into build / dev / runtime image service configs. */
export function expandPreset(preset: ImageServicePreset): NormalizedImageConfig {
	switch (preset) {
		case 'cloudflare':
			return {
				buildService: CF_EXTERNAL_SERVICE,
				devService: { entrypoint: 'astro/assets/services/sharp' },
				runtimeService: CF_EXTERNAL_SERVICE,
				transformsAtBuild: false,
			};
		case 'cloudflare-binding':
			return {
				buildService: WORKERD_STUB_SERVICE,
				devService: WORKERD_STUB_SERVICE,
				runtimeService: WORKERD_STUB_SERVICE,
				transformsAtBuild: false,
			};
		case 'compile':
			return {
				buildService: WORKERD_STUB_SERVICE,
				devService: { entrypoint: 'astro/assets/services/sharp' },
				runtimeService: passthroughImageService(),
				transformsAtBuild: true,
			};
		case 'passthrough':
			return {
				buildService: passthroughImageService(),
				devService: passthroughImageService(),
				runtimeService: passthroughImageService(),
				transformsAtBuild: false,
			};
		default:
			throw new Error(
				`Unknown image service preset "${preset}". Valid presets: cloudflare, cloudflare-binding, compile, passthrough. For custom services, use { build, dev, runtime } or { entrypoint }.`,
			);
	}
}

const PRESETS = new Set<string>(['cloudflare', 'cloudflare-binding', 'compile', 'passthrough']);

/** Normalize user-facing config into a resolved build / dev / runtime triple. */
export function normalizeImageServiceConfig(
	config: ImageServiceOption | undefined,
	logger?: AstroIntegrationLogger,
): NormalizedImageConfig {
	if (config === undefined) {
		return expandPreset('cloudflare-binding');
	}

	if (typeof config === 'string') {
		// TODO: remove this entire block when 'custom' preset is removed
		// Backwards compatibility: 'custom' was a no-op that passed through config.image unchanged.
		// We use the compile pipeline (workerd stub for build, sharp for dev) but preserve the
		// user's config.image.service at runtime via the runtimeServiceFromConfig flag.
		if (config === 'custom') {
			logger?.warn(
				`imageService: 'custom' is deprecated. Use the adapter's imageService option directly with { entrypoint, config } or a named preset instead.`,
			);
			return {
				buildService: WORKERD_STUB_SERVICE,
				devService: { entrypoint: 'astro/assets/services/sharp' },
				runtimeService: passthroughImageService(), // placeholder — overridden in setImageConfig
				transformsAtBuild: true,
				runtimeServiceFromConfig: true,
			};
		}
		if (PRESETS.has(config)) {
			return expandPreset(config as ImageServicePreset);
		}
		if (config === 'sharp') {
			throw new Error(
				`Use imageService: 'compile' instead of 'sharp'. The 'sharp' shorthand is only valid inside { build, dev, runtime } slots.`,
			);
		}
		const resolved = resolveName(config);
		const willTransformAtBuild = !WORKERD_COMPATIBLE_ENTRYPOINTS.has(resolved.entrypoint);
		return {
			buildService: willTransformAtBuild ? WORKERD_STUB_SERVICE : resolved,
			devService: resolved,
			runtimeService: willTransformAtBuild ? passthroughImageService() : resolved,
			transformsAtBuild: willTransformAtBuild,
			serviceEntrypoint: willTransformAtBuild ? resolved.entrypoint : undefined,
		};
	}

	if ('entrypoint' in config && !('build' in config)) {
		const ep = (config as ImageServiceEntrypoint).entrypoint;
		if (ep === 'sharp') {
			throw new Error(
				`Use imageService: 'compile' instead of { entrypoint: 'sharp' }. The 'sharp' shorthand is only valid inside { build, dev, runtime } slots.`,
			);
		}
		if (PRESETS.has(ep)) {
			throw new Error(
				`Use imageService: '${ep}' instead of { entrypoint: '${ep}' }. Presets should be passed directly as a string.`,
			);
		}
		const resolved = resolveSlot(config as ImageServiceEntrypoint);
		const willTransformAtBuild = !WORKERD_COMPATIBLE_ENTRYPOINTS.has(resolved.entrypoint);
		return {
			buildService: willTransformAtBuild
				? resolved.config
					? { ...WORKERD_STUB_SERVICE, config: resolved.config }
					: WORKERD_STUB_SERVICE
				: resolved,
			devService: resolved,
			runtimeService: willTransformAtBuild ? passthroughImageService() : resolved,
			transformsAtBuild: willTransformAtBuild,
			serviceEntrypoint: willTransformAtBuild ? resolved.entrypoint : undefined,
		};
	}

	const triple = config as ImageServiceObject;
	const buildResolved = resolveSlot(triple.build);
	const devResolved = resolveSlot(triple.dev);
	const runtimeResolved = resolveSlot(triple.runtime);

	const willTransformAtBuild =
		triple.transformAtBuild ?? !WORKERD_COMPATIBLE_ENTRYPOINTS.has(buildResolved.entrypoint);

	// When swapping to the workerd stub, preserve the original service's config.
	// The stub ignores it (URL generation only), but Astro passes
	// config.image.service.config through to transform() via imageConfig.
	const buildService = willTransformAtBuild
		? buildResolved.config
			? { ...WORKERD_STUB_SERVICE, config: buildResolved.config }
			: WORKERD_STUB_SERVICE
		: buildResolved;

	return {
		buildService,
		devService: devResolved,
		runtimeService: runtimeResolved,
		transformsAtBuild: willTransformAtBuild,
		serviceEntrypoint: willTransformAtBuild ? buildResolved.entrypoint : undefined,
	};
}

/** Determine the /_image endpoint handler for a given image service. */
export function resolveEndpoint(
	service: AstroImageServiceConfig,
): NonNullable<AstroConfig['image']['endpoint']> | undefined {
	if (service.entrypoint === '@astrojs/cloudflare/image-service-workerd') {
		return BINDING_ENDPOINT;
	}
	if (service.entrypoint === 'astro/assets/services/noop') {
		return GENERIC_ENDPOINT;
	}
	// For any other service (sharp, custom, etc.), use the generic endpoint
	// to avoid Astro's dev.ts fallback which imports vite and crashes the dep optimizer.
	return GENERIC_ENDPOINT;
}

/**
 * Set the Astro image config for the current command.
 *
 * `config.image.service` = what processes images for the current command.
 * `config.image.endpoint` = the /_image route handler — derived from dev service
 * (in dev) or runtime service (in build, since the endpoint runs in the deployed worker).
 */
export function setImageConfig(
	normalized: NormalizedImageConfig,
	config: AstroConfig['image'],
	command: HookParameters<'astro:config:setup'>['command'],
	logger: AstroIntegrationLogger,
): AstroConfig['image'] {
	// TODO: remove when 'custom' preset is removed
	if (normalized.runtimeServiceFromConfig) {
		normalized = { ...normalized, runtimeService: config.service };
	}

	if (normalized.runtimeService.entrypoint === 'astro/assets/services/sharp') {
		logger.warn(
			'Sharp cannot run in the Cloudflare Workers runtime. The runtime image service has been automatically switched to passthrough.',
		);
		normalized = { ...normalized, runtimeService: passthroughImageService() };
	}

	const activeService = command === 'dev' ? normalized.devService : normalized.buildService;
	const endpointSource = command === 'dev' ? normalized.devService : normalized.runtimeService;

	return {
		...config,
		service: { config: {}, ...activeService },
		endpoint: resolveEndpoint(endpointSource) ?? config.endpoint,
	};
}
