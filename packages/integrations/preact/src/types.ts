import type { SSRResult } from 'astro';
export type RendererContext = {
	result: SSRResult;
};

export type SignalLike = {
	peek(): any;
}
