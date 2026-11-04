import type { FilterPattern } from 'vite';
import type { SSRResult } from 'astro';

export type RendererContext = {
	result: SSRResult;
	/** The `options` of the renderer returned by `react()` from `@astrojs/react/renderer`. */
	options?: RendererOptions;
};

export type RendererOptions = {
	include?: FilterPattern;
	exclude?: FilterPattern;
	experimentalReactChildren?: boolean;
	experimentalDisableStreaming?: boolean;
};
