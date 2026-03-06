import type { SSRResult } from 'astro';
import type { FilterPattern } from 'vite';

export type RendererContext = {
	result: SSRResult;
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
};

export type VirtualModuleOptions = {
	include?: FilterPattern;
	exclude?: FilterPattern;
};
