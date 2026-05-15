const DEFAULT_SESSION_KV_BINDING_NAME = 'SESSION';
const DEFAULT_IMAGES_BINDING_NAME = 'IMAGES';
const DEFAULT_ASSETS_BINDING_NAME = 'ASSETS';
const DEFAULT_COMPATIBILITY_DATE = '2026-04-15';
function cloudflareConfigCustomizer(options) {
	const sessionKVBindingName = options?.sessionKVBindingName ?? DEFAULT_SESSION_KV_BINDING_NAME;
	const needsSessionKVBinding = options?.needsSessionKVBinding ?? true;
	const imagesBindingName =
		options?.imagesBindingName === false
			? void 0
			: (options?.imagesBindingName ?? DEFAULT_IMAGES_BINDING_NAME);
	const customizer = (config) => {
		const getNonInheritableBindings = (nonInheritableConfig) => {
			const hasSessionBinding = nonInheritableConfig?.kv_namespaces?.some(
				(kv) => kv.binding === sessionKVBindingName,
			);
			const hasImagesBinding = nonInheritableConfig?.images?.binding !== void 0;
			return {
				kv_namespaces:
					!needsSessionKVBinding || hasSessionBinding
						? void 0
						: [{ binding: sessionKVBindingName }],
				images:
					hasImagesBinding || !imagesBindingName
						? void 0
						: {
								binding: imagesBindingName,
							},
			};
		};
		const hasAssetsBinding = config.assets?.binding !== void 0;
		return {
			...getNonInheritableBindings(config),
			compatibility_date: config.compatibility_date ?? DEFAULT_COMPATIBILITY_DATE,
			main: config.main ?? '@astrojs/cloudflare/entrypoints/server',
			assets: hasAssetsBinding
				? void 0
				: {
						binding: DEFAULT_ASSETS_BINDING_NAME,
					},
			previews: getNonInheritableBindings(config.previews),
		};
	};
	return customizer;
}
export {
	DEFAULT_ASSETS_BINDING_NAME,
	DEFAULT_IMAGES_BINDING_NAME,
	DEFAULT_SESSION_KV_BINDING_NAME,
	cloudflareConfigCustomizer,
};
