import type { SSRResult } from 'astro';
export type RendererContext = {
	result: SSRResult;
};

// A branded island signal accessor or setter
export type IslandSignalLike = Function;

export type ArrayObjectMapping = [string, number | string][];
export type Signals = Record<string, string | ArrayObjectMapping>;

export type SignalToKeyOrIndexMap = [IslandSignalLike, number | string][];
export type PropNameToSignalMap = Map<string, IslandSignalLike | SignalToKeyOrIndexMap>;

export type AstroSolidAttrs = {
	['data-solid-render-id']?: string;
	['data-solid-signals']?: string;
};
