import type { AstroConfig, AstroIntegrationLogger } from 'astro';
import type { Plugin } from 'vite';
import type { MdxOptions } from './index.js';
import { vitePluginMdxJs } from './vite-plugin-mdx-js.js';
import { vitePluginMdxRust } from './vite-plugin-mdx-rust.js';

export interface VitePluginMdxOptions {
	mdxOptions: MdxOptions;
	srcDir: URL;
	experimentalHeadingIdCompat: boolean;
	config?: AstroConfig;
	logger?: AstroIntegrationLogger;
}

/**
 * MDX Vite plugin router
 * Selects the appropriate MDX compiler based on configuration
 */
export function vitePluginMdx(opts: VitePluginMdxOptions): Plugin {
	// Determine which compiler to use
	const compilerMode = (opts.config?.experimental as any)?.mdxCompiler || 'js';
	
	if (compilerMode === 'rs') {
		// Use Rust compiler for better performance
		return vitePluginMdxRust(opts);
	} else {
		// Use JavaScript compiler (default)
		return vitePluginMdxJs(opts);
	}
}