import type { PluginConfig } from '@cloudflare/vite-plugin';

export const DEFAULT_SESSION_KV_BINDING_NAME = 'SESSION';
export const DEFAULT_IMAGES_BINDING_NAME = 'IMAGES';
export const DEFAULT_ASSETS_BINDING_NAME = 'ASSETS';

interface CloudflareConfigOptions {
	sessionKVBindingName: string | undefined;
	imagesBindingName: string | false | undefined;
}

/**
 * Returns a config customizer that sets up the Astro Cloudflare defaults.
 * Sets the main entrypoint and adds bindings for auto-provisioning.
 */
export function cloudflareConfigCustomizer(
	options: CloudflareConfigOptions,
): PluginConfig['config'] {
	const sessionKVBindingName = options?.sessionKVBindingName ?? DEFAULT_SESSION_KV_BINDING_NAME;
	const imagesBindingName =
		options?.imagesBindingName === false
			? undefined
			: (options?.imagesBindingName ?? DEFAULT_IMAGES_BINDING_NAME);

	return (config) => {
		const hasSessionBinding = config.kv_namespaces?.some(
			(kv) => kv.binding === sessionKVBindingName,
		);
		const hasImagesBinding = config.images?.binding !== undefined;
		const hasAssetsBinding = config.assets?.binding !== undefined;

		return {
			main: config.main ?? '@astrojs/cloudflare/entrypoints/server',
			kv_namespaces: hasSessionBinding
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
			assets: hasAssetsBinding
				? undefined
				: {
						binding: DEFAULT_ASSETS_BINDING_NAME,
					},
		};
	};
}
