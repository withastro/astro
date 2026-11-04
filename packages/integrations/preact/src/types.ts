import type { SSRResult } from 'astro';
import type { FilterPattern } from 'vite';

export type RendererContext = {
	result: SSRResult;
	/** The `options` of the renderer returned by `preact()` from `@astrojs/preact/renderer`. */
	options?: RendererOptions;
};

export type SignalLike = {
	peek(): any;
};

export type ArrayObjectMapping = [string, number | string][];
export type Signals = Record<string, string | ArrayObjectMapping>;

export type SignalToKeyOrIndexMap = [SignalLike, number | string][];
export type PropNameToSignalMap = Map<string, SignalLike | SignalToKeyOrIndexMap>;

export type AstroPreactAttrs = {
	['data-preact-signals']?: string;
	['data-preact-island-id']?: string;
};

export type RendererOptions = {
	include?: FilterPattern;
	exclude?: FilterPattern;
};
