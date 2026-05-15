import type { WorkerConfig } from '@cloudflare/vite-plugin';
export declare const DEFAULT_SESSION_KV_BINDING_NAME = 'SESSION';
export declare const DEFAULT_IMAGES_BINDING_NAME = 'IMAGES';
export declare const DEFAULT_ASSETS_BINDING_NAME = 'ASSETS';
interface CloudflareConfigOptions {
	sessionKVBindingName?: string | undefined;
	needsSessionKVBinding?: boolean;
	imagesBindingName?: string | false | undefined;
}
/**
 * Returns a config customizer that sets up the Astro Cloudflare defaults.
 * Sets the main entrypoint and adds bindings for auto-provisioning.
 */
export declare function cloudflareConfigCustomizer(
	options?: CloudflareConfigOptions,
): (config: Partial<WorkerConfig>) => Partial<WorkerConfig>;
export {};
