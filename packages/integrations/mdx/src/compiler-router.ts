import type { AstroIntegrationLogger } from 'astro';
import type { MdxOptions } from './index.js';

type CompilerMode = 'js' | 'rs' | 'auto';

/**
 * Default plugin threshold for automatic mode selection.
 * When plugin count exceeds this, JS mode may be more efficient.
 */
const DEFAULT_PLUGIN_THRESHOLD = 10;

/**
 * Counts the total number of plugins (remark + rehype + recma)
 */
function countPlugins(options: MdxOptions): number {
	let count = 0;
	if (options.remarkPlugins) count += options.remarkPlugins.length;
	if (options.rehypePlugins) count += options.rehypePlugins.length;
	if (options.recmaPlugins) count += options.recmaPlugins.length;
	return count;
}

/**
 * Determines the optimal compiler mode based on plugin count
 */
function selectOptimalMode(options: MdxOptions, requestedMode: CompilerMode, logger: AstroIntegrationLogger): CompilerMode {
	if (requestedMode !== 'auto') {
		return requestedMode;
	}

	const pluginCount = countPlugins(options);
	const threshold = process.env.MDX_PLUGIN_THRESHOLD 
		? parseInt(process.env.MDX_PLUGIN_THRESHOLD) 
		: DEFAULT_PLUGIN_THRESHOLD;

	logger.info(`MDX: Auto mode - ${pluginCount} plugins detected (threshold: ${threshold})`);

	// Use Rust for low plugin counts, JS for high plugin counts
	if (pluginCount <= threshold) {
		logger.info(`MDX: Auto selected 'rs' mode (plugin count ${pluginCount} <= ${threshold})`);
		return 'rs';
	} else {
		logger.info(`MDX: Auto selected 'js' mode (plugin count ${pluginCount} > ${threshold})`);
		return 'js';
	}
}

/**
 * Wraps a processor with performance and memory metrics logging
 */
function wrapProcessorWithMetrics(processor: any, mode: string, logger: AstroIntegrationLogger) {
	if (!process.env.MDX_PERF_LOG) {
		return processor;
	}

	return {
		async process(vfile: any) {
			const memBefore = process.memoryUsage();
			const start = performance.now();
			const result = await processor.process(vfile);
			const time = performance.now() - start;
			const memAfter = process.memoryUsage();
			
			const memDelta = {
				rss: (memAfter.rss - memBefore.rss) / 1024 / 1024,
				heapUsed: (memAfter.heapUsed - memBefore.heapUsed) / 1024 / 1024,
				heapTotal: (memAfter.heapTotal - memBefore.heapTotal) / 1024 / 1024,
			};
			
			logger.info(
				`MDX Performance: ${vfile.path || 'unknown'} - ${time.toFixed(2)}ms (${mode}) | ` +
				`Memory: RSS Δ${memDelta.rss.toFixed(2)}MB, Heap Δ${memDelta.heapUsed.toFixed(2)}MB`,
			);
			return result;
		},
	};
}

/**
 * Routes to the appropriate MDX compiler based on configuration
 */
export async function routeToCompiler(
	options: MdxOptions,
	mode: CompilerMode,
	logger: AstroIntegrationLogger,
) {
	logger.info(`MDX: Requested compiler mode: ${mode}`);

	// Determine the actual mode to use
	const actualMode = selectOptimalMode(options, mode, logger);

	// For 'rs' mode, try to use Rust compiler
	if (actualMode === 'rs') {
		logger.info('MDX: Attempting to use Rust compiler...');
		try {
			// Check if mdx-rs-parser is available
			const { isRustCompilerAvailable } = await import('./processors/rust.js');

			if (await isRustCompilerAvailable()) {
				logger.info('MDX: Rust compiler available, using high-performance compilation');
				const { createRustProcessor } = await import('./processors/rust.js');
				const processor = await createRustProcessor(options);
				return wrapProcessorWithMetrics(processor, 'rust', logger);
			} else {
				logger.info('MDX: Rust compiler not available (mdx-rs-parser not built)');
			}
		} catch (error: any) {
			logger.warn(`MDX: Rust compiler initialization failed: ${error.message}`);
		}

		// Fall back to JS processor
		logger.info('MDX: Falling back to JS processor');
		const { createJSProcessor } = await import('./processors/js.js');
		return wrapProcessorWithMetrics(await createJSProcessor(options), 'js', logger);
	}

	// Default to JS processor
	logger.info('MDX: Using standard JS processor');
	const { createJSProcessor } = await import('./processors/js.js');
	return wrapProcessorWithMetrics(await createJSProcessor(options), 'js', logger);
}
