import type { AstroConfig, AstroPrerenderer } from 'astro';
import { type PluginConfig } from '@cloudflare/vite-plugin';
interface CloudflarePrerendererOptions {
	cloudflareOptions: Partial<PluginConfig>;
	root: AstroConfig['root'];
	serverDir: AstroConfig['build']['server'];
	clientDir: AstroConfig['build']['client'];
	base: AstroConfig['base'];
	trailingSlash: AstroConfig['trailingSlash'];
	cfPluginConfig: PluginConfig;
	hasCompileImageService: boolean;
}
/**
 * Creates a prerenderer that uses Cloudflare's workerd runtime via a preview server.
 * This allows prerendering to happen in the same runtime that will serve the pages.
 */
export declare function createCloudflarePrerenderer({
	cloudflareOptions,
	root,
	serverDir,
	clientDir,
	base,
	trailingSlash,
	cfPluginConfig,
	hasCompileImageService,
}: CloudflarePrerendererOptions): AstroPrerenderer;
export {};
