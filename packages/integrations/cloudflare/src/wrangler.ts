import type { PluginConfig, WorkerConfig } from '@cloudflare/vite-plugin';

export const DEFAULT_SESSION_KV_BINDING_NAME = 'SESSION';
export const DEFAULT_IMAGES_BINDING_NAME = 'IMAGES';
export const DEFAULT_ASSETS_BINDING_NAME = 'ASSETS';

interface CloudflareConfigOptions {
	sessionKVBindingName?: string | undefined;
	needsSessionKVBinding?: boolean;
	imagesBindingName?: string | false | undefined;
}

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
				(kv) => kv.binding === sessionKVBindingName,
			);
			const hasImagesBinding = nonInheritableConfig?.images?.binding !== undefined;

			return {
				kv_namespaces:
					!needsSessionKVBinding || hasSessionBinding
						? undefined
						: [
								{
									binding: sessionKVBindingName,
								},
							],
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
