import type { RendererContext } from './types.js';
type Context = {
	id: string;
	c: number;
};
export declare function getContext(result: RendererContext['result']): Context;
export declare function incrementId(ctx: Context): string;
export {};
