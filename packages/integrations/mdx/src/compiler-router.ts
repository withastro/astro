import type { AstroIntegrationLogger } from 'astro';
import type { MdxOptions } from './index.js';

type CompilerMode = 'js' | 'rs';

/**
 * Routes to the appropriate MDX compiler based on configuration
 */
export async function routeToCompiler(
	options: MdxOptions,
	mode: CompilerMode,
	logger: AstroIntegrationLogger,
) {
	logger.info(`MDX: Requested compiler mode: ${mode}`);

	// For 'rs' mode, try to use Rust compiler
	if (mode === 'rs') {
		logger.info('MDX: Attempting to use Rust compiler...');
		try {
			// Check if mdx-rs-parser is available
			const { isRustCompilerAvailable } = await import('./processors/rust.js');

			if (await isRustCompilerAvailable()) {
				logger.info('MDX: Rust compiler available, using high-performance compilation');
				const { createRustProcessor } = await import('./processors/rust.js');
				const processor = await createRustProcessor(options);

				// Wrap processor to log metrics if enabled
				if (process.env.MDX_PERF_LOG) {
					return {
						async process(vfile: any) {
							const start = performance.now();
							const result = await processor.process(vfile);
							const time = performance.now() - start;
							logger.info(
								`MDX Performance: ${vfile.path || 'unknown'} - ${time.toFixed(2)}ms (rust)`,
							);
							return result;
						},
					};
				}
				return processor;
			} else {
				logger.info('MDX: Rust compiler not available (mdx-rs-parser not built)');
			}
		} catch (error: any) {
			logger.warn(`MDX: Rust compiler initialization failed: ${error.message}`);
		}

		// Fall back to JS processor
		logger.info('MDX: Falling back to JS processor');
		const { createJSProcessor } = await import('./processors/js.js');
		return createJSProcessor(options);
	}

	// Default to JS processor
	logger.info('MDX: Using standard JS processor');
	const { createJSProcessor } = await import('./processors/js.js');
	return createJSProcessor(options);
}
