import type { PluginConfig, WorkerConfig } from '@cloudflare/vite-plugin';
import type { AstroIntegrationLogger } from 'astro';

export const DEFAULT_SESSION_KV_BINDING_NAME = 'SESSION';
export const DEFAULT_IMAGES_BINDING_NAME = 'IMAGES';
export const DEFAULT_ASSETS_BINDING_NAME = 'ASSETS';

// Default compatibility date used when the user doesn't set one in their wrangler config.
// The @cloudflare/vite-plugin falls back to today's date, but that can exceed the maximum
// date supported by the bundled workerd binary (which has a ~7 day buffer from its build date),
// causing ERR_RUNTIME_FAILURE. A hard-coded date avoids this issue.
// This should be updated when upgrading wrangler/workerd dependencies.
const DEFAULT_COMPATIBILITY_DATE = '2026-04-15';

interface CloudflareConfigOptions {
	sessionKVBindingName?: string | undefined;
	needsSessionKVBinding?: boolean;
	imagesBindingName?: string | false | undefined;
	needsWorkerCache?: boolean;
	/**
	 * When set, warns once if the session KV binding is injected without an `id`,
	 * since `wrangler deploy` will then provision a new KV namespace.
	 */
	logger?: AstroIntegrationLogger | undefined;
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
	// The customizer runs once per worker (entry, prerender, previews), so the
	// provisioning notice is deduplicated to a single warning per build.
	let hasWarnedAboutProvisioning = false;

	const customizer = (config: Partial<WorkerConfig>): Partial<WorkerConfig> => {
		const getNonInheritableBindings = (
			nonInheritableConfig: WorkerConfig['previews'],
		): WorkerConfig['previews'] => {
			const hasSessionBinding = nonInheritableConfig?.kv_namespaces?.some(
				(kv: KVNamespace) => kv.binding === sessionKVBindingName,
			);
			const hasImagesBinding = nonInheritableConfig?.images?.binding !== undefined;
			const injectsSessionBinding = needsSessionKVBinding && !hasSessionBinding;

			// The injected binding has no `id`, which wrangler reads as a request to
			// provision a namespace on deploy. That needs a token with
			// "Workers KV Storage: Edit", so surface it at build time rather than
			// letting the deploy fail with an opaque authentication error.
			if (injectsSessionBinding && options?.logger && !hasWarnedAboutProvisioning) {
				hasWarnedAboutProvisioning = true;
				options.logger.warn(
					`The "${sessionKVBindingName}" KV binding has no \`id\`, so \`wrangler deploy\` will provision a new KV namespace. ` +
						`This requires an API token with the "Workers KV Storage: Edit" permission.\n` +
						`  To use an existing namespace, add \`kv_namespaces: [{ binding: "${sessionKVBindingName}", id: "<id>" }]\` to your Wrangler config.\n` +
						`  To skip sessions entirely, set \`session: false\` in your Astro config.`,
				);
			}

			return {
				kv_namespaces: injectsSessionBinding ? [{ binding: sessionKVBindingName }] : undefined,
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
