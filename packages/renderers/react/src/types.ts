import type { FilterPattern } from '@astrojs/internal-helpers/create-filter';
import type { SSRResult } from '@astrojs/runtime/types';

export type RendererContext = {
	/** Astro pages set `request`, and `actionResult` for a form submitted to an Action. */
	result: SSRResult & { request?: Request; actionResult?: unknown };
	/** The `options` of the renderer returned by `react()` from `@astrojs/react-renderer`. */
	options?: RendererOptions;
};

export type RendererOptions = {
	include?: FilterPattern;
	exclude?: FilterPattern;
	experimentalReactChildren?: boolean;
	experimentalDisableStreaming?: boolean;
};
