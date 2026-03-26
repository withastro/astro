import type { PluginConfig } from '@cloudflare/vite-plugin';

export const DEFAULT_SESSION_KV_BINDING_NAME = 'SESSION';
export const DEFAULT_IMAGES_BINDING_NAME = 'IMAGES';
export const DEFAULT_ASSETS_BINDING_NAME = 'ASSETS';

interface CloudflareConfigOptions {
	sessionKVBindingName: string | undefined;
	needsSessionKVBinding?: boolean;
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
	const needsSessionKVBinding = options?.needsSessionKVBinding ?? true;
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
		// In Cloudflare Pages projects, the ASSETS binding is automatically
		// provided by the platform. Explicitly declaring it causes wrangler to
		// error with "The name 'ASSETS' is reserved in Pages projects".
		const isPagesProject = config.pages_build_output_dir !== undefined;

		return {
			main: config.main ?? '@astrojs/cloudflare/entrypoints/server',
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
			assets:
				hasAssetsBinding || isPagesProject
					? undefined
					: {
							binding: DEFAULT_ASSETS_BINDING_NAME,
						},
		};
	};
}
