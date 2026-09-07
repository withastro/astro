import type { PluginConfig, WorkerConfig } from '@cloudflare/vite-plugin';
import { getLocalWorkerdCompatibilityDate } from './info.js';

export const DEFAULT_SESSION_KV_BINDING_NAME = 'SESSION';
export const DEFAULT_IMAGES_BINDING_NAME = 'IMAGES';
export const DEFAULT_ASSETS_BINDING_NAME = 'ASSETS';

const DEFAULT_COMPATIBILITY_DATE = getLocalWorkerdCompatibilityDate().date;

/**
 * Compatibility flags that make `AsyncLocalStorage` (`node:async_hooks`)
 * available in workerd.
 */
const ALS_CAPABLE_FLAGS = ['nodejs_als', 'nodejs_compat', 'nodejs_compat_v2'];

/**
 * Returns the compatibility flags for the build-time prerender worker,
 * auto-appending `nodejs_als` when no ALS-capable flag is already present.
 *
 * The prerender worker installs an AsyncLocalStorage-backed render scope (see
 * `utils/prerender-scope.ts`) so concurrent prerender requests attribute
 * incremental-build metadata to the right path; `nodejs_als` makes
 * `node:async_hooks` resolvable in that worker. This only ever shapes the
 * transient build-time prerender worker config — the user's deployed wrangler
 * config is untouched.
 */
export function withNodejsAlsFlag(compatibilityFlags: string[] | undefined): string[] {
	const flags = compatibilityFlags ?? [];
	if (flags.some((flag) => ALS_CAPABLE_FLAGS.includes(flag))) {
		return flags;
	}
	return [...flags, 'nodejs_als'];
}

interface CloudflareConfigOptions {
	sessionKVBindingName?: string | undefined;
	needsSessionKVBinding?: boolean;
	imagesBindingName?: string | false | undefined;
	needsWorkerCache?: boolean;
}

type KVNamespace = NonNullable<WorkerConfig['kv_namespaces']>[number];

/**
 * Returns a config customizer that sets up the Astro Cloudflare defaults.
 * Sets the main entrypoint and adds bindings for auto-provisioning.
 */
export function cloudflareConfigCustomizer(
	options?: CloudflareConfigOptions,
): (config: Partial<WorkerConfig>) => Partial<WorkerConfig> {
	const sessionKVBindingName = options?.sessionKVBindingName ?? DEFAULT_SESSION_KV_BINDING_NAME;
	const needsSessionKVBinding = options?.needsSessionKVBinding ?? true;
	const imagesBindingName =
		options?.imagesBindingName === false
			? undefined
			: (options?.imagesBindingName ?? DEFAULT_IMAGES_BINDING_NAME);
	const needsWorkerCache = options?.needsWorkerCache ?? false;

	const customizer = (config: Partial<WorkerConfig>): Partial<WorkerConfig> => {
		const getNonInheritableBindings = (
			nonInheritableConfig: WorkerConfig['previews'],
		): WorkerConfig['previews'] => {
			const hasSessionBinding = nonInheritableConfig?.kv_namespaces?.some(
				(kv: KVNamespace) => kv.binding === sessionKVBindingName,
			);
			const hasImagesBinding = nonInheritableConfig?.images?.binding !== undefined;

			return {
				kv_namespaces:
					!needsSessionKVBinding || hasSessionBinding
						? undefined
						: [{ binding: sessionKVBindingName }],
				images:
					hasImagesBinding || !imagesBindingName
						? undefined
						: {
								binding: imagesBindingName,
							},
			};
		};

		const hasAssetsBinding = config.assets?.binding !== undefined;

		return {
			...getNonInheritableBindings(config),
			compatibility_date: config.compatibility_date ?? DEFAULT_COMPATIBILITY_DATE,
			main: config.main ?? '@astrojs/cloudflare/entrypoints/server',
			assets: hasAssetsBinding
				? undefined
				: {
						binding: DEFAULT_ASSETS_BINDING_NAME,
					},
			// Enable the Worker caching layer when a Cloudflare cache provider is configured
			cache:
				needsWorkerCache && config.cache?.enabled === undefined ? { enabled: true } : undefined,
			previews: getNonInheritableBindings(config.previews),
		};
	};

	return customizer satisfies PluginConfig['config'];
}
