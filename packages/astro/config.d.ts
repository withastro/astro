type ViteUserConfig = import('vite').UserConfig;
type ViteUserConfigFn = import('vite').UserConfigFn;
type AstroUserConfig = import('./dist/@types/astro.js').AstroUserConfig;
type ImageServiceConfig = import('./dist/@types/astro.js').ImageServiceConfig;

/**
 * See the full Astro Configuration API Documentation
 * https://astro.build/config
 */
export function defineConfig(config: AstroUserConfig): AstroUserConfig;

/**
 * Use Astro to generate a fully resolved Vite config
 */
export function getViteConfig(config: ViteUserConfig): ViteUserConfigFn;

/**
 * Return the configuration needed to use the Sharp-based image service
 */
export function sharpImageService(): ImageServiceConfig;

/**
 * Return the configuration needed to use the Squoosh-based image service
 * See: https://docs.astro.build/en/guides/images/#configure-squoosh
 */
export function squooshImageService(): ImageServiceConfig;

/**
 * Return the configuration needed to use the passthrough image service. This image services does not perform
 * any image transformations, and is mainly useful when your platform does not support other image services, or you are
 * not using Astro's built-in image processing.
 * See: https://docs.astro.build/en/guides/images/#configure-no-op-passthrough-service
 */
export function passthroughImageService(): ImageServiceConfig;
