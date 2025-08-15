import type { AstroConfig, AstroIntegrationLogger, SSRError } from 'astro';
import { getAstroMetadata } from 'astro/jsx/rehype.js';
import { VFile } from 'vfile';
import type { Plugin } from 'vite';
import type { MdxOptions } from './index.js';
import { createRustProcessor } from './processors/rust.js';

export interface VitePluginMdxRustOptions {
	mdxOptions: MdxOptions;
	srcDir: URL;
	experimentalHeadingIdCompat: boolean;
	config?: AstroConfig;
	logger?: AstroIntegrationLogger;
}

/**
 * Vite plugin for MDX processing using Rust compiler
 * This plugin handles the complete MDX → JavaScript transformation
 * using the native Rust parser/compiler for better performance.
 */
export function vitePluginMdxRust(opts: VitePluginMdxRustOptions): Plugin {
	let processor: Awaited<ReturnType<typeof createRustProcessor>> | undefined;
	let sourcemapEnabled: boolean;

	return {
		name: '@astrojs/mdx-rust',
		enforce: 'pre',
		
		buildEnd() {
			processor = undefined;
		},
		
		configResolved(resolved) {
			sourcemapEnabled = !!resolved.build.sourcemap;
			
			// Note: In Rust mode, we generate complete ES modules
			// so we don't need to remove the astro:jsx plugin
			// as it won't conflict with our output
		},
		
		async resolveId(source, importer, options) {
			if (importer?.endsWith('.mdx') && source[0] !== '/') {
				let resolved = await this.resolve(source, importer, options);
				if (!resolved) resolved = await this.resolve('./' + source, importer, options);
				return resolved;
			}
		},
		
		async transform(code, id) {
			if (!id.endsWith('.mdx')) return;

			// Lazily initialize the processor
			if (!processor) {
				processor = await createRustProcessor(opts.mdxOptions);
			}

			const vfile = new VFile({
				value: code,
				path: id,
			});

			// Initialize Astro metadata on the vfile
			vfile.data.astro = {
				frontmatter: {},
				headings: [],
				localImagePaths: [],
				remoteImagePaths: [],
			};

			try {
				// Process the MDX content with Rust compiler
				const result = await processor.process(vfile);
				
				// The Rust processor returns a complete ES module
				// with all necessary exports (frontmatter, getHeadings, default)
				let compiledCode = String(result.value);
				
				// Extract and attach metadata for Astro
				const astroMetadata = getAstroMetadata(vfile);
				if (astroMetadata) {
					compiledCode += `\nexport const $$astro = ${JSON.stringify(astroMetadata)};`;
				}

				// Log performance metrics if enabled
				if (process.env.MDX_PERF_LOG === '1' && opts.logger) {
					opts.logger.info(`Processed ${id} with Rust compiler`);
				}

				return {
					code: compiledCode,
					map: sourcemapEnabled ? result.map : null,
					meta: {
						astro: vfile.data.astro,
					},
				};
			} catch (error: any) {
				// Handle compilation errors
				const err: SSRError = new Error(error.message) as SSRError;
				err.stack = error.stack || '';
				err.id = id;
				
				if (error.position) {
					err.loc = {
						file: id,
						line: error.position.start.line,
						column: error.position.start.column,
					};
				}

				// Add error hint for common issues
				if (error.message.includes('Unexpected character')) {
					err.hint = 'MDX syntax error. Check for unclosed JSX tags or invalid JavaScript expressions.';
				}

				throw err;
			}
		},
	};
}