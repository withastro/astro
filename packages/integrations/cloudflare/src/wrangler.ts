import type { PluginConfig, WorkerConfig } from '@cloudflare/vite-plugin';

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
			previews: getNonInheritableBindings(config.previews),
		};
	};

	return customizer satisfies PluginConfig['config'];
}
