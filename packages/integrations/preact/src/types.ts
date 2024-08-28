import type { SSRResult } from 'astro';
export type RendererContext = {
	result: SSRResult;
};

export type SignalLike = {
	peek(): any;
};

export type Signals = Record<string, Record<string, string> | string>;
export type PropNameToSignalMap = Map<string, SignalLike>;

export type AstroPreactAttrs = {
	['data-preact-signals']?: string;
};
