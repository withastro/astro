import type { SSRResult } from 'astro';
export type RendererContext = {
	result: SSRResult;
};

export type SignalLike = {
	peek(): any;
};

export type PropNameToSignalMap = Map<string, SignalLike>;

export type AstroPreactAttrs = {
	['data-preact-signals']?: string;
};
