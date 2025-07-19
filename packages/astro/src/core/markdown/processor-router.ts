import type { MarkdownProcessor } from '@astrojs/markdown-remark';
import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import type { AstroSettings } from '../../types/astro.js';
import { createRustMarkdownProcessor } from './rs-processor.js';

export interface MarkdownProcessorConfig {
	image: AstroSettings['config']['image'];
	experimentalHeadingIdCompat: boolean;
	experimentalRs: boolean;
	rsOptions: {
		fallbackToJs: boolean;
		cacheDir: string;
		parallelism: number;
	};
	[key: string]: any; // Allow other markdown config options to pass through
}

/**
 * Creates a markdown processor, choosing between JavaScript and Rust implementations
 * based on configuration and availability.
 */
export async function createMarkdownProcessorRouter(
	config: MarkdownProcessorConfig,
): Promise<MarkdownProcessor> {
	// If experimental Rust processor is not enabled, use JavaScript processor
	if (!config.experimentalRs) {
		return createMarkdownProcessor(config);
	}

	try {
		// Try to create the Rust processor first
		return await createRustMarkdownProcessor(config);
	} catch (error) {
		// If Rust processor fails and fallback is enabled, use JavaScript processor
		if (config.rsOptions.fallbackToJs) {
			// Log the error for debugging
			return createMarkdownProcessor(config);
		}

		// If fallback is disabled, re-throw the error
		throw error;
	}
}
