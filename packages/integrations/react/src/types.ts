import type { SSRResult } from 'astro';

export type RendererContext = {
	result: SSRResult;
};

export type VirtualModuleOptions = {
	/** Pre-compiled RegExp patterns from include globs (compiled at build time) */
	include?: RegExp[];
	/** Pre-compiled RegExp patterns from exclude globs (compiled at build time) */
	exclude?: RegExp[];
	experimentalReactChildren?: boolean;
	experimentalDisableStreaming?: boolean;
};
